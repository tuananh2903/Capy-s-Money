import { supabase } from './supabaseClient';

export interface JarData {
  id: string;
  wallet_id: string;
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
  wallet_id: string;
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
      .select('id, name');
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchJars(walletId: string): Promise<{ success: boolean; data?: JarData[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('jars')
      .select('*')
      .eq('wallet_id', walletId);
    if (error) return { success: false, error: error.message };
    return { success: true, data: data as JarData[] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchCategoryBudgets(walletId: string): Promise<{ success: boolean; data?: CategoryBudget[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('budgets')
      .select('*, categories(name, icon, jar_type)')
      .eq('wallet_id', walletId);
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

export async function saveJarAllocation(walletId: string, jarType: string, percentage: number, limit: number) {
  try {
    const { error } = await supabase
      .from('jars')
      .upsert({
        wallet_id: walletId,
        type: jarType,
        allocation_percentage: percentage,
        budget_limit: limit,
        updated_at: new Date().toISOString()
      }, { onConflict: 'wallet_id,type' });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveCategoryBudget(walletId: string, categoryId: string, limit: number, userId: string) {
  try {
    const { error } = await supabase
      .from('budgets')
      .upsert({
        wallet_id: walletId,
        category_id: categoryId,
        amount_limit: limit,
        created_by: userId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'wallet_id,category_id' });
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
