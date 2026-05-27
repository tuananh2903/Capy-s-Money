import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TransactionDetailSheet } from '../../../src/components/ledger/TransactionDetailSheet';

describe('TransactionDetailSheet Tests', () => {
  const mockTx: any = {
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

  it('should render transaction details correctly', () => {
    const { getByText } = render(
      <TransactionDetailSheet
        transaction={mockTx}
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

  it('should trigger delete and edit actions correctly', () => {
    const deleteSpy = jest.fn();
    const editSpy = jest.fn();
    const { getByText } = render(
      <TransactionDetailSheet
        transaction={mockTx}
        isOpen={true}
        onClose={jest.fn()}
        onDelete={deleteSpy}
        onEdit={editSpy}
      />
    );

    fireEvent.press(getByText('Xóa'));
    expect(deleteSpy).toHaveBeenCalledWith('1');

    fireEvent.press(getByText('Sửa'));
    expect(editSpy).toHaveBeenCalledWith(mockTx);
  });
});
