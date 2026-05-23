import { loginWithEmail, loginWithGoogle, signUpWithEmail } from '../../src/services/authService';
import { supabase } from '../../src/services/supabaseClient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock Supabase
jest.mock('../../src/services/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      setSession: jest.fn(),
      signUp: jest.fn(),
    },
  },
}));

// Mock Expo modules
jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'myapp://auth/callback'),
  parse: jest.fn(() => ({ queryParams: {} })),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('authService', () => {
  beforeEach(() => {
    jest.setTimeout(15000);
    jest.clearAllMocks();
  });

  describe('loginWithEmail', () => {
    it('should return invalid email error for bad formats', async () => {
      const res = await loginWithEmail('not-an-email', '123456');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Email không hợp lệ, vui lòng kiểm tra và nhập lại email.');
    });

    it('should handle invalid credentials and increment failed attempts', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('0');
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials', status: 400 },
      });

      const res = await loginWithEmail('test@gmail.com', 'wrongpassword');

      expect(res.success).toBe(false);
      expect(res.error).toContain('Sai mật khẩu. Vui lòng thử lại.');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@auth_failed_attempts', '1');
    });

    it('should lockout user after 5 failed attempts', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('4');
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials', status: 400 },
      });

      const res = await loginWithEmail('test@gmail.com', 'wrongpassword');

      expect(res.success).toBe(false);
      expect(res.error).toContain('Tài khoản của bạn tạm thời bị khóa 1 tiếng');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@auth_lockout_until',
        expect.any(String)
      );
    });
  });

  describe('loginWithGoogle (OAuth)', () => {
    it('should handle failure when Google provider is not enabled on Supabase backend', async () => {
      // Mock signInWithOAuth to fail because the provider is not enabled (Unsupported Provider)
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Unsupported provider: provider is not enabled'),
      });

      const res = await loginWithGoogle();

      expect(res.success).toBe(false);
      expect(res.error).toBe('Có lỗi xảy ra. Vui lòng thử đăng nhập lại.');
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'myapp://auth/callback',
          skipBrowserRedirect: true,
        },
      });
    });

    it('should handle scenario when user cancels the browser OAuth prompt', async () => {
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: 'https://supabase.co/auth/v1/authorize?provider=google' },
        error: null,
      });
      // Mock user cancelling the browser session
      (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
        type: 'cancel',
      });

      const res = await loginWithGoogle();

      expect(res.success).toBe(false);
      expect(res.error).toBe('Đăng nhập với Google bị hủy hoặc không thành công.');
    });

    it('should successfully complete sign in when OAuth parameters are correct', async () => {
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: 'https://supabase.co/auth/v1/authorize?provider=google' },
        error: null,
      });
      // Mock browser success redirect
      (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
        type: 'success',
        url: 'myapp://auth/callback?access_token=foo&refresh_token=bar',
      });
      // Mock parsing redirect URL parameters
      (Linking.parse as jest.Mock).mockReturnValue({
        queryParams: { access_token: 'foo', refresh_token: 'bar' },
      });
      // Mock successful session setting in Supabase client
      (supabase.auth.setSession as jest.Mock).mockResolvedValue({
        data: { session: {} },
        error: null,
      });

      const res = await loginWithGoogle();

      expect(res.success).toBe(true);
      expect(res.role).toBe('Free');
      expect(supabase.auth.setSession).toHaveBeenCalledWith({
        access_token: 'foo',
        refresh_token: 'bar',
      });
    });
  });

  describe('signUpWithEmail', () => {
    it('should return error if name is empty', async () => {
      const res = await signUpWithEmail('', 'test@gmail.com', 'password123', 'password123');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Vui lòng nhập họ và tên.');
    });

    it('should return error if email format is invalid', async () => {
      const res = await signUpWithEmail('Test User', 'bademail', 'password123', 'password123');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Email không hợp lệ, vui lòng kiểm tra và nhập lại email.');
    });

    it('should return error if password is less than 6 characters', async () => {
      const res = await signUpWithEmail('Test User', 'test@gmail.com', '123', '123');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Mật khẩu phải có ít nhất 6 ký tự.');
    });

    it('should return error if passwords mismatch', async () => {
      const res = await signUpWithEmail('Test User', 'test@gmail.com', 'password123', 'different');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Mật khẩu xác nhận không khớp.');
    });

    it('should call supabase.auth.signUp and handle success', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: { id: 'new-user-id', email: 'test@gmail.com' } },
        error: null,
      });

      const res = await signUpWithEmail('Nguyen Van A', 'test@gmail.com', 'password123', 'password123');
      
      expect(res.success).toBe(true);
      expect(res.user).toEqual({ id: 'new-user-id', email: 'test@gmail.com' });
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@gmail.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'Nguyen Van A',
          },
        },
      });
    });

    it('should handle signup error from supabase', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      const res = await signUpWithEmail('Nguyen Van A', 'test@gmail.com', 'password123', 'password123');

      expect(res.success).toBe(false);
      expect(res.error).toBe('Tài khoản email này đã được đăng ký hoặc không hợp lệ.');
    });
  });
});
