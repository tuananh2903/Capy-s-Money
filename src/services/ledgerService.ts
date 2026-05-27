import { supabase } from './supabaseClient';

export interface LedgerTransaction {
  id: string;
  wallet_id: string;
  category_id: string | null;
  jar_type: 'NEC' | 'FFA' | 'EDU' | 'PLAY' | 'LTSS' | 'GIVE';
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  note: string | null;
  occurred_at: string;
  created_by: string;
  categories: {
    name: string;
    icon: string | null;
    color: string | null;
    parent_id: string | null;
    jar_type: string;
  } | null;
}

export async function fetchLedgerTransactions(
  walletId: string,
  startDate: Date,
  endDate: Date
): Promise<{ success: boolean; data?: LedgerTransaction[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(*)')
      .eq('wallet_id', walletId)
      .eq('is_deleted', false)
      .gte('occurred_at', startDate.toISOString())
      .lte('occurred_at', endDate.toISOString())
      .order('occurred_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data as LedgerTransaction[] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchPreviousMonthSpend(
  walletId: string,
  currentMonthStart: Date
): Promise<{ success: boolean; data: number; error?: string }> {
  try {
    const startOfPrevMonth = new Date(currentMonthStart);
    startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);
    
    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('wallet_id', walletId)
      .eq('type', 'expense')
      .eq('is_deleted', false)
      .gte('occurred_at', startOfPrevMonth.toISOString())
      .lt('occurred_at', currentMonthStart.toISOString());

    if (error) {
      return { success: false, data: 0, error: error.message };
    }
    const total = (data ?? []).reduce((sum, tx) => sum + (tx.amount || 0), 0);
    return { success: true, data: total };
  } catch (err: any) {
    return { success: false, data: 0, error: err.message };
  }
}
