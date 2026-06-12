import { supabase } from './supabaseClient';

export interface JarData {
  id: string;
  user_id: string;
  type: string;
  budget_limit: number;
  spent_amount: number;
  allocation_percentage: number;
  enable_alerts: boolean;
  name?: string;
  icon?: string;
}

export interface CategoryBudget {
  id: string;
  user_id: string;
  category_id: string;
  amount_limit: number;
  enable_alerts: boolean;
  categories?: {
    name: string;
    icon: string | null;
    jar_type: string;
  } | null;
}

export async function fetchUserWallets() {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('id, name, rollover_enabled')
      .eq('is_deleted', false);
    
    if (error) {
      // Fallback if rollover_enabled does not exist in remote DB yet
      if (error.message?.includes('rollover_enabled') || error.code === '42703' || error.code === 'PGRST204') {
        const fallbackRes = await supabase
          .from('wallets')
          .select('id, name')
          .eq('is_deleted', false);
        if (fallbackRes.error) return { success: false, error: fallbackRes.error.message };
        
        // Map data to include rollover_enabled from AsyncStorage as fallback
        const mappedData = await Promise.all((fallbackRes.data || []).map(async (w: any) => {
          let localEnabled = false;
          try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const savedRollover = await AsyncStorage.getItem(`@wallet_rollover_enabled_${w.id}`);
            localEnabled = savedRollover === 'true';
          } catch (e) {
            console.error('Error loading fallback local rollover:', e);
          }
          return {
            ...w,
            rollover_enabled: localEnabled
          };
        }));
        return { success: true, data: mappedData };
      }
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchJars(userId: string): Promise<{ success: boolean; data?: JarData[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('jars')
      .select('*')
      .eq('user_id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true, data: data as JarData[] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchCategoryBudgets(userId: string): Promise<{ success: boolean; data?: CategoryBudget[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('budgets')
      .select('*, categories(name, icon, jar_type)')
      .eq('user_id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true, data: data as any[] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*');
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleJarAlert(jarId: string, enable: boolean) {
  try {
    const { error } = await supabase
      .from('jars')
      .update({ enable_alerts: enable })
      .eq('id', jarId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleCategoryBudgetAlert(budgetId: string, enable: boolean) {
  try {
    const { error } = await supabase
      .from('budgets')
      .update({ enable_alerts: enable })
      .eq('id', budgetId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveJarAllocation(userId: string, jarType: string, percentage: number, limit: number) {
  try {
    const { error } = await supabase
      .from('jars')
      .upsert({
        user_id: userId,
        type: jarType,
        allocation_percentage: percentage,
        budget_limit: limit,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,type' });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveCategoryBudget(userId: string, categoryId: string, limit: number) {
  try {
    const { error } = await supabase
      .from('budgets')
      .upsert({
        user_id: userId,
        category_id: categoryId,
        amount_limit: limit,
        created_by: userId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,category_id' });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteCategoryBudget(budgetId: string) {
  try {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', budgetId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteJar(jarId: string) {
  try {
    const { error } = await supabase
      .from('jars')
      .delete()
      .eq('id', jarId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createCategory(categoryData: { name: string; icon: string; type: string; jar_type: string; user_id: string }) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
