import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import WalletJoinScreen from '../../src/screens/WalletJoinScreen';
import { joinWalletByCode } from '../../src/services/walletInviteService';

// Mock walletInviteService
jest.mock('../../src/services/walletInviteService', () => ({
  joinWalletByCode: jest.fn(),
}));

describe('WalletJoinScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders input elements correctly', async () => {
    const { getByPlaceholderText, getByText } = render(
      <WalletJoinScreen visible={true} onClose={jest.fn()} onJoinSuccess={jest.fn()} />
    );

    expect(getByPlaceholderText('CAPY-123456')).toBeTruthy();
    expect(getByText('Tham gia ví')).toBeTruthy();
  });

  it('shows error validation for invalid code format', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(
      <WalletJoinScreen visible={true} onClose={jest.fn()} onJoinSuccess={jest.fn()} />
    );

    const input = getByPlaceholderText('CAPY-123456');
    fireEvent.changeText(input, 'INVALID-CODE');

    const submitBtn = getByText('Tham gia ví');
    fireEvent.press(submitBtn);

    const errorMsg = await findByText('Định dạng mã mời không hợp lệ. Ví dụ đúng: CAPY-123456');
    expect(errorMsg).toBeTruthy();
  });

  it('submits correctly with clean formatted code', async () => {
    const mockJoinSuccess = jest.fn();
    (joinWalletByCode as jest.Mock).mockResolvedValue({ success: true, walletName: 'Ví Chung' });

    const { getByPlaceholderText, getByText, findByText } = render(
      <WalletJoinScreen visible={true} onClose={jest.fn()} onJoinSuccess={mockJoinSuccess} />
    );

    const input = getByPlaceholderText('CAPY-123456');
    fireEvent.changeText(input, 'CAPY-987654');

    const submitBtn = getByText('Tham gia ví');
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(joinWalletByCode).toHaveBeenCalledWith('CAPY-987654');
    
    const successBtn = await findByText('Đến ví chung ngay');
    await act(async () => {
      fireEvent.press(successBtn);
    });
    
    expect(mockJoinSuccess).toHaveBeenCalledWith('Ví Chung');
  });

  it('enforces brute-force lockout messages from API', async () => {
    const mockJoinSuccess = jest.fn();
    
    // Setup API responses for consecutive calls
    (joinWalletByCode as jest.Mock)
      .mockResolvedValueOnce({ success: false, error: 'Mã không đúng (Còn 2 lần thử)' })
      .mockResolvedValueOnce({ success: false, error: 'Mã không đúng (Còn 1 lần thử)' })
      .mockResolvedValueOnce({ success: false, error: 'Bạn đã nhập sai quá 3 lần. Vui lòng thử lại sau 1 tiếng.', errorCode: 'E-wallet-005' });

    const { getByPlaceholderText, getByText, findByText } = render(
      <WalletJoinScreen visible={true} onClose={jest.fn()} onJoinSuccess={mockJoinSuccess} />
    );

    const input = getByPlaceholderText('CAPY-123456');
    const submitBtn = getByText('Tham gia ví');

    // Attempt 1
    fireEvent.changeText(input, 'CAPY-111111');
    await act(async () => {
      fireEvent.press(submitBtn);
    });
    expect(await findByText('Mã không đúng (Còn 2 lần thử)')).toBeTruthy();

    // Attempt 2
    fireEvent.changeText(input, 'CAPY-222222');
    await act(async () => {
      fireEvent.press(submitBtn);
    });
    expect(await findByText('Mã không đúng (Còn 1 lần thử)')).toBeTruthy();

    // Attempt 3
    fireEvent.changeText(input, 'CAPY-333333');
    await act(async () => {
      fireEvent.press(submitBtn);
    });
    expect(await findByText('Bạn đã nhập sai quá 3 lần. Vui lòng thử lại sau 1 tiếng.')).toBeTruthy();
    expect(await findByText('Tài khoản bị tạm khóa')).toBeTruthy();
  });
});
