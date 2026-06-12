import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useLedger } from '../../src/hooks/useLedger';
import * as ledgerService from '../../src/services/ledgerService';
import { supabase } from '../../src/services/supabaseClient';

jest.mock('../../src/services/ledgerService');
jest.mock('../../src/services/supabaseClient', () => {
  const mockEq = jest.fn();
  const mockUpdate = jest.fn(() => ({ eq: mockEq }));
  const mockFrom = jest.fn(() => ({ update: mockUpdate }));
  return {
    supabase: {
      from: mockFrom,
      _mockEq: mockEq,
      _mockUpdate: mockUpdate,
    }
  };
});

describe('useLedger Hook Tests', () => {
  const mockTxs: any[] = [
    { id: '1', amount: 100, type: 'expense', occurred_at: '2026-05-27T00:00:00Z', categories: null }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch transactions correctly on load', async () => {
    (ledgerService.fetchLedgerTransactions as jest.Mock).mockResolvedValue({ success: true, data: mockTxs });
    (ledgerService.fetchPreviousMonthSpend as jest.Mock).mockResolvedValue({ success: true, data: 50 });

    const { result } = renderHook(() => useLedger(['wallet-123'], new Date('2026-05-15')));
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.transactions).toEqual(mockTxs);
    expect(result.current.prevMonthSpend).toBe(50);
  });

  it('should delete transaction optimistically and rollback if server fails', async () => {
    (ledgerService.fetchLedgerTransactions as jest.Mock).mockResolvedValue({ success: true, data: mockTxs });
    (ledgerService.fetchPreviousMonthSpend as jest.Mock).mockResolvedValue({ success: true, data: 50 });

    const mockEq = (supabase as any)._mockEq;
    mockEq.mockResolvedValue({ error: { message: 'Database error' } });

    const { result } = renderHook(() => useLedger(['wallet-123'], new Date('2026-05-15')));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.transactions).toEqual(mockTxs);

    // Call deleteTransaction (optimistic update runs immediately)
    act(() => {
      result.current.deleteTransaction('1');
    });

    // Wait for the rollback to restore the transaction since the mock returned an error
    await waitFor(() => {
      expect(result.current.transactions).toEqual(mockTxs);
    });

    expect(supabase.from).toHaveBeenCalledWith('transactions');
    expect((supabase as any)._mockUpdate).toHaveBeenCalledWith({ is_deleted: true });
    expect(mockEq).toHaveBeenCalledWith('id', '1');
  });
});
