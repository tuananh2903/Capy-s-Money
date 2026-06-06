import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { WalletTabBar } from '../components/budget/WalletTabBar';
import { JarCard } from '../components/budget/JarCard';
import { JarEditSheet } from '../components/budget/JarEditSheet';
import { PremiumModal } from '../components/budget/PremiumModal';
import { 
  fetchUserWallets, 
  fetchJars, 
  fetchCategoryBudgets, 
  toggleJarAlert, 
  toggleCategoryBudgetAlert, 
  saveJarAllocation,
  saveCategoryBudget,
  deleteJar,
  deleteCategoryBudget,
  fetchCategories,
  createCategory
} from '../services/budgetService';
import { supabase } from '../services/supabaseClient';

export default function BudgetScreen() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [activeWalletId, setActiveWalletId] = useState<string>('');
  const [totalBudget, setTotalBudget] = useState(10000000); // Default total budget limit
  const [jars, setJars] = useState<any[]>([]);
  const [categoryBudgets, setCategoryBudgets] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [editingJarIndex, setEditingJarIndex] = useState<number | null>(null);
  const [isEditSheetVisible, setIsEditSheetVisible] = useState(false);
  const [isPremiumModalVisible, setIsPremiumModalVisible] = useState(false);
  const [isSavingJar, setIsSavingJar] = useState(false);

  const [isEditingTotalBudget, setIsEditingTotalBudget] = useState(false);
  const [totalBudgetInput, setTotalBudgetInput] = useState('');
  const [isRolloverEnabled, setIsRolloverEnabled] = useState<boolean>(false);


  // Load wallets on startup
  useEffect(() => {
    async function loadWallets() {
      setIsLoading(true);
      const res = await fetchUserWallets();
      if (res.success && res.data && res.data.length > 0) {
        setWallets(res.data);
        setActiveWalletId(res.data[0].id);
      } else {
        setError(res.error || 'Failed to load wallets');
      }
      setIsLoading(false);
    }
    loadWallets();
  }, []);

  // Load jars, categories and category budgets on active wallet change
  const loadBudgetData = useCallback(async () => {
    if (!activeWalletId) return;
    setIsLoading(true);
    setError(null);

    // Load total budget from AsyncStorage first
    let walletTotalBudget = 10000000;
    try {
      const saved = await AsyncStorage.getItem(`@wallet_total_budget_${activeWalletId}`);
      if (saved) {
        walletTotalBudget = parseInt(saved, 10) || 10000000;
      }
    } catch (e) {
      console.error('Error loading total budget:', e);
    }
    setTotalBudget(walletTotalBudget);

    // Load rollover enabled setting from AsyncStorage
    let rolloverEnabled = false;
    try {
      const savedRollover = await AsyncStorage.getItem(`@wallet_rollover_enabled_${activeWalletId}`);
      if (savedRollover) {
        rolloverEnabled = savedRollover === 'true';
      }
    } catch (e) {
      console.error('Error loading rollover setting:', e);
    }
    setIsRolloverEnabled(rolloverEnabled);


    const [jarsRes, budgetsRes, categoriesRes] = await Promise.all([
      fetchJars(activeWalletId),
      fetchCategoryBudgets(activeWalletId),
      fetchCategories()
    ]);

    if (categoriesRes.success && categoriesRes.data) {
      setAllCategories(categoriesRes.data);
    }

    if (jarsRes.success && jarsRes.data) {
      // Map standard metadata names/icons for standard Jars
      const standardMeta: Record<string, { name: string; icon: string }> = {
        NEC: { name: 'Thiết yếu (NEC)', icon: '🍔' },
        FFA: { name: 'Tự do TC (FFA)', icon: '📈' },
        EDU: { name: 'Giáo dục (EDU)', icon: '📚' },
        PLAY: { name: 'Hưởng thụ (PLAY)', icon: '💃' },
        LTSS: { name: 'Tiết kiệm (LTSS)', icon: '🐷' },
        GIVE: { name: 'Từ thiện (GIVE)', icon: '💖' }
      };

      const mappedJars = jarsRes.data.map(jar => ({
        ...jar,
        name: standardMeta[jar.type]?.name || jar.type,
        icon: standardMeta[jar.type]?.icon || '💰',
        pct: jar.allocation_percentage,
        limit: walletTotalBudget * (jar.allocation_percentage / 100),
        spent: jar.spent_amount,
        enableAlerts: jar.enable_alerts
      }));
      setJars(mappedJars);
    } else {
      setError(jarsRes.error || 'Failed to load Jars');
    }

    if (budgetsRes.success && budgetsRes.data) {
      setCategoryBudgets(budgetsRes.data);
    } else {
      setError(budgetsRes.error || 'Failed to load Category Budgets');
    }

    setIsLoading(false);
  }, [activeWalletId]);

  useEffect(() => {
    loadBudgetData();
  }, [loadBudgetData]);

  const handleSaveTotalBudget = async () => {
    const cleanAmount = parseInt(totalBudgetInput.replace(/\./g, '').replace(/,/g, ''), 10);
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      Alert.alert('Lỗi', 'Tổng ngân sách phải lớn hơn 0đ.');
      return;
    }
    try {
      await AsyncStorage.setItem(`@wallet_total_budget_${activeWalletId}`, cleanAmount.toString());
      setTotalBudget(cleanAmount);
      setIsEditingTotalBudget(false);
      
      // Sync all jar limits in the database
      const updatePromises = jars.map(async (jar) => {
        const jarLimit = cleanAmount * (jar.pct / 100);
        return saveJarAllocation(activeWalletId, jar.type, jar.pct, jarLimit);
      });
      await Promise.all(updatePromises);
      
      loadBudgetData();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lưu tổng ngân sách.');
    }
  };

  const handleToggleRollover = async () => {
    try {
      const newValue = !isRolloverEnabled;
      await AsyncStorage.setItem(`@wallet_rollover_enabled_${activeWalletId}`, newValue.toString());
      setIsRolloverEnabled(newValue);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lưu thiết lập dồn ngân sách.');
    }
  };


  const handleStartEditingTotalBudget = () => {
    setTotalBudgetInput(totalBudget.toString());
    setIsEditingTotalBudget(true);
  };

  const getAlertCount = () => {
    let count = 0;
    jars.forEach(j => { if (j.enableAlerts) count++; });
    categoryBudgets.forEach(b => { if (b.enable_alerts) count++; });
    return count;
  };

  const handleToggleAlert = async (type: 'jar' | 'category', id: string, value: boolean) => {
    const currentCount = getAlertCount();
    
    // Check 3-alert limit for free users
    if (value && currentCount >= 3) {
      setIsPremiumModalVisible(true);
      return;
    }

    if (type === 'jar') {
      const res = await toggleJarAlert(id, value);
      if (res.success) {
        setJars(prev => prev.map(j => j.id === id ? { ...j, enableAlerts: value } : j));
      } else {
        Alert.alert('Lỗi', 'Không thể bật/tắt cảnh báo Hũ');
      }
    } else {
      // Guard: temp ID means this category has no budget record yet
      if (id.startsWith('temp-')) {
        Alert.alert(
          'Chưa có hạn mức',
          'Bạn cần đặt hạn mức chi tiêu cho danh mục này trước khi bật cảnh báo. Hãy nhấn ✏️ trên hũ tương ứng để thiết lập.'
        );
        return;
      }
      const res = await toggleCategoryBudgetAlert(id, value);
      if (res.success) {
        setCategoryBudgets(prev => prev.map(b => b.id === id ? { ...b, enable_alerts: value } : b));
      } else {
        Alert.alert('Lỗi', 'Không thể bật/tắt cảnh báo Hạng mục');
      }
    }
  };

  const handleDeleteJar = async (index: number) => {
    const jar = jars[index];
    Alert.alert(
      'Xác nhận',
      `Bạn chắc chắn muốn xóa hũ ${jar.name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            const res = await deleteJar(jar.id);
            if (res.success) {
              setJars(prev => prev.filter((_, i) => i !== index));
            } else {
              Alert.alert('Lỗi', 'Không thể xóa Hũ');
            }
          }
        }
      ]
    );
  };

  const handleSaveJarConfig = async (config: { name: string; icon: string; pct: number; categories: any[] }) => {
    if (editingJarIndex === null) return;
    const jar = jars[editingJarIndex];
    
    setIsSavingJar(true);
    
    // Save Jar Allocation & Cash Limit
    const jarLimit = totalBudget * (config.pct / 100);
    const allocationRes = await saveJarAllocation(activeWalletId, jar.type, config.pct, jarLimit);
    if (!allocationRes.success) {
      setIsSavingJar(false);
      Alert.alert('Lỗi', 'Lưu tỷ lệ phân bổ Hũ thất bại: ' + (allocationRes.error || ''));
      return;
    }

    // Save Category Budgets
    const userRes = await supabase.auth.getUser();
    const userId = userRes.data.user?.id;
    if (!userId) {
      setIsSavingJar(false);
      Alert.alert('Lỗi', 'Không thể xác thực người dùng. Vui lòng đăng nhập lại.');
      return;
    }

    // Find existing budgets for this jar to detect deletions
    const existingBudgetsForJar = categoryBudgets.filter(b => b.categories?.jar_type === jar.type);
    
    for (const cat of config.categories) {
      let categoryId = cat.category_id;
      
      // If it's a new custom category (does not have category_id)
      if (!categoryId) {
        // Look up if a category with the same name already exists in allCategories
        const existingCat = allCategories.find(
          c => c.name.toLowerCase() === cat.name.toLowerCase() && c.jar_type === jar.type && c.type === 'expense'
        );
        if (existingCat) {
          categoryId = existingCat.id;
        } else {
          // Create new custom category in Supabase
          const newCatRes = await createCategory({
            name: cat.name,
            icon: '💰',
            type: 'expense',
            jar_type: jar.type,
            user_id: userId
          });
          if (newCatRes.success && newCatRes.data) {
            categoryId = newCatRes.data.id;
            setAllCategories(prev => [...prev, newCatRes.data]);
          } else {
            console.error('Failed to create custom category:', newCatRes.error);
            continue;
          }
        }
      }
      
      if (categoryId) {
        await saveCategoryBudget(activeWalletId, categoryId, cat.limit, userId);
      }
    }

    // Detect and delete removed category budgets
    for (const b of existingBudgetsForJar) {
      const stillExists = config.categories.some(
        c => c.id === b.id || (c.category_id && c.category_id === b.category_id)
      );
      if (!stillExists) {
        await deleteCategoryBudget(b.id);
      }
    }

    setIsSavingJar(false);
    setIsEditSheetVisible(false);
    loadBudgetData();
    Alert.alert('Đã lưu', `Cấu hình hũ ${jar.name} đã được cập nhật thành công!`);
  };

  const totalAllocation = jars.reduce((sum, j) => sum + j.pct, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản Lý Ngân Sách</Text>
      </View>

      {isLoading && wallets.length === 0 ? (
        <ActivityIndicator size="large" color="#864e5a" style={{ marginTop: 40 }} />
      ) : (
        <>
          <WalletTabBar wallets={wallets} activeWalletId={activeWalletId} onChangeWallet={setActiveWalletId} />
          
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.totalCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.cardTitle}>Tổng ngân sách ví</Text>
                {!isEditingTotalBudget && (
                  <TouchableOpacity onPress={handleStartEditingTotalBudget} testID="btn-edit-total-budget">
                    <Ionicons name="create-outline" size={20} color="#864e5a" />
                  </TouchableOpacity>
                )}
              </View>
              {isEditingTotalBudget ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                  <TextInput
                    style={styles.totalBudgetInput}
                    value={totalBudgetInput}
                    onChangeText={setTotalBudgetInput}
                    keyboardType="numeric"
                    autoFocus
                    placeholder="Nhập tổng ngân sách..."
                  />
                  <TouchableOpacity style={styles.saveBudgetBtn} onPress={handleSaveTotalBudget} testID="btn-save-total-budget">
                    <Text style={styles.saveBudgetBtnText}>Lưu</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBudgetBtn} onPress={() => setIsEditingTotalBudget(false)}>
                    <Text style={styles.cancelBudgetBtnText}>Hủy</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.amount} onPress={handleStartEditingTotalBudget} testID="text-total-budget">{totalBudget.toLocaleString('vi-VN')}đ</Text>
              )}
              <Text style={[styles.status, totalAllocation !== 100 && styles.error]}>
                Tổng phân bổ: {totalAllocation}% {totalAllocation === 100 ? '(Hợp lệ)' : '(Phải bằng 100%)'}
              </Text>
            </View>

            {/* Rollover Toggle card */}
            <View style={styles.rolloverCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rolloverTitle}>🔄 Dồn ngân sách tháng sau</Text>
                <Text style={styles.rolloverDesc}>Dồn thặng dư hoặc bù trừ lạm chi</Text>
              </View>
              <TouchableOpacity
                style={[styles.switch, isRolloverEnabled && styles.switchActive]}
                onPress={handleToggleRollover}
                testID="btn-toggle-rollover"
              >
                <View style={[styles.switchHandle, isRolloverEnabled && styles.switchHandleActive]} />
              </TouchableOpacity>
            </View>

            {/* Preview next month budget */}
            {isRolloverEnabled && (() => {
              const totalSpent = jars.reduce((sum, j) => sum + (j.spent || 0), 0);
              const rolloverDiff = totalBudget - totalSpent;
              const isSurplus = rolloverDiff >= 0;
              const absDiff = Math.abs(rolloverDiff);
              const nextMonthBudget = totalBudget + rolloverDiff;

              return (
                <View style={[styles.previewCard, isSurplus ? styles.previewCardSurplus : styles.previewCardDeficit]}>
                  <Text style={styles.previewTitle}>DỰ BÁO NGÂN SÁCH THÁNG SAU</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <Text style={styles.previewAmount} testID="text-next-budget-amount">
                      {nextMonthBudget.toLocaleString('vi-VN')}đ
                    </Text>
                    <Text style={[styles.previewTag, isSurplus ? styles.previewTagSurplus : styles.previewTagDeficit]}>
                      {isSurplus ? `+${absDiff.toLocaleString('vi-VN')}đ Dồn dư` : `-${absDiff.toLocaleString('vi-VN')}đ Bù lạm chi`}
                    </Text>
                  </View>
                </View>
              );
            })()}

            <View style={styles.alertsBadge}>
              <Text style={styles.alertsBadgeText}>
                🔔 Cảnh báo đang hoạt động: {getAlertCount()} / 3
              </Text>
            </View>

            {jars.map((jar, idx) => {
              const jarCategories = allCategories
                .filter(cat => cat.jar_type === jar.type && cat.type === 'expense')
                .map(cat => {
                  const b = categoryBudgets.find(b => b.category_id === cat.id);
                  return {
                    id: b?.id || `temp-${cat.id}`,
                    name: cat.name,
                    amountLimit: b?.amount_limit || 0,
                    enableAlerts: b?.enable_alerts || false
                  };
                });

              return (
                <JarCard
                  key={jar.id}
                  jar={jar}
                  categories={jarCategories}
                  onToggleAlert={handleToggleAlert}
                  onEditJar={() => {
                    setEditingJarIndex(idx);
                    setIsEditSheetVisible(true);
                  }}
                  onDeleteJar={() => handleDeleteJar(idx)}
                />
              );
            })}
          </ScrollView>
        </>
      )}

      {isEditSheetVisible && editingJarIndex !== null && (
        <JarEditSheet
          visible={isEditSheetVisible}
          onClose={() => setIsEditSheetVisible(false)}
          jarData={{
            name: jars[editingJarIndex].name,
            icon: jars[editingJarIndex].icon,
            pct: jars[editingJarIndex].pct,
            categories: allCategories
              .filter(cat => cat.jar_type === jars[editingJarIndex].type && cat.type === 'expense')
              .map(cat => {
                const b = categoryBudgets.find(b => b.category_id === cat.id);
                return {
                  id: b?.id,
                  category_id: cat.id,
                  name: cat.name,
                  limit: b?.amount_limit || 0
                };
              })
          }}
          onSave={handleSaveJarConfig}
          isSaving={isSavingJar}
        />
      )}

      <PremiumModal visible={isPremiumModalVisible} onClose={() => setIsPremiumModalVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff8f7' },
  header: { backgroundColor: '#ffffff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#fff0f1' },
  title: { fontSize: 18, fontWeight: '700', color: '#864e5a', textAlign: 'center', fontFamily: 'Plus Jakarta Sans' },
  scroll: { padding: 16, paddingBottom: 24 },
  totalCard: { backgroundColor: 'white', borderRadius: 24, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#FFDDE2' },
  cardTitle: { fontSize: 11, color: '#837375', textTransform: 'uppercase', fontWeight: 'bold', fontFamily: 'Plus Jakarta Sans' },
  amount: { fontSize: 24, fontWeight: 'bold', color: '#864e5a', marginVertical: 4, fontFamily: 'Plus Jakarta Sans' },
  totalBudgetInput: { flex: 1, borderWidth: 1, borderColor: '#FFDDE2', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 12, fontSize: 16, color: '#23191a', fontWeight: '700', fontFamily: 'Plus Jakarta Sans' },
  saveBudgetBtn: { backgroundColor: '#864e5a', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  saveBudgetBtnText: { color: 'white', fontSize: 12, fontWeight: '700', fontFamily: 'Plus Jakarta Sans' },
  cancelBudgetBtn: { borderWidth: 1, borderColor: '#864e5a', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  cancelBudgetBtnText: { color: '#864e5a', fontSize: 12, fontWeight: '700', fontFamily: 'Plus Jakarta Sans' },
  status: { fontSize: 11, color: '#10b981', fontWeight: 'bold', fontFamily: 'Plus Jakarta Sans' },
  error: { color: '#ba1a1a' },
  alertsBadge: { backgroundColor: '#ffb7c5', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, marginBottom: 12, alignSelf: 'flex-start' },
  alertsBadgeText: { fontSize: 12, color: '#864e5a', fontWeight: 'bold', fontFamily: 'Plus Jakarta Sans' },
  rolloverCard: { backgroundColor: 'white', borderRadius: 24, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#FFDDE2', flexDirection: 'row', alignItems: 'center' },
  rolloverTitle: { fontSize: 14, fontWeight: '700', color: '#23191a', fontFamily: 'Plus Jakarta Sans' },
  rolloverDesc: { fontSize: 11, color: '#837375', marginTop: 2, fontFamily: 'Plus Jakarta Sans' },
  switch: { width: 48, height: 26, borderRadius: 13, backgroundColor: '#e2dcdb', padding: 2, justifyContent: 'center' },
  switchActive: { backgroundColor: '#864e5a' },
  switchHandle: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'white', shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 2, elevation: 1 },
  switchHandleActive: { alignSelf: 'flex-end' },
  previewCard: { borderRadius: 24, padding: 16, marginBottom: 12, borderWidth: 1 },
  previewCardSurplus: { backgroundColor: '#f0fdf4', borderColor: 'rgba(16, 185, 129, 0.2)' },
  previewCardDeficit: { backgroundColor: '#fef2f2', borderColor: 'rgba(186, 26, 26, 0.2)' },
  previewTitle: { fontSize: 11, color: '#837375', fontWeight: 'bold', fontFamily: 'Plus Jakarta Sans' },
  previewAmount: { fontSize: 20, fontWeight: 'bold', color: '#23191a', fontFamily: 'Plus Jakarta Sans' },
  previewTag: { fontSize: 11, fontWeight: 'bold', borderRadius: 12, paddingVertical: 2, paddingHorizontal: 8 },
  previewTagSurplus: { backgroundColor: '#d1fae5', color: '#10b981' },
  previewTagDeficit: { backgroundColor: '#ffe7e6', color: '#ba1a1a' }
});

