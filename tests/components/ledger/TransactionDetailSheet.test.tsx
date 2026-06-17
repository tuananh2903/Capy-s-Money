import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { TransactionDetailSheet } from '../../../src/components/ledger/TransactionDetailSheet';

describe('TransactionDetailSheet Tests', () => {
  const mockExpenseTx: any = {
    id: '1',
    amount: 45000,
    type: 'expense',
    jar_type: 'PLAY',
    occurred_at: '2026-05-27T09:30:00Z',
    note: 'Cafe with friends',
    categories: {
      name: 'Capy Cafe',
      parent_id: 'some-parent-id'
    }
  };

  const mockTransferTx: any = {
    id: '2',
    amount: 500000,
    type: 'transfer',
    jar_type: 'NEC',
    occurred_at: '2026-05-27T10:00:00Z',
    note: 'Chuyển khoản đến Ví chồng',
    categories: null,
    wallets: { name: 'Ví vợ' }
  };

  const mockIncomeTx: any = {
    id: '3',
    amount: 5000000,
    type: 'income',
    jar_type: 'NEC',
    occurred_at: '2026-06-05T09:00:00Z',
    note: 'Lương tháng 6',
    categories: { name: 'Lương', parent_id: null },
    wallets: { name: 'Ví Cá Nhân' }
  };

  it('should render transaction details correctly', () => {
    const { getByText } = render(
      <TransactionDetailSheet
        transaction={mockExpenseTx}
        isOpen={true}
        onClose={jest.fn()}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
      />
    );
    expect(getByText('-45.000đ')).toBeTruthy();
    expect(getByText('Cafe with friends')).toBeTruthy();
    expect(getByText('PLAY > Capy Cafe')).toBeTruthy();
  });

  it('should show Sửa and Xóa buttons for expense transaction', () => {
    const { getByText } = render(
      <TransactionDetailSheet
        transaction={mockExpenseTx}
        isOpen={true}
        onClose={jest.fn()}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
      />
    );
    expect(getByText('Sửa')).toBeTruthy();
    expect(getByText('Xóa')).toBeTruthy();
  });

  it('should show Sửa and Xóa buttons for income transaction', () => {
    const { getByText } = render(
      <TransactionDetailSheet
        transaction={mockIncomeTx}
        isOpen={true}
        onClose={jest.fn()}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
      />
    );
    expect(getByText('Sửa')).toBeTruthy();
    expect(getByText('Xóa')).toBeTruthy();
  });

  it('should NOT show Sửa button for transfer transaction', () => {
    const { queryByText, getByText } = render(
      <TransactionDetailSheet
        transaction={mockTransferTx}
        isOpen={true}
        onClose={jest.fn()}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
      />
    );
    expect(queryByText('Sửa')).toBeNull();
    // Xóa should still be visible
    expect(getByText('Xóa')).toBeTruthy();
  });

  it('should trigger delete and edit actions correctly', () => {
    const deleteSpy = jest.fn();
    const editSpy = jest.fn();
    const { getByText } = render(
      <TransactionDetailSheet
        transaction={mockExpenseTx}
        isOpen={true}
        onClose={jest.fn()}
        onDelete={deleteSpy}
        onEdit={editSpy}
      />
    );
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      // Find the 'Xóa' button (usually the second button, or check the text)
      const deleteButton = buttons?.find(b => b.text === 'Xóa');
      if (deleteButton && deleteButton.onPress) {
        deleteButton.onPress();
      }
    });

    fireEvent.press(getByText('Xóa'));
    expect(deleteSpy).toHaveBeenCalledWith('1');

    fireEvent.press(getByText('Sửa'));
    expect(editSpy).toHaveBeenCalledWith(mockExpenseTx);
  });

  it('should NOT trigger onEdit for transfer (button hidden)', () => {
    const editSpy = jest.fn();
    const { queryByText } = render(
      <TransactionDetailSheet
        transaction={mockTransferTx}
        isOpen={true}
        onClose={jest.fn()}
        onDelete={jest.fn()}
        onEdit={editSpy}
      />
    );

    // Sửa button is not rendered — cannot press it
    expect(queryByText('Sửa')).toBeNull();
    expect(editSpy).not.toHaveBeenCalled();
  });
});
