import { supabase } from './supabaseClient';
import NetInfo from '@react-native-community/netinfo';

export interface GenerateInviteResponse {
  success: boolean;
  code?: string;
  expiresAt?: string;
  error?: string;
}

export interface JoinWalletResponse {
  success: boolean;
  walletName?: string;
  error?: string;
  errorCode?: string;
}

export interface RemoveMemberResponse {
  success: boolean;
  error?: string;
}

/**
 * Kiểm tra xem thiết bị có kết nối mạng hay không
 */
async function checkNetwork(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return !!state.isConnected;
}

/**
 * Gọi Edge Function tạo mã mời cho ví chung
 * 
 * @param walletId ID của ví chung cần tạo mã mời
 */
export async function generateInviteCode(walletId: string): Promise<GenerateInviteResponse> {
  try {
    const isOnline = await checkNetwork();
    if (!isOnline) {
      return {
        success: false,
        error: 'Tính năng này cần kết nối Internet. Vui lòng kiểm tra lại kết nối của bạn.',
      };
    }

    const { data, error } = await supabase.functions.invoke('create-invitation', {
      body: { wallet_id: walletId },
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Không thể tạo mã mời.',
      };
    }

    if (data?.error) {
      return {
        success: false,
        error: data.error,
      };
    }

    return {
      success: true,
      code: data.code,
      expiresAt: data.expires_at,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Lỗi kết nối hoặc hệ thống.',
    };
  }
}

/**
 * Gọi Edge Function để tham gia vào một ví chung bằng mã mời
 * 
 * @param code Mã mời (định dạng CAPY-XXXXXX)
 */
export async function joinWalletByCode(code: string): Promise<JoinWalletResponse> {
  try {
    const isOnline = await checkNetwork();
    if (!isOnline) {
      return {
        success: false,
        error: 'Tính năng này cần kết nối Internet. Vui lòng kiểm tra lại kết nối của bạn.',
        errorCode: 'E-wallet-006',
      };
    }

    const { data, error } = await supabase.functions.invoke('join-wallet-by-code', {
      body: { code },
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Không thể thực hiện yêu cầu.',
        errorCode: 'E-wallet-999',
      };
    }

    if (data?.error) {
      return {
        success: false,
        error: data.error,
        errorCode: data.code || 'E-wallet-999',
      };
    }

    return {
      success: true,
      walletName: data.wallet_name,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Lỗi hệ thống.',
      errorCode: 'E-wallet-999',
    };
  }
}

/**
 * Xóa một thành viên khỏi ví chung
 * 
 * @param walletId ID của ví chung
 * @param memberId ID của thành viên cần xóa
 */
export async function removeMember(walletId: string, memberId: string): Promise<RemoveMemberResponse> {
  try {
    const isOnline = await checkNetwork();
    if (!isOnline) {
      return {
        success: false,
        error: 'Tính năng này cần kết nối Internet. Vui lòng kiểm tra lại kết nối của bạn.',
      };
    }

    const { error } = await supabase
      .from('wallet_members')
      .delete()
      .eq('wallet_id', walletId)
      .eq('user_id', memberId);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Lỗi hệ thống.',
    };
  }
}

/**
 * Lấy danh sách thành viên của ví chung
 * 
 * @param walletId ID của ví chung
 */
export async function fetchWalletMembers(walletId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('wallet_members')
      .select('user_id, role, profiles(display_name, avatar_url)')
      .eq('wallet_id', walletId);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Lỗi hệ thống.',
    };
  }
}

