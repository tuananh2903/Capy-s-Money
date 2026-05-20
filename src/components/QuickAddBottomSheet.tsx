import React, { useState } from 'react';
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

interface QuickAddBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  walletId: string;
  userId: string;
  onSaveSuccess: () => void;
}

const JARS = [
  { type: 'NEC' as const, name: 'Thiết yếu', color: '#FF8C8C' },
  { type: 'LTSS' as const, name: 'Tiết kiệm', color: '#A8E6CF' },
  { type: 'FFA' as const, name: 'Tự do TC', color: '#FFD3B6' },
  { type: 'EDU' as const, name: 'Giáo dục', color: '#D4E2FC' },
  { type: 'PLAY' as const, name: 'Hưởng thụ', color: '#FCE1FC' },
  { type: 'GIVE' as const, name: 'Cho đi', color: '#EAE1FC' },
];

export default function QuickAddBottomSheet({
  visible,
  onClose,
  walletId,
  userId,
  onSaveSuccess,
}: QuickAddBottomSheetProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amountText, setAmountText] = useState('');
  const [selectedJar, setSelectedJar] = useState<'NEC' | 'FFA' | 'EDU' | 'PLAY' | 'LTSS' | 'GIVE'>('NEC');
  const [note, setNote] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formatNumber = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) return '';
    return parseInt(clean, 10).toLocaleString('en-US');
  };

  const handleAmountChange = (text: string) => {
    const formatted = formatNumber(text);
    setAmountText(formatted);
    setValidationError(null);
  };

  const handleSave = async () => {
    const cleanAmount = parseInt(amountText.replace(/,/g, ''), 10);
    
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setValidationError('Số tiền giao dịch phải lớn hơn 0.');
      return;
    }

    if (note.length > 200) {
      setValidationError('Ghi chú không được vượt quá 200 ký tự.');
      return;
    }

    setValidationError(null);
    setLoading(true);

    const result = await createTransaction({
      wallet_id: walletId,
      jar_type: selectedJar,
      amount: cleanAmount,
      type: type,
      note: note.trim() || null,
      created_by: userId,
      occurred_at: new Date().toISOString(),
    });

    setLoading(false);

    if (result.success) {
      // Reset state
      setAmountText('');
      setNote('');
      setSelectedJar('NEC');
      setType('expense');
      
      onSaveSuccess();
      onClose();
    } else {
      setValidationError(result.error || 'Có lỗi xảy ra khi lưu giao dịch.');
    }
  };

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

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Thêm giao dịch</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Tab Selector: Expense / Income */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.tab, type === 'expense' && styles.activeTabExpense]}
                onPress={() => setType('expense')}
              >
                <Text style={[styles.tabText, type === 'expense' && styles.activeTabText]}>
                  Khoản Chi
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.tab, type === 'income' && styles.activeTabIncome]}
                onPress={() => setType('income')}
              >
                <Text style={[styles.tabText, type === 'income' && styles.activeTabText]}>
                  Khoản Thu
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount input */}
            <Text style={styles.label}>Số tiền (VND)</Text>
            <View style={styles.amountInputContainer}>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor="#A89A9B"
                keyboardType="numeric"
                value={amountText}
                onChangeText={handleAmountChange}
              />
              <Text style={styles.currencyUnit}>đ</Text>
            </View>

            {/* Jars selection */}
            <Text style={styles.label}>Chọn Hũ Tài Chính</Text>
            <View style={styles.jarsContainer}>
              {JARS.map((jar) => {
                const isSelected = selectedJar === jar.type;
                return (
                  <TouchableOpacity
                    key={jar.type}
                    activeOpacity={0.8}
                    style={[
                      styles.jarBadge,
                      { borderColor: jar.color },
                      isSelected && { backgroundColor: jar.color },
                    ]}
                    onPress={() => setSelectedJar(jar.type)}
                  >
                    <Text
                      style={[
                        styles.jarBadgeText,
                        isSelected && styles.jarBadgeTextSelected,
                      ]}
                    >
                      {jar.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Note input */}
            <Text style={styles.label}>Ghi chú</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Nhập ghi chú (tùy chọn)..."
              placeholderTextColor="#A89A9B"
              value={note}
              onChangeText={(text) => {
                setNote(text);
                setValidationError(null);
              }}
              maxLength={250}
              multiline
            />

            {/* Validation Error Message */}
            {validationError && (
              <Text style={styles.errorText}>{validationError}</Text>
            )}

            {/* Action Buttons */}
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
    backgroundColor: 'rgba(74, 62, 63, 0.4)',
  },
  sheetContainer: {
    backgroundColor: '#FFF8F7',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    maxHeight: '90%',
    shadowColor: '#4A3E3F',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 24,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#FFE5E2',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#FFE5E2',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A3E3F',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#8A7A7B',
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFE5E2',
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabExpense: {
    backgroundColor: '#FF8C8C',
  },
  activeTabIncome: {
    backgroundColor: '#20E3B2',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8A7A7B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A3E3F',
    marginBottom: 8,
    marginTop: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFE5E2',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 24,
    color: '#4A3E3F',
    fontWeight: 'bold',
  },
  currencyUnit: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF8C8C',
    marginLeft: 8,
  },
  jarsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  jarBadge: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  jarBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4A3E3F',
  },
  jarBadgeTextSelected: {
    color: '#FFFFFF',
  },
  noteInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFE5E2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#4A3E3F',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  errorText: {
    color: '#E84545',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#20E3B2',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#20E3B2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#D1C7C8',
    shadowColor: 'transparent',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
