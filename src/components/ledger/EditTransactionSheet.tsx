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
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../services/supabaseClient';
import { LedgerTransaction, UpdateTransactionPayload } from '../../services/ledgerService';

// ─── Constants ────────────────────────────────────────────────────────────────

const JARS = [
  { type: 'NEC' as const, name: 'Thiết yếu', icon: '🛒', color: '#FFB7C5', bgColor: '#FFF0F1' },
  { type: 'LTSS' as const, name: 'Tiết kiệm', icon: '🏦', color: '#A8DFCE', bgColor: '#F0FFF8' },
  { type: 'EDU' as const, name: 'Giáo dục', icon: '📚', color: '#B4CAFF', bgColor: '#F0F4FF' },
  { type: 'PLAY' as const, name: 'Hưởng thụ', icon: '🎉', color: '#FCB7FF', bgColor: '#FFF0FF' },
  { type: 'FFA' as const, name: 'Tự do TC', icon: '🌟', color: '#FFD4A8', bgColor: '#FFF8F0' },
  { type: 'GIVE' as const, name: 'Cho đi', icon: '🎁', color: '#C8B7FF', bgColor: '#F5F0FF' },
];

const INCOME_SUBCATEGORIES = [
  { id: null, name: 'Lương', icon: '💼' },
  { id: null, name: 'Thưởng', icon: '🏆' },
  { id: null, name: 'Đầu tư', icon: '📈' },
  { id: null, name: 'Freelance', icon: '💻' },
  { id: null, name: 'Khác', icon: '⋯' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(val: string): string {
  const clean = val.replace(/[^0-9]/g, '');
  if (!clean) return '';
  return parseInt(clean, 10).toLocaleString('vi-VN');
}

function getDateChipLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Hôm nay';
  if (date.toDateString() === yesterday.toDateString()) return 'Hôm qua';
  return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
}

function getTypeBadge(type: 'income' | 'expense' | 'transfer') {
  if (type === 'income') return { label: 'Khoản thu', bg: '#34c759', text: '#ffffff' };
  if (type === 'expense') return { label: 'Khoản chi', bg: '#864e5a', text: '#ffffff' };
  return { label: 'Chuyển khoản', bg: '#71585c', text: '#ffffff' };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  transaction: LedgerTransaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (txId: string, data: UpdateTransactionPayload) => Promise<boolean>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditTransactionSheet({ transaction, isOpen, onClose, onSave }: Props) {
  // ─── Form state ───────────────────────────────────────────────────────────
  const [amountText, setAmountText] = useState('');
  const [note, setNote] = useState('');
  const [selectedJar, setSelectedJar] = useState<'NEC' | 'FFA' | 'EDU' | 'PLAY' | 'LTSS' | 'GIVE'>('NEC');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedWalletId, setSelectedWalletId] = useState('');

  // ─── UI state ─────────────────────────────────────────────────────────────
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());

  // ─── Remote data ──────────────────────────────────────────────────────────
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [activeBudgets, setActiveBudgets] = useState<any[]>([]);
  const [wallets, setWallets] = useState<{ id: string; name: string }[]>([]);
  const [activeJars, setActiveJars] = useState<any[]>([]);

  // ─── Pre-fill when transaction changes or sheet opens ────────────────────
  useEffect(() => {
    if (isOpen && transaction) {
      const amount = transaction.amount;
      setAmountText(amount > 0 ? amount.toLocaleString('vi-VN') : '');
      setNote(transaction.note ?? '');
      setSelectedJar(transaction.jar_type);
      setSelectedCategoryId(transaction.category_id ?? null);
      setSelectedCategoryName(transaction.categories?.name ?? '');
      setSelectedDate(new Date(transaction.occurred_at));
      setCurrentCalendarMonth(new Date(transaction.occurred_at));
      setSelectedWalletId(transaction.wallet_id);
      setValidationError(null);
    }
  }, [isOpen, transaction?.id]);

  // ─── Load DB data when sheet opens ───────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !transaction) return;

    async function loadData() {
      try {
        const [catsRes, jarsRes, budgetsRes, walletsRes] = await Promise.all([
          supabase.from('categories').select('*'),
          supabase.from('jars').select('*').eq('user_id', transaction!.created_by),
          supabase.from('budgets').select('*, categories(*)').eq('user_id', transaction!.created_by),
          supabase.from('wallets').select('id, name').eq('is_deleted', false),
        ]);

        if (catsRes.data) setDbCategories(catsRes.data);
        if (jarsRes.data) {
          setActiveJars(jarsRes.data.filter((j: any) => j.allocation_percentage > 0));
        }
        if (budgetsRes.data) setActiveBudgets(budgetsRes.data);
        if (walletsRes.data) setWallets(walletsRes.data);
      } catch (err) {
        // silently fail — form still works with pre-filled data
      }
    }

    loadData();
  }, [isOpen, transaction?.id]);

  // ─── Derived jars list ───────────────────────────────────────────────────
  const renderedJars = useMemo(() => {
    if (activeJars.length > 0) {
      return activeJars.map((aj: any) => {
        const meta = JARS.find(j => j.type === aj.type);
        return {
          type: aj.type,
          name: meta?.name || aj.type,
          icon: meta?.icon || '💰',
          color: meta?.color || '#FFB7C5',
          bgColor: meta?.bgColor || '#FFF0F1',
        };
      });
    }
    return JARS;
  }, [activeJars]);

  // ─── Derived subcategory list ────────────────────────────────────────────
  const subcats = useMemo(() => {
    if (!transaction) return [];
    if (transaction.type === 'income') {
      const incomeCats = dbCategories.filter((c: any) => c.type === 'income');
      if (incomeCats.length > 0) {
        return incomeCats.map((c: any) => ({ id: c.id, name: c.name, icon: c.icon || '💰' }));
      }
      return INCOME_SUBCATEGORIES;
    }
    // expense: filter by jar
    const expenseBudgets = activeBudgets.filter(
      (b: any) => b.categories && b.categories.jar_type === selectedJar
    );
    if (expenseBudgets.length > 0) {
      return expenseBudgets.map((b: any) => ({
        id: b.category_id,
        name: b.categories.name,
        icon: b.categories.icon || '💰',
      }));
    }
    return [];
  }, [transaction?.type, selectedJar, dbCategories, activeBudgets]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleAmountChange = (text: string) => {
    setAmountText(formatNumber(text));
    setValidationError(null);
  };

  const handleSave = async () => {
    if (!transaction) return;

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

    const payload: UpdateTransactionPayload = {
      amount: cleanAmount,
      note: note.trim() || null,
      occurred_at: selectedDate.toISOString(),
      wallet_id: selectedWalletId,
      ...(transaction.type === 'expense' && { jar_type: selectedJar }),
      category_id: selectedCategoryId,
    };

    const ok = await onSave(transaction.id, payload);
    setLoading(false);

    if (!ok) {
      setValidationError('Không thể lưu thay đổi. Vui lòng thử lại.');
    }
    // If ok === true, parent handles closing both sheets
  };

  if (!transaction || !isOpen) return null;

  const typeBadge = getTypeBadge(transaction.type);
  const isExpense = transaction.type === 'expense';

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      testID="edit-transaction-modal"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={onClose}
          testID="edit-sheet-overlay"
        />
        <View style={styles.sheetContainer}>
          {/* Drag handle */}
          <View style={styles.dragIndicator} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Sửa Giao Dịch</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} testID="edit-sheet-close">
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Type badge — read-only */}
            <View style={[styles.typeBadge, { backgroundColor: typeBadge.bg }]}>
              <Text style={[styles.typeBadgeText, { color: typeBadge.text }]}>{typeBadge.label}</Text>
            </View>

            {/* Amount */}
            <Text style={styles.label}>Số tiền (VND)</Text>
            <View style={styles.amountInputContainer}>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor="#C9B3B5"
                keyboardType="numeric"
                value={amountText}
                onChangeText={handleAmountChange}
                testID="edit-amount-input"
              />
              <Text style={styles.currencyUnit}>đ</Text>
            </View>

            {/* Wallet selector */}
            <Text style={styles.label}>Ví / Tài khoản</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.walletSelectorScroll}
              contentContainerStyle={styles.walletSelectorContent}
            >
              {wallets.map(w => {
                const isActive = selectedWalletId === w.id;
                return (
                  <TouchableOpacity
                    key={w.id}
                    activeOpacity={0.8}
                    style={[styles.walletPill, isActive ? styles.walletPillActive : styles.walletPillInactive]}
                    onPress={() => setSelectedWalletId(w.id)}
                    testID={`wallet-pill-${w.id}`}
                  >
                    <Text style={isActive ? styles.walletPillTextActive : styles.walletPillTextInactive}>
                      {w.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Jar selector — only for expense */}
            {isExpense && (
              <>
                <Text style={styles.label}>Hũ tài chính</Text>
                <View style={styles.jarsContainer}>
                  {renderedJars.map(jar => {
                    const isSelected = selectedJar === jar.type;
                    return (
                      <TouchableOpacity
                        key={jar.type}
                        activeOpacity={0.8}
                        style={[
                          styles.jarBadge,
                          { borderColor: jar.color, backgroundColor: isSelected ? jar.color : jar.bgColor },
                        ]}
                        onPress={() => setSelectedJar(jar.type)}
                        testID={`jar-badge-${jar.type}`}
                      >
                        <Text style={styles.jarIcon}>{jar.icon}</Text>
                        <Text style={[styles.jarBadgeText, { color: isSelected ? '#FFFFFF' : '#4A3E3F' }]}>
                          {jar.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Category selector */}
            {subcats.length > 0 && (
              <>
                <Text style={styles.label}>Hạng mục</Text>
                <View style={styles.subcatContainer}>
                  {subcats.map(cat => {
                    const isSelected = selectedCategoryId === cat.id ||
                      (cat.id === null && selectedCategoryName === cat.name);
                    return (
                      <TouchableOpacity
                        key={`${cat.id}-${cat.name}`}
                        activeOpacity={0.8}
                        style={[styles.subcatBadge, isSelected && { backgroundColor: '#FFB7C5', borderColor: '#FFB7C5' }]}
                        onPress={() => {
                          setSelectedCategoryId(cat.id);
                          setSelectedCategoryName(cat.name);
                        }}
                        testID={`category-badge-${cat.name}`}
                      >
                        <Text style={styles.subcatIcon}>{cat.icon}</Text>
                        <Text style={[styles.subcatText, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Date & Note row */}
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
                  testID="edit-date-picker-button"
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
                  onChangeText={text => {
                    setNote(text);
                    setValidationError(null);
                  }}
                  maxLength={200}
                  testID="edit-note-input"
                />
              </View>
            </View>

            {/* Validation error */}
            {validationError && (
              <Text style={styles.errorText} testID="edit-validation-error">{validationError}</Text>
            )}

            {/* Save button */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={handleSave}
              disabled={loading}
              testID="edit-save-button"
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
              )}
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
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((w, i) => (
                  <Text key={i} style={styles.weekdayText}>{w}</Text>
                ))}
              </View>

              {/* Calendar days */}
              <View style={styles.calendarGrid}>
                {(() => {
                  const year = currentCalendarMonth.getFullYear();
                  const month = currentCalendarMonth.getMonth();
                  const firstDay = new Date(year, month, 1).getDay();
                  const totalDays = new Date(year, month + 1, 0).getDate();
                  const cells = [];

                  for (let i = 0; i < firstDay; i++) {
                    cells.push(<View key={`empty-${i}`} style={styles.calendarCell} />);
                  }

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

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    marginBottom: 20,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#514345',
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1DEDF',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: '#23191A',
    paddingVertical: 14,
  },
  currencyUnit: {
    fontSize: 20,
    fontWeight: '700',
    color: '#864E5A',
  },
  // Wallet selector
  walletSelectorScroll: { marginBottom: 20 },
  walletSelectorContent: { gap: 8, paddingVertical: 4 },
  walletPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  walletPillActive: {
    backgroundColor: '#864E5A',
    borderColor: '#864E5A',
  },
  walletPillInactive: {
    backgroundColor: '#FFF8F7',
    borderColor: '#D6C2C4',
  },
  walletPillTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  walletPillTextInactive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#514345',
  },
  // Jars
  jarsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  jarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  jarIcon: { fontSize: 14 },
  jarBadgeText: { fontSize: 13, fontWeight: '600' },
  // Subcategories
  subcatContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  subcatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: '#D6C2C4',
    backgroundColor: '#FFF8F7',
  },
  subcatIcon: { fontSize: 14 },
  subcatText: { fontSize: 13, fontWeight: '600', color: '#514345' },
  // Date & Note row
  rowSection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  rowItem: { flex: 1 },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1DEDF',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dateIcon: { fontSize: 16 },
  dateText: { fontSize: 13, fontWeight: '600', color: '#23191A' },
  noteInputInline: {
    backgroundColor: '#F1DEDF',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#23191A',
    fontWeight: '500',
  },
  // Error
  errorText: {
    fontSize: 12,
    color: '#BA1A1A',
    fontWeight: '500',
    marginBottom: 12,
  },
  // Save button
  saveButton: {
    backgroundColor: '#864E5A',
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
    shadowColor: '#864E5A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  disabledButton: { opacity: 0.6 },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Date picker
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(74, 62, 63, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#23191A',
  },
  monthNavButton: {
    padding: 8,
    backgroundColor: '#F1DEDF',
    borderRadius: 100,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavText: { fontSize: 14, color: '#864E5A', fontWeight: '700' },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#837375',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCell: {
    backgroundColor: '#864E5A',
    borderRadius: 100,
  },
  cellText: { fontSize: 14, color: '#23191A', fontWeight: '500' },
  selectedCellText: { color: '#FFFFFF', fontWeight: '700' },
  cancelPickerButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelPickerText: { fontSize: 14, fontWeight: '600', color: '#864E5A' },
});
