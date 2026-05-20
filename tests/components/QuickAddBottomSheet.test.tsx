import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import QuickAddBottomSheet from '../../src/components/QuickAddBottomSheet';
import { createTransaction } from '../../src/services/dashboardService';

// Mock dashboardService
jest.mock('../../src/services/dashboardService', () => ({
  createTransaction: jest.fn(),
}));

describe('QuickAddBottomSheet', () => {
  const mockOnClose = jest.fn();
  const mockOnSaveSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when visible', () => {
    const { getByText, getByPlaceholderText } = render(
      <QuickAddBottomSheet
        visible={true}
        onClose={mockOnClose}
        walletId="w-1"
        userId="user-123"
        onSaveSuccess={mockOnSaveSuccess}
      />
    );

    // Header / title
    expect(getByText('Thêm giao dịch')).toBeTruthy();
    
    // Switch tabs
    expect(getByText('Khoản Chi')).toBeTruthy();
    expect(getByText('Khoản Thu')).toBeTruthy();

    // Input fields
    expect(getByPlaceholderText('0')).toBeTruthy(); // Amount placeholder
    expect(getByPlaceholderText('Nhập ghi chú (tùy chọn)...')).toBeTruthy(); // Note placeholder
  });

  it('shows error if trying to save with empty or 0 amount', async () => {
    const { getByText } = render(
      <QuickAddBottomSheet
        visible={true}
        onClose={mockOnClose}
        walletId="w-1"
        userId="user-123"
        onSaveSuccess={mockOnSaveSuccess}
      />
    );

    const saveButton = getByText('Lưu giao dịch');
    
    await act(async () => {
      fireEvent.press(saveButton);
    });

    expect(getByText('Số tiền giao dịch phải lớn hơn 0.')).toBeTruthy();
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it('shows error if note is longer than 200 characters', async () => {
    const { getByText, getByPlaceholderText } = render(
      <QuickAddBottomSheet
        visible={true}
        onClose={mockOnClose}
        walletId="w-1"
        userId="user-123"
        onSaveSuccess={mockOnSaveSuccess}
      />
    );

    const amountInput = getByPlaceholderText('0');
    fireEvent.changeText(amountInput, '500000');

    const noteInput = getByPlaceholderText('Nhập ghi chú (tùy chọn)...');
    fireEvent.changeText(noteInput, 'a'.repeat(201));

    const saveButton = getByText('Lưu giao dịch');
    
    await act(async () => {
      fireEvent.press(saveButton);
    });

    expect(getByText('Ghi chú không được vượt quá 200 ký tự.')).toBeTruthy();
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it('calls createTransaction with correct parameters and calls onSaveSuccess', async () => {
    (createTransaction as jest.Mock).mockResolvedValue({ success: true });

    const { getByText, getByPlaceholderText } = render(
      <QuickAddBottomSheet
        visible={true}
        onClose={mockOnClose}
        walletId="w-1"
        userId="user-123"
        onSaveSuccess={mockOnSaveSuccess}
      />
    );

    // Set amount
    const amountInput = getByPlaceholderText('0');
    fireEvent.changeText(amountInput, '250000');

    // Select Jar
    const jarButton = getByText('Thiết yếu'); // NEC
    fireEvent.press(jarButton);

    // Set note
    const noteInput = getByPlaceholderText('Nhập ghi chú (tùy chọn)...');
    fireEvent.changeText(noteInput, 'Mua sữa cho con');

    const saveButton = getByText('Lưu giao dịch');
    
    await act(async () => {
      fireEvent.press(saveButton);
    });

    expect(createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        wallet_id: 'w-1',
        jar_type: 'NEC',
        amount: 250000,
        type: 'expense',
        note: 'Mua sữa cho con',
        created_by: 'user-123',
      })
    );

    expect(mockOnSaveSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
