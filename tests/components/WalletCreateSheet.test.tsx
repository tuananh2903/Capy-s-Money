import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import WalletCreateSheet from '../../src/components/WalletCreateSheet';
import { createWallet } from '../../src/services/dashboardService';

// Mock dashboardService
jest.mock('../../src/services/dashboardService', () => ({
  createWallet: jest.fn(),
}));

describe('WalletCreateSheet', () => {
  const mockOnClose = jest.fn();
  const mockOnSaveSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when visible', () => {
    const { getByText, getByPlaceholderText } = render(
      <WalletCreateSheet
        visible={true}
        onClose={mockOnClose}
        userId="user-123"
        onSaveSuccess={mockOnSaveSuccess}
      />
    );

    // Title & inputs
    expect(getByText('Tạo Ví Mới')).toBeTruthy();
    expect(getByPlaceholderText('Nhập tên ví (ví dụ: Ví Ăn Tiêu)')).toBeTruthy();
    expect(getByPlaceholderText('0')).toBeTruthy(); // Initial balance placeholder
    
    // Type segments
    expect(getByText('Cá nhân')).toBeTruthy();
    expect(getByText('Ví chung')).toBeTruthy();
  });

  it('shows error if trying to save with empty wallet name', async () => {
    const { getByText } = render(
      <WalletCreateSheet
        visible={true}
        onClose={mockOnClose}
        userId="user-123"
        onSaveSuccess={mockOnSaveSuccess}
      />
    );

    const saveButton = getByText('Tạo ví');
    
    await act(async () => {
      fireEvent.press(saveButton);
    });

    expect(getByText('Tên ví không được để trống.')).toBeTruthy();
    expect(createWallet).not.toHaveBeenCalled();
  });

  it('calls createWallet with correct parameters and calls onSaveSuccess', async () => {
    (createWallet as jest.Mock).mockResolvedValue({ success: true, data: { id: 'w-new' } });

    const { getByText, getByPlaceholderText } = render(
      <WalletCreateSheet
        visible={true}
        onClose={mockOnClose}
        userId="user-123"
        onSaveSuccess={mockOnSaveSuccess}
      />
    );

    // Type wallet name
    const nameInput = getByPlaceholderText('Nhập tên ví (ví dụ: Ví Ăn Tiêu)');
    fireEvent.changeText(nameInput, 'Ví Tiết Kiệm');

    // Type initial balance
    const balanceInput = getByPlaceholderText('0');
    fireEvent.changeText(balanceInput, '1000000');

    // Select color
    const colorButton = getByText('🌸');
    fireEvent.press(colorButton);

    const saveButton = getByText('Tạo ví');
    
    await act(async () => {
      fireEvent.press(saveButton);
    });

    expect(createWallet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ví Tiết Kiệm',
        type: 'personal',
        balance: 1000000,
        color: '#FFB7C5',
        icon: 'wallet-outline',
        user_id: 'user-123',
      })
    );

    expect(mockOnSaveSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
