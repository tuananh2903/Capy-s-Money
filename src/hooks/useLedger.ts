import { useState, useEffect, useCallback } from 'react';
import { fetchLedgerTransactions, fetchPreviousMonthSpend, LedgerTransaction } from '../services/ledgerService';
import { supabase } from '../services/supabaseClient';

export function useLedger(walletId: string, targetDate: Date) {
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [prevMonthSpend, setPrevMonthSpend] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
  const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

  const loadData = useCallback(async () => {
    if (!walletId) return;
    setIsLoading(true);
    setError(null);

    const [txResult, prevSpendResult] = await Promise.all([
      fetchLedgerTransactions(walletId, startOfMonth, endOfMonth),
      fetchPreviousMonthSpend(walletId, startOfMonth),
    ]);

    if (txResult.success && txResult.data) {
      setTransactions(txResult.data);
    } else {
      setError(txResult.error || 'Failed to load transactions');
    }

    if (prevSpendResult.success) {
      setPrevMonthSpend(prevSpendResult.data);
    }

    setIsLoading(false);
  }, [walletId, targetDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const deleteTransaction = async (txId: string): Promise<boolean> => {
    const backup = [...transactions];
    const filtered = transactions.filter((tx) => tx.id !== txId);
    setTransactions(filtered); // Optimistic UI update

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ is_deleted: true })
        .eq('id', txId);

      if (error) {
        setTransactions(backup); // Rollback
        return false;
      }
      return true;
    } catch {
      setTransactions(backup); // Rollback
      return false;
    }
  };

  const updateTransaction = async (txId: string, updatedData: Partial<LedgerTransaction>): Promise<boolean> => {
    const backup = [...transactions];
    const updated = transactions.map((tx) => (tx.id === txId ? { ...tx, ...updatedData } : tx));
    setTransactions(updated); // Optimistic UI update

    try {
      const { error } = await supabase
        .from('transactions')
        .update(updatedData)
        .eq('id', txId);

      if (error) {
        setTransactions(backup); // Rollback
        return false;
      }
      return true;
    } catch {
      setTransactions(backup); // Rollback
      return false;
    }
  };

  return {
    transactions,
    prevMonthSpend,
    isLoading,
    error,
    refetch: loadData,
    deleteTransaction,
    updateTransaction,
  };
}
