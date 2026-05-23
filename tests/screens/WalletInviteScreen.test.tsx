import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import WalletInviteScreen from '../../src/screens/WalletInviteScreen';
import { generateInviteCode } from '../../src/services/walletInviteService';
import { Clipboard, Alert } from 'react-native';

// Mock walletInviteService
jest.mock('../../src/services/walletInviteService', () => ({
  generateInviteCode: jest.fn(),
}));

describe('WalletInviteScreen', () => {
  const mockWalletId = 'wallet-123';
  const mockWalletName = 'Ví gia đình';

  beforeEach(() => {
    jest.clearAllMocks();
    // Spy on Clipboard
    jest.spyOn(Clipboard, 'setString').mockImplementation(() => {});
  });

  it('renders correctly and generates invite code automatically on mount', async () => {
    const mockRes = { success: true, code: 'CAPY-123456', expires_at: new Date(Date.now() + 86400000).toISOString() };
    (generateInviteCode as jest.Mock).mockResolvedValue(mockRes);

    const { getByText, queryByText } = render(
      <WalletInviteScreen visible={true} onClose={jest.fn()} walletId={mockWalletId} walletName={mockWalletName} />
    );

    // Should show loading status first
    expect(getByText(/Đang tạo mã mời/i)).toBeTruthy();

    await waitFor(() => {
      expect(queryByText(/Đang tạo mã mời/i)).toBeNull();
    });

    // Check code displayed
    expect(getByText('CAPY-123456')).toBeTruthy();
    expect(getByText(/Mã mời sẽ hết hạn sau 24 giờ/i)).toBeTruthy();
  });

  it('handles API error on generation correctly', async () => {
    (generateInviteCode as jest.Mock).mockResolvedValue({ success: false, error: 'Lỗi server' });

    const { getByText, queryByText } = render(
      <WalletInviteScreen visible={true} onClose={jest.fn()} walletId={mockWalletId} walletName={mockWalletName} />
    );

    await waitFor(() => {
      expect(queryByText(/Đang tạo mã mời/i)).toBeNull();
    });

    // Error is shown on screen
    expect(getByText('Lỗi server')).toBeTruthy();
  });

  it('copies invite code to clipboard on button click', async () => {
    const mockRes = { success: true, code: 'CAPY-123456', expires_at: new Date(Date.now() + 86400000).toISOString() };
    (generateInviteCode as jest.Mock).mockResolvedValue(mockRes);

    const { getByText, queryByText } = render(
      <WalletInviteScreen visible={true} onClose={jest.fn()} walletId={mockWalletId} walletName={mockWalletName} />
    );

    await waitFor(() => {
      expect(queryByText(/Đang tạo mã mời/i)).toBeNull();
    });

    const copyBtn = getByText('Sao chép');
    fireEvent.press(copyBtn);

    expect(Clipboard.setString).toHaveBeenCalledWith('CAPY-123456');
  });
});
