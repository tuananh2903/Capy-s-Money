import { supabase } from './supabaseClient';

export interface ProfileFetchResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ProfileUpdateResult {
  success: boolean;
  error?: string;
}

export async function fetchProfile(userId: string): Promise<ProfileFetchResult> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, jars_ratios, total_budget')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return { success: false, error: 'Không thể tải thông tin hồ sơ.' };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error fetching profile:', err);
    return { success: false, error: 'Lỗi kết nối máy chủ.' };
  }
}

export async function updateProfileName(userId: string, displayName: string): Promise<ProfileUpdateResult> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user display name:', error);
      return { success: false, error: 'Không thể cập nhật tên.' };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error updating name:', err);
    return { success: false, error: 'Lỗi kết nối máy chủ.' };
  }
}

export async function updateProfileTotalBudget(userId: string, totalBudget: number): Promise<ProfileUpdateResult> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ total_budget: totalBudget })
      .eq('id', userId);

    if (error) {
      console.error('Error updating total budget:', error);
      return { success: false, error: 'Không thể cập nhật tổng ngân sách.' };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error updating total budget:', err);
    return { success: false, error: 'Lỗi kết nối máy chủ.' };
  }
}
