import { supabase } from './supabaseClient';

export interface OnboardingResult {
  success: boolean;
  error?: string;
}

/**
 * Hoàn tất thiết lập Onboarding cho người dùng mới trên Supabase:
 * 1. Cập nhật bảng `profiles`: onboarding_completed = true, financial_goal = goal, jars_ratios = jarsRatios.
 * 2. Khởi tạo một Ví Tiền Mặt mặc định với số dư ban đầu trong bảng `wallets`.
 * 
 * @param userId ID của người dùng từ Supabase Auth
 * @param goal Mục tiêu tài chính được chọn
 * @param initialBalance Số tiền khởi tạo ví chính
 * @param walletName Tên ví khởi tạo (mặc định: 'Ví Tiền Mặt')
 * @param jarsRatios Tỷ lệ phân bổ 6 hũ tài chính (mặc định: Thiết yếu 55%, Tiết kiệm 10%, Đầu tư 10%, Giáo dục 10%, Hưởng thụ 10%, Từ thiện 5%)
 */
export async function completeOnboarding(
  userId: string,
  goal: string,
  initialBalance: number,
  walletName: string = 'Ví Tiền Mặt',
  jarsRatios: { nec: number; lt: number; ffa: number; edu: number; play: number; give: number } = {
    nec: 55,
    lt: 10,
    ffa: 10,
    edu: 10,
    play: 10,
    give: 5,
  }
): Promise<OnboardingResult> {
  try {
    const { error } = await supabase.rpc('complete_onboarding', {
      p_user_id: userId,
      p_goal: goal,
      p_balance: initialBalance,
      p_wallet_name: walletName,
      p_jars_ratios: jarsRatios,
    });

    if (error) {
      console.error('Error invoking complete_onboarding RPC:', error);
      return { success: false, error: 'Không thể hoàn tất thiết lập ví. Vui lòng thử lại sau.' };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error during onboarding completion:', err);
    return { success: false, error: 'Đã xảy ra lỗi hệ thống ngoài ý muốn. Vui lòng thử lại sau.' };
  }
}

