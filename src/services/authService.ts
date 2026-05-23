import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

WebBrowser.maybeCompleteAuthSession();

const ATTEMPTS_KEY = '@auth_failed_attempts';
const LOCKOUT_KEY = '@auth_lockout_until';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60 * 60 * 1000; // 1 hour in ms

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: any;
  role?: string;
}

export const loginWithGoogle = async (): Promise<LoginResult> => {
  try {
    const redirectUrl = Linking.createURL('auth/callback');
    console.log('--- GOOGLE LOGIN DEEP LINK URL ---');
    console.log('Generated Redirect URL:', redirectUrl);
    console.log('----------------------------------');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data?.url) throw new Error('No OAuth URL returned');

    // Trên Android: Mở trình duyệt ngoài thực sự để tránh treo/kẹt Custom Tabs trong Expo Go
    if (Platform.OS === 'android') {
      console.log('--- SUPABASE OAUTH URL (ANDROID EXTERNAL) ---');
      console.log('data.url:', data.url);
      console.log('--------------------------------------------');

      const opened = await Linking.openURL(data.url);
      if (!opened) {
        throw new Error('Không thể mở trình duyệt Google.');
      }

      return {
        success: true
      };
    }

    // Trên iOS: Sử dụng in-app WebBrowser của Expo vì nó hoạt động cực kỳ mượt mà và tự đóng chuẩn chỉ
    console.log('--- SUPABASE OAUTH URL (IOS) ---');
    console.log('data.url:', data.url);
    console.log('--------------------------------');

    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    console.log('--- WEB BROWSER OAUTH RESULT ---');
    console.log('Result type:', res.type);
    if ('url' in res) {
      console.log('Redirect URL:', res.url);
    }
    console.log('--------------------------------');

    if (res.type === 'success' && res.url) {
      // Thay thế '#' bằng '?' để Linking.parse có thể đọc được các tham số trong hash fragment
      const cleanUrl = res.url.includes('#') ? res.url.replace('#', '?') : res.url;
      const parsed = Linking.parse(cleanUrl);
      const { access_token, refresh_token } = parsed.queryParams || {};

      console.log('--- PARSED TOKENS ---');
      console.log('access_token:', access_token ? 'Đã nhận' : 'Trống');
      console.log('refresh_token:', refresh_token ? 'Đã nhận' : 'Trống');
      console.log('---------------------');

      if (access_token && refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: Array.isArray(access_token) ? access_token[0] : access_token,
          refresh_token: Array.isArray(refresh_token) ? refresh_token[0] : refresh_token,
        });

        if (sessionError) throw sessionError;

        return {
          success: true,
          role: 'Free' // Default role for OAuth users
        };
      }
    }

    return {
      success: false,
      error: 'Đăng nhập với Google bị hủy hoặc không thành công.'
    };
  } catch (e: any) {
    return {
      success: false,
      error: 'Có lỗi xảy ra. Vui lòng thử đăng nhập lại.'
    };
  }
};

export const loginWithEmail = async (email: string, pass: string): Promise<LoginResult> => {
  // 1. Validate email format
  if (!email || !email.includes('@')) {
    return {
      success: false,
      error: 'Email không hợp lệ, vui lòng kiểm tra và nhập lại email.'
    };
  }

  try {
    // 2. Check lockout status
    const lockoutUntilStr = await AsyncStorage.getItem(LOCKOUT_KEY);
    if (lockoutUntilStr) {
      const lockoutUntil = new Date(parseInt(lockoutUntilStr, 10));
      if (new Date() < lockoutUntil) {
        return {
          success: false,
          error: 'Tài khoản của bạn tạm thời bị khóa 1 tiếng do nhập sai mật khẩu quá nhiều lần. Chill đi rồi thử lại sau nhé.'
        };
      } else {
        // Lockout expired, clear it
        await AsyncStorage.removeItem(LOCKOUT_KEY);
        await AsyncStorage.setItem(ATTEMPTS_KEY, '0');
      }
    }

    // 3. Attempt Supabase Sign In
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      // 4. Handle wrong credentials
      if (error.message.toLowerCase().includes('invalid login credentials') || error.status === 400) {
        const attemptsStr = await AsyncStorage.getItem(ATTEMPTS_KEY) || '0';
        const attempts = parseInt(attemptsStr, 10) + 1;

        if (attempts >= MAX_ATTEMPTS) {
          const lockoutTime = new Date().getTime() + LOCKOUT_DURATION;
          await AsyncStorage.setItem(LOCKOUT_KEY, lockoutTime.toString());
          return {
            success: false,
            error: 'Tài khoản của bạn tạm thời bị khóa 1 tiếng do nhập sai mật khẩu quá nhiều lần. Chill đi rồi thử lại sau nhé.'
          };
        } else {
          await AsyncStorage.setItem(ATTEMPTS_KEY, attempts.toString());
          return {
            success: false,
            error: 'Sai mật khẩu. Vui lòng thử lại. Lưu ý: Nhập sai mật khẩu quá 5 lần sẽ bị khóa đăng nhập trong vòng 1 tiếng.'
          };
        }
      }

      // General Supabase error
      return {
        success: false,
        error: 'Có lỗi xảy ra. Vui lòng thử đăng nhập lại.'
      };
    }

    // 5. Success! Reset attempts
    await AsyncStorage.setItem(ATTEMPTS_KEY, '0');
    await AsyncStorage.removeItem(LOCKOUT_KEY);

    // Mock role retrieve (can be updated later with database fetch)
    return {
      success: true,
      user: data.user,
      role: 'Free'
    };

  } catch (e) {
    return {
      success: false,
      error: 'Có lỗi xảy ra. Vui lòng thử đăng nhập lại.'
    };
  }
};

export interface SignUpResult {
  success: boolean;
  error?: string;
  user?: any;
}

export const signUpWithEmail = async (
  fullName: string,
  email: string,
  pass: string,
  confirmPass: string
): Promise<SignUpResult> => {
  // 1. Validate full name
  if (!fullName || fullName.trim().length === 0) {
    return {
      success: false,
      error: 'Vui lòng nhập họ và tên.'
    };
  }

  // 2. Validate email format
  if (!email || !email.includes('@')) {
    return {
      success: false,
      error: 'Email không hợp lệ, vui lòng kiểm tra và nhập lại email.'
    };
  }

  // 3. Validate password length
  if (!pass || pass.length < 6) {
    return {
      success: false,
      error: 'Mật khẩu phải có ít nhất 6 ký tự.'
    };
  }

  // 4. Validate passwords match
  if (pass !== confirmPass) {
    return {
      success: false,
      error: 'Mật khẩu xác nhận không khớp.'
    };
  }

  try {
    // 5. Call Supabase Sign Up
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      return {
        success: false,
        error: 'Tài khoản email này đã được đăng ký hoặc không hợp lệ.'
      };
    }

    return {
      success: true,
      user: data.user
    };
  } catch (e) {
    return {
      success: false,
      error: 'Có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại.'
    };
  }
};

