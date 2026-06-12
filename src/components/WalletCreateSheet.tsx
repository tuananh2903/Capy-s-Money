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
  ActivityIndicator,
} from 'react-native';
import { createWallet } from '../services/dashboardService';

interface WalletCreateSheetProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onSaveSuccess: () => void;
}

const COLORS = [
  { label: '🌸', value: '#FFB7C5' },
  { label: '🍊', value: '#FFD4A8' },
  { label: '🌼', value: '#FFFEC4' },
  { label: '🌿', value: '#A8DFCE' },
  { label: '💧', value: '#B4CAFF' },
  { label: '🍇', value: '#C8B7FF' },
];

const ICONS = [
  { label: '💳', value: 'wallet-outline' },
  { label: '🏡', value: 'home-outline' },
  { label: '🏦', value: 'business-outline' },
  { label: '💼', value: 'briefcase-outline' },
  { label: '🦦', value: 'paw-outline' },
  { label: '👥', value: 'people-outline' },
];

export default function WalletCreateSheet({
  visible,
  onClose,
  userId,
  onSaveSuccess,
}: WalletCreateSheetProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'personal' | 'shared'>('personal');
  const [balanceText, setBalanceText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFB7C5');
  const [selectedIcon, setSelectedIcon] = useState('wallet-outline');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formatNumber = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) return '';
    return parseInt(clean, 10).toLocaleString('vi-VN');
  };

  const handleBalanceChange = (text: string) => {
    const formatted = formatNumber(text);
    setBalanceText(formatted);
    setValidationError(null);
  };

  const handleCreate = async () => {
    const cleanName = name.trim();
    if (!cleanName) {
      setValidationError('Tên ví không được để trống.');
      return;
    }
    if (cleanName.length > 32) {
      setValidationError('Tên ví không được vượt quá 32 ký tự.');
      return;
    }

    const cleanBalance = parseInt(balanceText.replace(/\./g, '').replace(/,/g, ''), 10) || 0;

    setValidationError(null);
    setLoading(true);

    const result = await createWallet({
      name: cleanName,
      type: type,
      balance: cleanBalance,
      color: selectedColor,
      icon: selectedIcon,
      user_id: userId,
      is_default: false,
    });

    setLoading(false);

    if (result.success) {
      setName('');
      setBalanceText('');
      setType('personal');
      setSelectedColor('#FFB7C5');
      setSelectedIcon('wallet-outline');
      onSaveSuccess();
      onClose();
    } else {
      setValidationError(result.error || 'Có lỗi xảy ra khi tạo ví.');
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
          testID="create-wallet-backdrop"
          activeOpacity={1}
          style={styles.backdrop}
          onPress={onClose}
        />
        <View style={styles.sheetContainer}>
          {/* Drag Indicator */}
          <View style={styles.dragIndicator} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Tạo Ví Mới</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Wallet Name */}
            <Text style={styles.label}>Tên ví</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên ví (ví dụ: Ví Ăn Tiêu)"
              placeholderTextColor="#C9B3B5"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setValidationError(null);
              }}
            />

            {/* Initial Balance */}
            <Text style={styles.label}>Số dư khởi tạo (VND)</Text>
            <View style={styles.balanceInputContainer}>
              <TextInput
                style={styles.balanceInput}
                placeholder="0"
                placeholderTextColor="#C9B3B5"
                keyboardType="numeric"
                value={balanceText}
                onChangeText={handleBalanceChange}
              />
              <Text style={styles.currencyUnit}>đ</Text>
            </View>

            {/* Color Picker */}
            <Text style={styles.label}>Màu sắc đại diện</Text>
            <View style={styles.pickerContainer}>
              {COLORS.map((color) => {
                const isSelected = selectedColor === color.value;
                return (
                  <TouchableOpacity
                    key={color.value}
                    activeOpacity={0.8}
                    style={[
                      styles.pickerItem,
                      { backgroundColor: color.value },
                      isSelected && styles.selectedPickerItem,
                    ]}
                    onPress={() => setSelectedColor(color.value)}
                  >
                    <Text style={styles.pickerLabel}>{color.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Icon Picker */}
            <Text style={styles.label}>Biểu tượng đại diện</Text>
            <View style={styles.pickerContainer}>
              {ICONS.map((icon) => {
                const isSelected = selectedIcon === icon.value;
                return (
                  <TouchableOpacity
                    key={icon.value}
                    activeOpacity={0.8}
                    style={[
                      styles.pickerItem,
                      isSelected && styles.selectedPickerItemIcon,
                    ]}
                    onPress={() => setSelectedIcon(icon.value)}
                  >
                    <Text style={styles.pickerLabel}>{icon.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Validation Error */}
            {validationError && (
              <Text style={styles.errorText}>{validationError}</Text>
            )}

            {/* Create Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Tạo ví</Text>
              )}
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
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#514345',
    marginBottom: 8,
    marginTop: 10,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#F1DEDF',
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    color: '#23191A',
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1DEDF',
    borderRadius: 100,
    padding: 4,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabActive: {
    backgroundColor: '#944652',
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
  balanceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#F1DEDF',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  balanceInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 22,
    color: '#23191A',
    fontWeight: '700',
  },
  currencyUnit: {
    fontSize: 18,
    fontWeight: '700',
    color: '#864E5A',
    marginLeft: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  pickerItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F1DEDF',
    backgroundColor: '#FFFFFF',
  },
  selectedPickerItem: {
    borderColor: '#23191A',
    borderWidth: 3,
  },
  selectedPickerItemIcon: {
    borderColor: '#944652',
    borderWidth: 3,
    backgroundColor: '#FDE9EA',
  },
  pickerLabel: {
    fontSize: 18,
  },
  errorText: {
    color: '#BA1A1A',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#944652',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#944652',
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
});
