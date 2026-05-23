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
    // 1. Cập nhật bảng profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        financial_goal: goal,
        jars_ratios: jarsRatios,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profiles:', profileError);
      return { success: false, error: 'Không thể cập nhật hồ sơ người dùng. Vui lòng thử lại sau.' };
    }

    // 2. Khởi tạo Ví Tiền Mặt mặc định
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .insert({
        user_id: userId,
        name: walletName,
        balance: initialBalance,
        is_default: true,
        type: 'cash',
      })
      .select('id')
      .single();

    if (walletError || !walletData) {
      console.error('Error creating initial wallet:', walletError);
      // Ghi nhận lỗi nhưng không rollback hoàn toàn (vì profiles đã hoàn thành)
      // Trong ứng dụng thực tế, ta nên dùng RPC hoặc quản lý giao dịch kỹ hơn
      return {
        success: false,
        error: 'Cập nhật hồ sơ thành công nhưng không thể khởi tạo ví. Vui lòng tạo ví thủ công ở màn hình chính.',
      };
    }

    const walletId = walletData.id;

    // 3. Khởi tạo 6 Hũ tài chính tương ứng cho ví vừa tạo
    const jarsToInsert = [
      { wallet_id: walletId, type: 'NEC', allocation_percentage: jarsRatios.nec, budget_limit: 0, spent_amount: 0 },
      { wallet_id: walletId, type: 'FFA', allocation_percentage: jarsRatios.ffa, budget_limit: 0, spent_amount: 0 },
      { wallet_id: walletId, type: 'EDU', allocation_percentage: jarsRatios.edu, budget_limit: 0, spent_amount: 0 },
      { wallet_id: walletId, type: 'PLAY', allocation_percentage: jarsRatios.play, budget_limit: 0, spent_amount: 0 },
      { wallet_id: walletId, type: 'LTSS', allocation_percentage: jarsRatios.lt, budget_limit: 0, spent_amount: 0 },
      { wallet_id: walletId, type: 'GIVE', allocation_percentage: jarsRatios.give, budget_limit: 0, spent_amount: 0 },
    ];

    const { error: jarsError } = await supabase
      .from('jars')
      .insert(jarsToInsert);

    if (jarsError) {
      console.error('Error creating initial jars:', jarsError);
      return {
        success: false,
        error: 'Tạo ví thành công nhưng không thể khởi tạo 6 hũ tài chính. Vui lòng thử lại.',
      };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error during onboarding completion:', err);
    return { success: false, error: 'Đã xảy ra lỗi hệ thống ngoài ý muốn. Vui lòng thử lại sau.' };
  }
}

