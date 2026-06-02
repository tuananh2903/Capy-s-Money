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
    const updatePromises = allocations.map(async (alloc) => {
      const { error } = await supabase
        .from('jars')
        .update({ allocation_percentage: alloc.percentage })
        .eq('wallet_id', walletId)
        .eq('type', alloc.type);

      if (error) {
        throw new Error(`Không thể cập nhật hũ ${alloc.type}: ${error.message}`);
      }
    });

    await Promise.all(updatePromises);
    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error updating jar allocations:', err);
    return { success: false, error: err.message || 'Lỗi kết nối mạng.' };
  }
}

/**
 * Lấy tổng thu nhập của một ví cụ thể từ bảng transactions
 * 
 * @param walletId ID ví
 */
export async function fetchWalletIncome(walletId: string): Promise<{ success: boolean; data: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('wallet_id', walletId)
      .eq('type', 'income');

    if (error) {
      console.error('Error fetching wallet income:', error);
      return { success: false, data: 0, error: `Không thể tải dữ liệu thu nhập: ${error.message}` };
    }

    const totalIncome = (data ?? []).reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);
    return { success: true, data: totalIncome };
  } catch (err: any) {
    console.error('Unexpected error fetching wallet income:', err);
    return { success: false, data: 0, error: err.message || 'Lỗi kết nối mạng.' };
  }
}

/**
 * Đảm bảo 6 hũ tài chính tồn tại cho ví cụ thể với tỷ lệ phân bổ hợp lệ.
 * Nếu hũ chưa tồn tại, chèn mới. Nếu hũ đã tồn tại nhưng có tỷ lệ phân bổ là 0%, cập nhật lại tỷ lệ từ profile hoặc mặc định.
 * 
 * @param walletId ID của ví
 * @param currentJars Danh sách hũ hiện tại của ví
 * @param ratiosFromProfile Tỷ lệ phân bổ từ profile (nếu có)
 */
export async function ensureJarsExist(
  walletId: string,
  currentJars: Jar[],
  ratiosFromProfile?: { nec?: number; lt?: number; ffa?: number; edu?: number; play?: number; give?: number } | null
): Promise<{ success: boolean; error?: string }> {
  const defaultRatios = { nec: 55, lt: 10, ffa: 10, edu: 10, play: 10, give: 5 };
  const ratios = ratiosFromProfile || defaultRatios;

  const requiredTypes = [
    { type: 'NEC', ratio: ratios.nec ?? 55 },
    { type: 'FFA', ratio: ratios.ffa ?? 10 },
    { type: 'EDU', ratio: ratios.edu ?? 10 },
    { type: 'PLAY', ratio: ratios.play ?? 10 },
    { type: 'LTSS', ratio: ratios.lt ?? 10 },
    { type: 'GIVE', ratio: ratios.give ?? 5 },
  ];

  const jarsToUpsert: any[] = [];
  let needsUpdate = false;

  for (const req of requiredTypes) {
    const existing = currentJars.find(j => j.type === req.type);
    if (!existing) {
      jarsToUpsert.push({
        wallet_id: walletId,
        type: req.type,
        allocation_percentage: req.ratio,
        budget_limit: 0,
        spent_amount: 0
      });
      needsUpdate = true;
    } else if (existing.allocation_percentage === 0) {
      jarsToUpsert.push({
        wallet_id: walletId,
        type: req.type,
        allocation_percentage: req.ratio,
        budget_limit: existing.budget_limit || 0,
        spent_amount: existing.spent_amount || 0
      });
      needsUpdate = true;
    }
  }

  if (!needsUpdate || jarsToUpsert.length === 0) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('jars')
      .upsert(jarsToUpsert, { onConflict: 'wallet_id,type' });

    if (error) {
      console.error('Error upserting jars in ensureJarsExist:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error in ensureJarsExist:', err);
    return { success: false, error: err.message || 'Lỗi kết nối mạng.' };
  }
}

/**
 * Tạo ví mới trong hệ thống
 */
export async function createWallet(walletData: Partial<Wallet>): Promise<{ success: boolean; data?: Wallet; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .insert(walletData)
      .select()
      .single();

    if (error) {
      console.error('Error inserting wallet:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Wallet };
  } catch (err: any) {
    console.error('Unexpected error creating wallet:', err);
    return { success: false, error: err.message || 'Lỗi kết nối mạng.' };
  }
}

/**
 * Cập nhật thông tin chi tiết của ví
 */
export async function updateWallet(walletId: string, walletData: Partial<Wallet>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('wallets')
      .update(walletData)
      .eq('id', walletId);

    if (error) {
      console.error('Error updating wallet:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error updating wallet:', err);
    return { success: false, error: err.message || 'Lỗi kết nối mạng.' };
  }
}

/**
 * Xóa mềm ví (đánh dấu is_deleted = true)
 */
export async function deleteWallet(walletId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('wallets')
      .update({ is_deleted: true })
      .eq('id', walletId);

    if (error) {
      console.error('Error deleting wallet:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error deleting wallet:', err);
    return { success: false, error: err.message || 'Lỗi kết nối mạng.' };
  }
}

/**
 * Đặt ví làm mặc định cho người dùng (gọi RPC set_default_wallet)
 */
export async function setDefaultWallet(walletId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('set_default_wallet', {
      p_wallet_id: walletId,
      p_user_id: userId,
    });

    if (error) {
      console.error('Error setting default wallet:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error setting default wallet:', err);
    return { success: false, error: err.message || 'Lỗi kết nối mạng.' };
  }
}

/**
 * Kiểm tra xem người dùng đã ghi giao dịch nào trong ngày hôm nay chưa.
 * Hàm kiểm tra trên tất cả các ví mà user sở hữu hoặc là thành viên.
 *
 * @param userId ID người dùng
 * @returns true nếu có ít nhất 1 giao dịch hôm nay, false nếu chưa có.
 */
export async function checkHasTransactionsToday(userId: string): Promise<boolean> {
  try {
    // Lấy ngày hôm nay (00:00:00)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Lấy danh sách wallet ID mà user tham gia
    const { data: memberRows, error: memberError } = await supabase
      .from('wallet_members')
      .select('wallet_id')
      .eq('user_id', userId);

    if (memberError || !memberRows || memberRows.length === 0) {
      return false;
    }

    const walletIds = memberRows.map((r: any) => r.wallet_id);

    // Tìm giao dịch hôm nay trong bất kỳ ví nào
    const { data, error } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .in('wallet_id', walletIds)
      .gte('created_at', todayStart.toISOString());

    if (error) {
      console.error('Error checking today transactions:', error);
      return false;
    }

    return (data as any)?.length > 0 || ((data as any)?.count ?? 0) > 0;
  } catch (err: any) {
    console.error('Unexpected error checking today transactions:', err);
    return false;
  }
}


