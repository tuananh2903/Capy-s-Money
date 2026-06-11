import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { createTransaction } from '../services/dashboardService';
import { supabase } from '../services/supabaseClient';

interface QuickAddBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  walletId: string;
  userId: string;
  onSaveSuccess: () => void;
}

const JARS = [
  { type: 'NEC' as const, name: 'Thiết yếu', icon: '🛒', color: '#FFB7C5', bgColor: '#FFF0F1' },
  { type: 'LTSS' as const, name: 'Tiết kiệm', icon: '🏦', color: '#A8DFCE', bgColor: '#F0FFF8' },
  { type: 'EDU' as const, name: 'Giáo dục', icon: '📚', color: '#B4CAFF', bgColor: '#F0F4FF' },
  { type: 'PLAY' as const, name: 'Hưởng thụ', icon: '🎉', color: '#FCB7FF', bgColor: '#FFF0FF' },
  { type: 'FFA' as const, name: 'Tự do TC', icon: '🌟', color: '#FFD4A8', bgColor: '#FFF8F0' },
  { type: 'GIVE' as const, name: 'Cho đi', icon: '🎁', color: '#C8B7FF', bgColor: '#F5F0FF' },
];

// Subcategories per jar type
const SUBCATEGORIES: Record<string, { name: string; icon: string }[]> = {
  NEC: [
    { name: 'Ăn uống', icon: '🍜' },
    { name: 'Thuê nhà', icon: '🏠' },
    { name: 'Đi lại', icon: '🚌' },
    { name: 'Khác', icon: '⋯' },
  ],
  LTSS: [
    { name: 'Tiết kiệm', icon: '🏦' },
    { name: 'Đầu tư', icon: '📈' },
    { name: 'Quỹ dự phòng', icon: '🛡️' },
    { name: 'Khác', icon: '⋯' },
  ],
  EDU: [
    { name: 'Khóa học', icon: '🎓' },
    { name: 'Sách', icon: '📖' },
    { name: 'Hội thảo', icon: '🎤' },
    { name: 'Khác', icon: '⋯' },
  ],
  PLAY: [
    { name: 'Du lịch', icon: '✈️' },
    { name: 'Giải trí', icon: '🎬' },
    { name: 'Mua sắm', icon: '🛍️' },
    { name: 'Khác', icon: '⋯' },
  ],
  FFA: [
    { name: 'Cổ phiếu', icon: '📊' },
    { name: 'BĐS', icon: '🏡' },
    { name: 'Crypto', icon: '₿' },
    { name: 'Khác', icon: '⋯' },
  ],
  GIVE: [
    { name: 'Từ thiện', icon: '❤️' },
    { name: 'Quà tặng', icon: '🎁' },
    { name: 'Gia đình', icon: '👨‍👩‍👧' },
    { name: 'Khác', icon: '⋯' },
  ],
};

const INCOME_SUBCATEGORIES = [
  { name: 'Lương', icon: '💼' },
  { name: 'Thưởng', icon: '🏆' },
  { name: 'Đầu tư', icon: '📈' },
  { name: 'Freelance', icon: '💻' },
  { name: 'Khác', icon: '⋯' },
];

export default function QuickAddBottomSheet({
  visible,
  onClose,
  walletId,
  userId,
  onSaveSuccess,
}: QuickAddBottomSheetProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amountText, setAmountText] = useState('');
  const [selectedJar, setSelectedJar] = useState<'NEC' | 'FFA' | 'EDU' | 'PLAY' | 'LTSS' | 'GIVE'>('NEC');
  const [selectedSubcategory, setSelectedSubcategory] = useState('Ăn uống');
  const [note, setNote] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [activeJars, setActiveJars] = useState<any[]>([]);
  const [activeBudgets, setActiveBudgets] = useState<any[]>([]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());

  // Load categories, jars, and budgets from database on visible changes
  useEffect(() => {
    async function loadDbData() {
      try {
        const [categoriesRes, jarsRes, budgetsRes] = await Promise.all([
          supabase.from('categories').select('*'),
          supabase.from('jars').select('*').eq('user_id', userId),
          supabase.from('budgets').select('*, categories(*)').eq('user_id', userId)
        ]);

        if (categoriesRes.data) {
          setDbCategories(categoriesRes.data);
        }
        if (jarsRes.data) {
          // Filter to only include jars that have allocation_percentage > 0
          const activeJarsFromDb = jarsRes.data.filter(j => j.allocation_percentage > 0);
          setActiveJars(activeJarsFromDb);
        }
        if (budgetsRes.data) {
          setActiveBudgets(budgetsRes.data);
        }
      } catch (err) {
        console.error('Error loading data in QuickAddBottomSheet:', err);
      }
    }
    if (visible && userId) {
      loadDbData();
    }
  }, [visible, userId]);

  const renderedJars = useMemo(() => {
    if (activeJars.length > 0) {
      return activeJars.map(aj => {
        const meta = JARS.find(j => j.type === aj.type);
        return {
          type: aj.type,
          name: meta?.name || aj.type,
          icon: meta?.icon || '💰',
          color: meta?.color || '#FFB7C5',
          bgColor: meta?.bgColor || '#FFF0F1'
        };
      });
    }
    return JARS;
  }, [activeJars]);

  // Auto-select the first active jar if the current selected jar is not active
  useEffect(() => {
    if (activeJars.length > 0) {
      const isCurrentSelectedActive = activeJars.some(j => j.type === selectedJar);
      if (!isCurrentSelectedActive) {
        setSelectedJar(activeJars[0].type);
      }
    }
  }, [activeJars, selectedJar]);

  const getDateChipLabel = (date: Date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
    }
  };

  const formatNumber = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) return '';
    return parseInt(clean, 10).toLocaleString('vi-VN');
  };

  const handleAmountChange = (text: string) => {
    const formatted = formatNumber(text);
    setAmountText(formatted);
    setValidationError(null);
  };

  const handleJarSelect = (jarType: typeof selectedJar) => {
    setSelectedJar(jarType);
  };

  const subcats = useMemo(() => {
    if (type === 'income') {
      const incomeCats = dbCategories.filter(c => c.type === 'income');
      if (incomeCats.length > 0) {
        return incomeCats.map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon || '💰',
        }));
      }
      return INCOME_SUBCATEGORIES;
    } else {
      // Filter category budgets to only show those active for the selected jar
      const expenseBudgets = activeBudgets.filter(
        b => b.categories && b.categories.jar_type === selectedJar
      );
      if (expenseBudgets.length > 0) {
        return expenseBudgets.map(b => ({
          id: b.category_id,
          name: b.categories.name,
          icon: b.categories.icon || '💰',
        }));
      }
      return [];
    }
  }, [type, selectedJar, dbCategories, activeBudgets]);

  // Auto-reset subcategory when subcats list changes
  useEffect(() => {
    if (subcats.length > 0) {
      const stillExists = subcats.some(c => c.name === selectedSubcategory);
      if (!stillExists) {
        setSelectedSubcategory(subcats[0].name);
      }
    }
  }, [subcats, selectedSubcategory]);

  const handleSave = async () => {
    const cleanAmount = parseInt(amountText.replace(/\./g, '').replace(/,/g, ''), 10);

    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setValidationError('Số tiền giao dịch phải lớn hơn 0 đ. Vui lòng nhập lại.');
      return;
    }

    if (note.length > 200) {
      setValidationError('Ghi chú không được vượt quá 200 ký tự.');
      return;
    }

    setValidationError(null);
    setLoading(true);

    const selectedCatObj = subcats.find((c) => c.name === selectedSubcategory);
    const categoryId = selectedCatObj && 'id' in selectedCatObj ? selectedCatObj.id : null;

    const result = await createTransaction({
      wallet_id: walletId,
      jar_type: selectedJar,
      amount: cleanAmount,
      type: type,
      note: note.trim() || null,
      created_by: userId,
      occurred_at: selectedDate.toISOString(),
      category_id: categoryId,
    });

    setLoading(false);

    if (result.success) {
      setAmountText('');
      setNote('');
      setSelectedJar('NEC');
      setSelectedSubcategory('Ăn uống');
      setType('expense');
      setSelectedDate(new Date());
      onSaveSuccess();
      onClose();
    } else {
      setValidationError(result.error || 'Có lỗi xảy ra khi lưu giao dịch.');
    }
  };

  const currentJar = JARS.find((j) => j.type === selectedJar) || JARS[0];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={onClose}
        />
        <View style={styles.sheetContainer}>
          {/* Drag Indicator */}
          <View style={styles.dragIndicator} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Thêm Giao Dịch</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Tab Selector: Income / Expense — Khoản thu trước, Khoản chi sau (theo Stitch) */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.tab, type === 'income' && styles.activeTabIncome]}
                onPress={() => setType('income')}
              >
                <Text style={[styles.tabText, type === 'income' && styles.activeTabText]}>
                  Khoản thu
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.tab, type === 'expense' && styles.activeTabExpense]}
                onPress={() => setType('expense')}
              >
                <Text style={[styles.tabText, type === 'expense' && styles.activeTabText]}>
                  Khoản chi
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount input */}
            <Text style={styles.label}>Số tiền (VND)</Text>
            <View style={styles.amountInputContainer}>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor="#C9B3B5"
                keyboardType="numeric"
                value={amountText}
                onChangeText={handleAmountChange}
              />
              <Text style={styles.currencyUnit}>đ</Text>
            </View>

            {/* Hũ tài chính — only show when expense */}
            {type === 'expense' && (
              <>
                <Text style={styles.label}>Hũ tài chính</Text>
                <View style={styles.jarsContainer}>
                  {renderedJars.map((jar) => {
                    const isSelected = selectedJar === jar.type;
                    return (
                      <TouchableOpacity
                        key={jar.type}
                        activeOpacity={0.8}
                        style={[
                          styles.jarBadge,
                          { borderColor: jar.color, backgroundColor: isSelected ? jar.color : jar.bgColor },
                        ]}
                        onPress={() => handleJarSelect(jar.type)}
                      >
                        <Text style={styles.jarIcon}>{jar.icon}</Text>
                        <Text
                          style={[
                            styles.jarBadgeText,
                            { color: isSelected ? '#FFFFFF' : '#4A3E3F' },
                          ]}
                        >
                          {jar.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Hạng mục con */}
            <Text style={styles.label}>Hạng mục con</Text>
            <View style={styles.subcatContainer}>
              {subcats.map((cat) => {
                const isSelected = selectedSubcategory === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.name}
                    activeOpacity={0.8}
                    style={[
                      styles.subcatBadge,
                      isSelected && { backgroundColor: '#FFB7C5', borderColor: '#FFB7C5' },
                    ]}
                    onPress={() => setSelectedSubcategory(cat.name)}
                  >
                    <Text style={styles.subcatIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.subcatText,
                        isSelected && { color: '#FFFFFF', fontWeight: '700' },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Thời gian & Ghi chú — row layout like Stitch */}
            <View style={styles.rowSection}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Thời gian</Text>
                <TouchableOpacity
                  style={styles.dateChip}
                  activeOpacity={0.8}
                  onPress={() => {
                    setCurrentCalendarMonth(new Date(selectedDate));
                    setShowDatePicker(true);
                  }}
                  testID="date-picker-button"
                >
                  <Text style={styles.dateIcon}>📅</Text>
                  <Text style={styles.dateText}>{getDateChipLabel(selectedDate)}</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.rowItem, { marginLeft: 12 }]}>
                <Text style={styles.label}>Ghi chú</Text>
                <TextInput
                  style={styles.noteInputInline}
                  placeholder="Nhập ghi chú..."
                  placeholderTextColor="#C9B3B5"
                  value={note}
                  onChangeText={(text) => {
                    setNote(text);
                    setValidationError(null);
                  }}
                  maxLength={200}
                />
              </View>
            </View>

            {/* Validation Error */}
            {validationError && (
              <Text style={styles.errorText}>{validationError}</Text>
            )}

            {/* Save button — hồng pastel theo Stitch */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Đang lưu...' : 'Lưu giao dịch'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          transparent
          visible={showDatePicker}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity
                  onPress={() => {
                    const prev = new Date(currentCalendarMonth);
                    prev.setMonth(prev.getMonth() - 1);
                    setCurrentCalendarMonth(prev);
                  }}
                  style={styles.monthNavButton}
                >
                  <Text style={styles.monthNavText}>◀</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerTitle}>
                  Tháng {currentCalendarMonth.getMonth() + 1}, {currentCalendarMonth.getFullYear()}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const next = new Date(currentCalendarMonth);
                    next.setMonth(next.getMonth() + 1);
                    setCurrentCalendarMonth(next);
                  }}
                  style={styles.monthNavButton}
                >
                  <Text style={styles.monthNavText}>▶</Text>
                </TouchableOpacity>
              </View>

              {/* Weekday headers */}
              <View style={styles.weekdayRow}>
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((w, index) => (
                  <Text key={index} style={styles.weekdayText}>{w}</Text>
                ))}
              </View>

              {/* Calendar Days */}
              <View style={styles.calendarGrid}>
                {(() => {
                  const year = currentCalendarMonth.getFullYear();
                  const month = currentCalendarMonth.getMonth();
                  const firstDay = new Date(year, month, 1).getDay();
                  const totalDays = new Date(year, month + 1, 0).getDate();
                  const cells = [];
                  
                  // Empty cells
                  for (let i = 0; i < firstDay; i++) {
                    cells.push(<View key={`empty-${i}`} style={styles.calendarCell} />);
                  }
                  
                  // Day cells
                  for (let d = 1; d <= totalDays; d++) {
                    const cellDate = new Date(year, month, d);
                    const isSelected = cellDate.toDateString() === selectedDate.toDateString();
                    cells.push(
                      <TouchableOpacity
                        key={`day-${d}`}
                        style={[styles.calendarCell, isSelected && styles.selectedCell]}
                        onPress={() => {
                          setSelectedDate(cellDate);
                          setShowDatePicker(false);
                        }}
                      >
                        <Text style={[styles.cellText, isSelected && styles.selectedCellText]}>{d}</Text>
                      </TouchableOpacity>
                    );
                  }
                  
                  return cells;
                })()}
              </View>

              <TouchableOpacity
                style={styles.cancelPickerButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.cancelPickerText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(74, 62, 63, 0.45)',
  },
  sheetContainer: {
    backgroundColor: '#FFF8F7',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    maxHeight: '92%',
    shadowColor: '#864E5A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
  dragIndicator: {
    width: 44,
    height: 5,
    backgroundColor: '#F1DEDF',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#F1DEDF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#23191A',
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#F1DEDF',
    borderRadius: 100,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    color: '#864E5A',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  // Tab: Khoản thu | Khoản chi
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1DEDF',
    borderRadius: 100,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabIncome: {
    backgroundColor: '#FFB7C5',
    shadowColor: '#864E5A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  activeTabExpense: {
    backgroundColor: '#864E5A',
    shadowColor: '#864E5A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#837375',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#514345',
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  // Amount
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#F1DEDF',
    paddingHorizontal: 18,
    marginBottom: 16,
    shadowColor: '#864E5A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 28,
    color: '#23191A',
    fontWeight: '700',
  },
  currencyUnit: {
    fontSize: 22,
    fontWeight: '700',
    color: '#864E5A',
    marginLeft: 8,
  },
  // Jars
  jarsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  jarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 5,
  },
  jarIcon: {
    fontSize: 14,
  },
  jarBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Subcategories
  subcatContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  subcatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F1DEDF',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    gap: 5,
  },
  subcatIcon: {
    fontSize: 13,
  },
  subcatText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#514345',
  },
  // Row section (date + note)
  rowSection: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 8,
  },
  rowItem: {
    flex: 1,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F1DEDF',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  dateIcon: {
    fontSize: 14,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#514345',
  },
  noteInputInline: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#F1DEDF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#23191A',
    height: 44,
  },
  errorText: {
    color: '#BA1A1A',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 4,
  },
  // Save button — hồng pastel theo Stitch
  saveButton: {
    backgroundColor: '#864E5A',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#864E5A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#D6C2C4',
    shadowColor: 'transparent',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Date Picker Custom Styles
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(35, 25, 26, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    width: '85%',
    backgroundColor: '#FFF8F7',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1DEDF',
    shadowColor: '#864E5A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthNavButton: {
    padding: 8,
  },
  monthNavText: {
    fontSize: 16,
    color: '#864E5A',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#23191A',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#837375',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  calendarCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  selectedCell: {
    backgroundColor: '#FFB7C5',
    borderRadius: 20,
  },
  cellText: {
    fontSize: 14,
    color: '#23191A',
    fontWeight: '500',
  },
  selectedCellText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cancelPickerButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1DEDF',
  },
  cancelPickerText: {
    color: '#837375',
    fontSize: 14,
    fontWeight: '600',
  },
});
