import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import RegisterScreen from '../../src/screens/RegisterScreen';
import { signUpWithEmail, loginWithGoogle } from '../../src/services/authService';

// Mock authService
jest.mock('../../src/services/authService', () => ({
  signUpWithEmail: jest.fn(),
  loginWithGoogle: jest.fn(),
}));

// Mock CapyMascot since it uses LottieView which might need mocks in Node env
jest.mock('../../src/components/CapyMascot', () => {
  const { View, Text } = require('react-native');
  return function MockCapyMascot({ type }: { type: string }) {
    return <View><Text>CapyMascot {type}</Text></View>;
  };
});

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.setTimeout(15000);
    jest.clearAllMocks();
  });

  it('shows validation error when full name is empty', async () => {
    (signUpWithEmail as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Vui lòng nhập họ và tên.',
    });

    const { getByPlaceholderText, getByText, findByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Họ và tên'), '');
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@gmail.com');
    fireEvent.changeText(getByPlaceholderText('Mật khẩu'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Xác nhận mật khẩu'), 'password123');

    await act(async () => {
      fireEvent.press(getByText('Đăng ký'));
    });

    const errorText = await findByText('Vui lòng nhập họ và tên.');
    expect(errorText).toBeTruthy();
    expect(signUpWithEmail).toHaveBeenCalledWith('', 'test@gmail.com', 'password123', 'password123');
  });

  it('shows validation error when email format is invalid', async () => {
    (signUpWithEmail as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Email không hợp lệ, vui lòng kiểm tra và nhập lại email.',
    });

    const { getByPlaceholderText, getByText, findByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Họ và tên'), 'Nguyen Van A');
    fireEvent.changeText(getByPlaceholderText('Email'), 'bademail');
    fireEvent.changeText(getByPlaceholderText('Mật khẩu'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Xác nhận mật khẩu'), 'password123');

    await act(async () => {
      fireEvent.press(getByText('Đăng ký'));
    });

    const errorText = await findByText('Email không hợp lệ, vui lòng kiểm tra và nhập lại email.');
    expect(errorText).toBeTruthy();
    expect(signUpWithEmail).toHaveBeenCalledWith('Nguyen Van A', 'bademail', 'password123', 'password123');
  });

  it('shows validation error when password length is less than 6 characters', async () => {
    (signUpWithEmail as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Mật khẩu phải có ít nhất 6 ký tự.',
    });

    const { getByPlaceholderText, getByText, findByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Họ và tên'), 'Nguyen Van A');
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@gmail.com');
    fireEvent.changeText(getByPlaceholderText('Mật khẩu'), '123');
    fireEvent.changeText(getByPlaceholderText('Xác nhận mật khẩu'), '123');

    await act(async () => {
      fireEvent.press(getByText('Đăng ký'));
    });

    const errorText = await findByText('Mật khẩu phải có ít nhất 6 ký tự.');
    expect(errorText).toBeTruthy();
    expect(signUpWithEmail).toHaveBeenCalledWith('Nguyen Van A', 'test@gmail.com', '123', '123');
  });

  it('shows validation error when passwords mismatch', async () => {
    (signUpWithEmail as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Mật khẩu xác nhận không khớp.',
    });

    const { getByPlaceholderText, getByText, findByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Họ và tên'), 'Nguyen Van A');
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@gmail.com');
    fireEvent.changeText(getByPlaceholderText('Mật khẩu'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Xác nhận mật khẩu'), 'different');

    await act(async () => {
      fireEvent.press(getByText('Đăng ký'));
    });

    const errorText = await findByText('Mật khẩu xác nhận không khớp.');
    expect(errorText).toBeTruthy();
    expect(signUpWithEmail).toHaveBeenCalledWith('Nguyen Van A', 'test@gmail.com', 'password123', 'different');
  });

  it('calls signUpWithEmail and handles success', async () => {
    (signUpWithEmail as jest.Mock).mockResolvedValue({
      success: true,
      user: { email: 'test@gmail.com' },
    });

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Họ và tên'), 'Nguyen Van A');
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@gmail.com');
    fireEvent.changeText(getByPlaceholderText('Mật khẩu'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Xác nhận mật khẩu'), 'password123');

    await act(async () => {
      fireEvent.press(getByText('Đăng ký'));
    });

    expect(signUpWithEmail).toHaveBeenCalledWith('Nguyen Van A', 'test@gmail.com', 'password123', 'password123');
  });

  it('calls loginWithGoogle when Google button is clicked', async () => {
    (loginWithGoogle as jest.Mock).mockResolvedValue({
      success: true,
    });

    const { getByText } = render(<RegisterScreen />);

    await act(async () => {
      fireEvent.press(getByText('Tiếp tục với Google'));
    });

    expect(loginWithGoogle).toHaveBeenCalled();
  });
});
