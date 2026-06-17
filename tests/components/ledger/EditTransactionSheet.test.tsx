import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { EditTransactionSheet } from '../../../src/components/ledger/EditTransactionSheet';
import { LedgerTransaction } from '../../../src/services/ledgerService';

// Mock supabase — EditTransactionSheet loads wallets/categories on open
jest.mock('../../../src/services/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockExpenseTx: LedgerTransaction = {
  id: 'tx-expense-1',
  wallet_id: 'w-1',
  category_id: 'cat-1',
  jar_type: 'NEC',
  amount: 150000,
  type: 'expense',
  note: 'Phở sáng',
  occurred_at: '2026-06-05T08:00:00Z',
  created_by: 'user-1',
  categories: { name: 'Ăn uống', icon: '🍜', color: null, parent_id: null, jar_type: 'NEC' },
  wallets: { name: 'Ví Cá Nhân' },
};

const mockIncomeTx: LedgerTransaction = {
  id: 'tx-income-1',
  wallet_id: 'w-1',
  category_id: null,
  jar_type: 'NEC',
  amount: 5000000,
  type: 'income',
  note: 'Lương tháng 6',
  occurred_at: '2026-06-05T09:00:00Z',
  created_by: 'user-1',
  categories: null,
  wallets: { name: 'Ví Cá Nhân' },
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('EditTransactionSheet', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Rendering ─────────────────────────────────────────────────────────────

  it('should render with title "Sửa Giao Dịch"', () => {
    const { getByText } = render(
      <EditTransactionSheet
        transaction={mockExpenseTx}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    expect(getByText('Sửa Giao Dịch')).toBeTruthy();
  });

  it('should NOT render when isOpen is false', () => {
    const { queryByText } = render(
      <EditTransactionSheet
        transaction={mockExpenseTx}
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    expect(queryByText('Sửa Giao Dịch')).toBeNull();
  });

  it('should NOT render when transaction is null', () => {
    const { queryByText } = render(
      <EditTransactionSheet
        transaction={null}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    expect(queryByText('Sửa Giao Dịch')).toBeNull();
  });

  // ─── Pre-fill ──────────────────────────────────────────────────────────────

  it('should pre-fill amount from transaction', () => {
    const { getByTestId } = render(
      <EditTransactionSheet
        transaction={mockExpenseTx}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    const amountInput = getByTestId('edit-amount-input');
    expect(amountInput.props.value).toContain('150');
  });

  it('should pre-fill note from transaction', () => {
    const { getByTestId } = render(
      <EditTransactionSheet
        transaction={mockExpenseTx}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    const noteInput = getByTestId('edit-note-input');
    expect(noteInput.props.value).toBe('Phở sáng');
  });

  it('should show "Khoản chi" type badge for expense transaction', () => {
    const { getByText } = render(
      <EditTransactionSheet
        transaction={mockExpenseTx}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    expect(getByText('Khoản chi')).toBeTruthy();
  });

  it('should show "Khoản thu" type badge for income transaction', () => {
    const { getByText } = render(
      <EditTransactionSheet
        transaction={mockIncomeTx}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    expect(getByText('Khoản thu')).toBeTruthy();
  });

  it('should show jar selector for expense type', () => {
    const { getByTestId } = render(
      <EditTransactionSheet
        transaction={mockExpenseTx}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    expect(getByTestId('jar-badge-NEC')).toBeTruthy();
  });

  it('should NOT show jar selector for income type', () => {
    const { queryByTestId } = render(
      <EditTransactionSheet
        transaction={mockIncomeTx}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    expect(queryByTestId('jar-badge-NEC')).toBeNull();
  });

  // ─── Validation ────────────────────────────────────────────────────────────

  it('should show error when saving with 0 amount', async () => {
    const { getByTestId, getByText } = render(
      <EditTransactionSheet
        transaction={mockExpenseTx}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Clear amount
    const amountInput = getByTestId('edit-amount-input');
    fireEvent.changeText(amountInput, '');

    await act(async () => {
      fireEvent.press(getByTestId('edit-save-button'));
    });

    expect(getByText('Số tiền giao dịch phải lớn hơn 0 đ. Vui lòng nhập lại.')).toBeTruthy();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should show error when note exceeds 200 characters', async () => {
    const { getByTestId, getByText } = render(
      <EditTransactionSheet
        transaction={mockExpenseTx}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const noteInput = getByTestId('edit-note-input');
    fireEvent.changeText(noteInput, 'a'.repeat(201));

    await act(async () => {
      fireEvent.press(getByTestId('edit-save-button'));
    });

    expect(getByText('Ghi chú không được vượt quá 200 ký tự.')).toBeTruthy();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  // ─── Save success ──────────────────────────────────────────────────────────

  it('should call onSave with correct payload on valid submit', async () => {
    mockOnSave.mockResolvedValue(true);

    const { getByTestId } = render(
      <EditTransactionSheet
        transaction={mockExpenseTx}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // Change note
    const noteInput = getByTestId('edit-note-input');
    fireEvent.changeText(noteInput, 'Ăn trưa mới');

    await act(async () => {
      fireEvent.press(getByTestId('edit-save-button'));
    });

    expect(mockOnSave).toHaveBeenCalledWith(
      'tx-expense-1',
      expect.objectContaining({
        amount: 150000,
        note: 'Ăn trưa mới',
        jar_type: 'NEC',
      })
    );
  });

  // ─── Save failure ──────────────────────────────────────────────────────────

  it('should show error message when onSave returns false (API fail)', async () => {
    mockOnSave.mockResolvedValue(false);

    const { getByTestId, getByText } = render(
      <EditTransactionSheet
        transaction={mockExpenseTx}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    await act(async () => {
      fireEvent.press(getByTestId('edit-save-button'));
    });

    expect(getByText('Không thể lưu thay đổi. Vui lòng thử lại.')).toBeTruthy();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should NOT close sheet when save fails', async () => {
    mockOnSave.mockResolvedValue(false);

    const { getByTestId } = render(
      <EditTransactionSheet
        transaction={mockExpenseTx}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    await act(async () => {
      fireEvent.press(getByTestId('edit-save-button'));
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  // ─── Close behavior ────────────────────────────────────────────────────────

  it('should call onClose when X button is pressed', () => {
    const { getByTestId } = render(
      <EditTransactionSheet
        transaction={mockExpenseTx}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    fireEvent.press(getByTestId('edit-sheet-close'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when backdrop overlay is pressed', () => {
    const { getByTestId } = render(
      <EditTransactionSheet
        transaction={mockExpenseTx}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    fireEvent.press(getByTestId('edit-sheet-overlay'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
