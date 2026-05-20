import { supabase } from './supabaseClient';

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  is_default: boolean;
  type: string;
  created_at?: string;
  updated_at?: string;
}

export interface Jar {
  id?: string;
  wallet_id?: string;
  type: 'NEC' | 'FFA' | 'EDU' | 'PLAY' | 'LTSS' | 'GIVE';
  budget_limit: number;
  spent_amount: number;
  allocation_percentage: number;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id?: string;
  wallet_id: string;
  category_id?: string | null;
  jar_type: 'NEC' | 'FFA' | 'EDU' | 'PLAY' | 'LTSS' | 'GIVE';
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  note?: string | null;
  occurred_at?: string;
  created_by: string;
}

/**
 * Lấy danh sách tất cả các ví người dùng có quyền truy cập (sở hữu hoặc được mời làm thành viên)
 * 
 * @param userId ID người dùng
 */
export async function fetchWallets(userId: string): Promise<{ success: boolean; data?: Wallet[]; error?: string }> {
  try {
    // Bước 1: Lấy danh sách wallet_id mà user là thành viên (ví chung)
    const { data: memberRows, error: memberError } = await supabase
      .from('wallet_members')
      .select('wallet_id')
      .eq('user_id', userId);

    if (memberError) {
      console.error('Error fetching wallet_members:', memberError);
      return { success: false, error: `Không thể tải danh sách ví: ${memberError.message}` };
    }

    const sharedWalletIds = (memberRows ?? []).map((row: any) => row.wallet_id);

    // Bước 2: Lấy tất cả ví mà user sở hữu hoặc là thành viên
    let query = supabase.from('wallets').select('*').eq('user_id', userId);

    if (sharedWalletIds.length > 0) {
      query = supabase
        .from('wallets')
        .select('*')
        .or(`user_id.eq.${userId},id.in.(${sharedWalletIds.join(',')})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching wallets:', error);
      return { success: false, error: `Không thể tải danh sách ví: ${error.message}` };
    }

    return { success: true, data: data as Wallet[] };
  } catch (err: any) {
    console.error('Unexpected error fetching wallets:', err);
    return { success: false, error: err.message || 'Lỗi kết nối mạng.' };
  }
}

/**
 * Lấy danh sách 6 hũ tài chính của một ví cụ thể
 * 
 * @param walletId ID ví
 */
export async function fetchJars(walletId: string): Promise<{ success: boolean; data?: Jar[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('jars')
      .select('*')
      .eq('wallet_id', walletId);

    if (error) {
      console.error('Error fetching jars:', error);
      return { success: false, error: `Không thể tải danh sách hũ tài chính: ${error.message}` };
    }

    return { success: true, data: data as Jar[] };
  } catch (err: any) {
    console.error('Unexpected error fetching jars:', err);
    return { success: false, error: err.message || 'Lỗi kết nối mạng.' };
  }
}

/**
 * Thêm giao dịch mới vào hệ thống (tự động cập nhật hũ và số dư qua DB triggers)
 * 
 * @param txData Dữ liệu giao dịch
 */
export async function createTransaction(txData: Transaction): Promise<{ success: boolean; data?: any; error?: string }> {
  if (txData.amount <= 0) {
    return { success: false, error: 'Số tiền giao dịch phải lớn hơn 0.' };
  }
  if (txData.note && txData.note.length > 200) {
    return { success: false, error: 'Ghi chú không được vượt quá 200 ký tự.' };
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert(txData);

    if (error) {
      console.error('Error inserting transaction:', error);
      return { success: false, error: `Không thể thêm giao dịch: ${error.message}` };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Unexpected error inserting transaction:', err);
    return { success: false, error: err.message || 'Lỗi kết nối mạng.' };
  }
}

/**
 * Cập nhật tỷ lệ phần bổ (allocation percentage) cho 6 hũ tài chính của ví
 * 
 * @param walletId ID ví
 * @param allocations Danh sách các hũ và tỷ lệ (%) mới
 */
export async function updateJarAllocations(
  walletId: string,
  allocations: { type: string; percentage: number }[]
): Promise<{ success: boolean; error?: string }> {
  const total = allocations.reduce((sum, item) => sum + item.percentage, 0);
  if (total !== 100) {
    return { success: false, error: `Tổng tỷ lệ phân bổ của các hũ phải bằng 100% (hiện tại: ${total}%).` };
  }

  try {
    for (const alloc of allocations) {
      const { error } = await supabase
        .from('jars')
        .update({ allocation_percentage: alloc.percentage })
        .eq('wallet_id', walletId)
        .eq('type', alloc.type);

      if (error) {
        console.error(`Error updating jar ${alloc.type}:`, error);
        return { success: false, error: `Không thể cập nhật hũ ${alloc.type}: ${error.message}` };
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error updating jar allocations:', err);
    return { success: false, error: err.message || 'Lỗi kết nối mạng.' };
  }
}
