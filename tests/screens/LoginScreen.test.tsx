import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import LoginScreen from '../../src/screens/LoginScreen';
import { loginWithEmail, loginWithGoogle } from '../../src/services/authService';

// Mock authService
jest.mock('../../src/services/authService', () => ({
  loginWithEmail: jest.fn(),
  loginWithGoogle: jest.fn(),
}));

// Mock CapyMascot since it uses LottieView which might need mocks in Node env
jest.mock('../../src/components/CapyMascot', () => {
  const { View, Text } = require('react-native');
  return function MockCapyMascot({ type }: { type: string }) {
    return <View><Text>CapyMascot {type}</Text></View>;
  };
});

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.setTimeout(15000);
    jest.clearAllMocks();
  });

  it('shows validation error when email format is invalid', async () => {
    (loginWithEmail as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Email không hợp lệ, vui lòng kiểm tra và nhập lại email.',
    });

    const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Email'), 'bademail');
    fireEvent.changeText(getByPlaceholderText('Mật khẩu'), '123456');
    
    await act(async () => {
      fireEvent.press(getByText('Đăng nhập'));
    });
    
    const errorText = await findByText('Email không hợp lệ, vui lòng kiểm tra và nhập lại email.');
    expect(errorText).toBeTruthy();
    expect(loginWithEmail).toHaveBeenCalledWith('bademail', '123456');
  });

  it('calls loginWithEmail and handles success', async () => {
    (loginWithEmail as jest.Mock).mockResolvedValue({
      success: true,
      user: { email: 'test@gmail.com' },
      role: 'Free',
    });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@gmail.com');
    fireEvent.changeText(getByPlaceholderText('Mật khẩu'), 'password123');
    
    await act(async () => {
      fireEvent.press(getByText('Đăng nhập'));
    });
    
    expect(loginWithEmail).toHaveBeenCalledWith('test@gmail.com', 'password123');
  });

  it('calls loginWithGoogle when Google button is clicked', async () => {
    (loginWithGoogle as jest.Mock).mockResolvedValue({
      success: true,
    });

    const { getByText } = render(<LoginScreen />);
    
    await act(async () => {
      fireEvent.press(getByText('Tiếp tục với Google'));
    });
    
    expect(loginWithGoogle).toHaveBeenCalled();
  });
});

