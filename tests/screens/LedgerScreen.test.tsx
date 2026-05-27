import React from 'react';
import { render } from '@testing-library/react-native';
import { LedgerScreen } from '../../src/screens/LedgerScreen';
import * as useLedgerModule from '../../src/hooks/useLedger';

jest.mock('../../src/hooks/useLedger');

describe('LedgerScreen Integration Tests', () => {
  beforeEach(() => {
    (useLedgerModule.useLedger as jest.Mock).mockReturnValue({
      transactions: [],
      prevMonthSpend: 0,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      deleteTransaction: jest.fn(),
      updateTransaction: jest.fn(),
    });
  });

  it('should render headers and tabs correctly', () => {
    const { getByText } = render(<LedgerScreen activeWalletId="wallet-123" />);
    expect(getByText('Sổ Giao Dịch')).toBeTruthy();
    expect(getByText('Hàng ngày')).toBeTruthy();
    expect(getByText('Hàng tháng')).toBeTruthy();
    expect(getByText('Lịch biểu')).toBeTruthy();
  });
});
