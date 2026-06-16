import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
  Animated,
} from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import {
  Wallet,
  deleteWallet,
  setDefaultWallet,
  updateWallet,
  adjustWalletBalance,
} from '../services/dashboardService';

// ─── Types ───────────────────────────────────────────────────────────────────
type SubScreen = 'name' | 'balance' | 'default' | 'delete' | null;

interface WalletEditSheetProps {
  visible: boolean;
  onClose: () => void;
  wallet: Wallet;
  userId: string;
  onSaveSuccess: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const C = {
  bg: '#FFF8F7',
  surface: '#FFFFFF',
  primary: '#864E5A',
  primaryDark: '#944652',
  onPrimary: '#FFFFFF',
  border: '#F1DEDF',
  borderMid: '#e8c8ca',
  textMain: '#23191A',
  textMid: '#514345',
  textMuted: '#837375',
  danger: '#BA1A1A',
  dangerBg: '#FFDAD6',
  dangerBorder: '#FFBAAC',
  noteYellow: '#FFF8E1',
  noteYellowBorder: '#F5A623',
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function WalletEditSheet({
  visible,
  onClose,
  wallet,
  userId,
  onSaveSuccess,
}: WalletEditSheetProps) {
  // — Sub-screen state
  const [activeSubScreen, setActiveSubScreen] = useState<SubScreen>(null);
  const subSlideX = useRef(new Animated.Value(400)).current;

  // — Global saving state
  const [saving, setSaving] = useState(false);

  // — Name sub-screen
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  // — Balance sub-screen
  const [balanceInput, setBalanceInput] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const isOwner = wallet.user_id === userId;

  // Reset all state when sheet opens
  useEffect(() => {
    if (visible) {
      setActiveSubScreen(null);
      setSaving(false);
      setNameInput(wallet.name);
      setNameError(null);
      setBalanceInput(wallet.balance.toString());
      setAdjustNote('');
      setBalanceError(null);
      subSlideX.setValue(400);
    }
  }, [visible, wallet]);

  // ─── Sub-screen navigation ─────────────────────────────────────────────
  const openSubScreen = (screen: SubScreen) => {
    setActiveSubScreen(screen);
    subSlideX.setValue(400);
    Animated.spring(subSlideX, {
      toValue: 0,
      tension: 120,
      friction: 20,
      useNativeDriver: true,
    }).start();
  };

  const closeSubScreen = () => {
    Animated.timing(subSlideX, {
      toValue: 400,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setActiveSubScreen(null));
  };

  // ─── Action handlers ───────────────────────────────────────────────────

  // Rename wallet
  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError('Tên ví không được để trống');
      return;
    }
    if (trimmed.length > 30) {
      setNameError(`Tên ví tối đa 30 ký tự (hiện tại: ${trimmed.length} ký tự)`);
      return;
    }
    if (trimmed === wallet.name) {
      closeSubScreen();
      return;
    }

    setSaving(true);
    const res = await updateWallet(wallet.id, { name: trimmed });
    setSaving(false);

    if (res.success) {
      onSaveSuccess();
      closeSubScreen();
    } else {
      setNameError(res.error || 'Không thể lưu, vui lòng thử lại');
    }
  };

  // Adjust wallet balance
  const handleAdjustBalance = async () => {
    const parsed = parseFloat(balanceInput.replace(/\./g, '').replace(',', '.'));

    if (isNaN(parsed) || balanceInput.trim() === '') {
      setBalanceError('Vui lòng nhập số dư hợp lệ');
      return;
    }
    if (parsed < 0) {
      setBalanceError('Số dư không thể là số âm');
      return;
    }
    if (parsed > 999_999_999_999) {
      setBalanceError('Số dư không được vượt quá 999 tỷ đồng');
      return;
    }

    const newBalance = Math.round(parsed);
    const currentBalance = wallet.balance;
    const delta = newBalance - currentBalance;

    if (delta === 0) {
      closeSubScreen();
      return;
    }

    const deltaLabel = delta > 0
      ? `+${Math.abs(delta).toLocaleString('vi-VN')} đ (thu nhập)`
      : `-${Math.abs(delta).toLocaleString('vi-VN')} đ (chi tiêu)`;

    Alert.alert(
      'Xác nhận điều chỉnh số dư',
      `Ví "${wallet.name}"\n\nSố dư hiện tại: ${currentBalance.toLocaleString('vi-VN')} đ\nSố dư mới: ${newBalance.toLocaleString('vi-VN')} đ\nChênh lệch: ${deltaLabel}\n\nMột giao dịch điều chỉnh sẽ được ghi lại tự động.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setSaving(true);
            const res = await adjustWalletBalance(
              wallet.id,
              currentBalance,
              newBalance,
              userId,
              adjustNote.trim() || undefined,
            );
            setSaving(false);

            if (res.success) {
              onSaveSuccess();
              closeSubScreen();
            } else {
              setBalanceError(res.error || 'Không thể lưu, vui lòng thử lại');
            }
          },
        },
      ],
    );
  };

  // Set default wallet
  const handleSetDefault = async () => {
    setSaving(true);
    const res = await setDefaultWallet(wallet.id, userId);
    setSaving(false);

    if (res.success) {
      Alert.alert('Thành công', `Đã đặt ví "${wallet.name}" làm mặc định.`);
      onSaveSuccess();
      onClose();
    } else {
      Alert.alert('Lỗi', res.error || 'Không thể đặt làm ví mặc định.');
    }
  };

  // Delete wallet
  const handleDelete = () => {
    Alert.alert(
      'Xác nhận xóa ví',
      `Cảnh báo: Bạn có chắc muốn xóa ví "${wallet.name}"?\n\nToàn bộ lịch sử giao dịch sẽ bị ẩn và không thể hiển thị lại trên ứng dụng.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            const res = await deleteWallet(wallet.id);
            setSaving(false);
            if (res.success) {
              Alert.alert('Thành công', 'Đã xóa ví thành công.');
              onSaveSuccess();
              onClose();
            } else {
              Alert.alert('Lỗi', res.error || 'Không thể xóa ví.');
            }
          },
        },
      ],
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        if (activeSubScreen) closeSubScreen();
        else onClose();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        {/* Backdrop */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={() => {
            if (activeSubScreen) closeSubScreen();
            else onClose();
          }}
        />

        {/* Sheet container */}
        <View style={styles.sheetContainer}>
          {/* Drag indicator */}
          <View style={styles.dragIndicator} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {wallet.name}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={16} color={C.primary} />
            </TouchableOpacity>
          </View>

          {/* ── MAIN ACTION LIST ───────────────────────────────────────── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Rename */}
            {isOwner && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => openSubScreen('name')}
                testID="action-rename"
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#FFE4E8' }]}>
                  <Ionicons name="pencil-outline" size={20} color="#C44C60" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionName}>Đổi tên ví</Text>
                  <Text style={styles.actionDesc} numberOfLines={1}>
                    Tên hiện tại: {wallet.name}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
              </TouchableOpacity>
            )}

            {/* Adjust balance */}
            {isOwner && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => openSubScreen('balance')}
                testID="action-adjust-balance"
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#E8F0FF' }]}>
                  <Ionicons name="cash-outline" size={20} color="#3252A2" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionName}>Chỉnh sửa số dư</Text>
                  <Text style={styles.actionDesc}>
                    Số dư: {wallet.balance.toLocaleString('vi-VN')} đ
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
              </TouchableOpacity>
            )}

            {/* Set default */}
            {!wallet.is_default && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => openSubScreen('default')}
                testID="action-set-default"
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#FFF8E1' }]}>
                  <Ionicons name="star-outline" size={20} color="#B8860B" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionName}>Đặt làm mặc định</Text>
                  <Text style={styles.actionDesc}>Dùng ví này khi ghi giao dịch mới</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
              </TouchableOpacity>
            )}

            {/* Default badge */}
            {wallet.is_default && (
              <View style={[styles.actionItem, { opacity: 0.6 }]}>
                <View style={[styles.actionIcon, { backgroundColor: '#FFF8E1' }]}>
                  <Ionicons name="star" size={20} color="#B8860B" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionName}>Ví mặc định</Text>
                  <Text style={styles.actionDesc}>Ví này đang được đặt làm mặc định</Text>
                </View>
              </View>
            )}

            {/* Delete */}
            {isOwner && (
              <TouchableOpacity
                style={[styles.actionItem, styles.actionItemDanger]}
                onPress={() => openSubScreen('delete')}
                testID="action-delete"
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: C.dangerBg }]}>
                  <Ionicons name="trash-outline" size={20} color={C.danger} />
                </View>
                <View style={styles.actionText}>
                  <Text style={[styles.actionName, { color: C.danger }]}>Xóa ví</Text>
                  <Text style={styles.actionDesc}>Ẩn toàn bộ lịch sử của ví này</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.dangerBorder} />
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* ── SUB-SCREENS (absolute, slide in from right) ─────────────── */}
          {activeSubScreen !== null && (
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                styles.subScreenWrapper,
                { transform: [{ translateX: subSlideX }] },
              ]}
            >
              {/* ── SUB: Rename ── */}
              {activeSubScreen === 'name' && (
                <SubScreenRename
                  walletName={wallet.name}
                  nameInput={nameInput}
                  nameError={nameError}
                  saving={saving}
                  onBack={closeSubScreen}
                  onChangeText={(v) => { setNameInput(v); setNameError(null); }}
                  onSave={handleSaveName}
                />
              )}

              {/* ── SUB: Balance ── */}
              {activeSubScreen === 'balance' && (
                <SubScreenBalance
                  walletName={wallet.name}
                  currentBalance={wallet.balance}
                  balanceInput={balanceInput}
                  adjustNote={adjustNote}
                  balanceError={balanceError}
                  saving={saving}
                  onBack={closeSubScreen}
                  onChangeBalance={(v) => { setBalanceInput(v); setBalanceError(null); }}
                  onChangeNote={setAdjustNote}
                  onSave={handleAdjustBalance}
                />
              )}

              {/* ── SUB: Set Default ── */}
              {activeSubScreen === 'default' && (
                <SubScreenDefault
                  walletName={wallet.name}
                  saving={saving}
                  onBack={closeSubScreen}
                  onConfirm={handleSetDefault}
                />
              )}

              {/* ── SUB: Delete ── */}
              {activeSubScreen === 'delete' && (
                <SubScreenDelete
                  walletName={wallet.name}
                  saving={saving}
                  onBack={closeSubScreen}
                  onConfirm={handleDelete}
                />
              )}
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Sub-screen: Rename ───────────────────────────────────────────────────────
function SubScreenRename({
  walletName,
  nameInput,
  nameError,
  saving,
  onBack,
  onChangeText,
  onSave,
}: {
  walletName: string;
  nameInput: string;
  nameError: string | null;
  saving: boolean;
  onBack: () => void;
  onChangeText: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <View style={styles.subScreen}>
      <SubScreenHeader title="Đổi tên ví" onBack={onBack} />
      <ScrollView
        contentContainerStyle={styles.subScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.fieldLabel}>Tên ví</Text>
        <View style={[styles.inputBox, nameError ? styles.inputBoxError : null]}>
          <TextInput
            style={styles.textInput}
            value={nameInput}
            onChangeText={onChangeText}
            maxLength={30}
            placeholder="Nhập tên ví"
            placeholderTextColor={C.textMuted}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={onSave}
          />
        </View>
        <View style={styles.inputMeta}>
          {nameError ? (
            <Text style={styles.errorText}>{nameError}</Text>
          ) : (
            <Text style={styles.hintText}>Tối đa 30 ký tự</Text>
          )}
          <Text style={styles.charCount}>{nameInput.length}/30</Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, saving && styles.disabledBtn]}
          onPress={onSave}
          disabled={saving}
          testID="btn-save-name"
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.primaryBtnText}>Lưu tên ví</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Sub-screen: Balance ──────────────────────────────────────────────────────
function SubScreenBalance({
  walletName,
  currentBalance,
  balanceInput,
  adjustNote,
  balanceError,
  saving,
  onBack,
  onChangeBalance,
  onChangeNote,
  onSave,
}: {
  walletName: string;
  currentBalance: number;
  balanceInput: string;
  adjustNote: string;
  balanceError: string | null;
  saving: boolean;
  onBack: () => void;
  onChangeBalance: (v: string) => void;
  onChangeNote: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <View style={styles.subScreen}>
      <SubScreenHeader title="Chỉnh sửa số dư" onBack={onBack} />
      <ScrollView
        contentContainerStyle={styles.subScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Note box */}
        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={15} color="#8a6200" style={{ marginTop: 1 }} />
          <Text style={styles.noteText}>
            Một giao dịch điều chỉnh sẽ được tạo tự động để lưu lại thay đổi này.
          </Text>
        </View>

        {/* Current balance display */}
        <View style={styles.currentBalanceRow}>
          <Text style={styles.currentBalLabel}>Số dư hiện tại</Text>
          <Text style={styles.currentBalValue}>
            {currentBalance.toLocaleString('vi-VN')} đ
          </Text>
        </View>

        {/* New balance input */}
        <Text style={styles.fieldLabel}>Số dư mới (đ)</Text>
        <View style={[styles.inputBox, balanceError ? styles.inputBoxError : null]}>
          <TextInput
            style={styles.textInput}
            value={balanceInput}
            onChangeText={onChangeBalance}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={C.textMuted}
            autoFocus
            returnKeyType="done"
          />
        </View>
        {balanceError ? (
          <Text style={[styles.errorText, { marginBottom: 12 }]}>{balanceError}</Text>
        ) : (
          <Text style={[styles.hintText, { marginBottom: 12 }]}>
            Nhập số tiền thực tế trong ví
          </Text>
        )}

        {/* Note input */}
        <Text style={styles.fieldLabel}>Lý do điều chỉnh (tuỳ chọn)</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={[styles.textInput, { minHeight: 56 }]}
            value={adjustNote}
            onChangeText={onChangeNote}
            placeholder="Ví dụ: Tiền mặt chưa ghi, tiền lẻ..."
            placeholderTextColor={C.textMuted}
            multiline
            maxLength={100}
            returnKeyType="done"
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, saving && styles.disabledBtn, { marginTop: 20 }]}
          onPress={onSave}
          disabled={saving}
          testID="btn-adjust-balance"
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.primaryBtnText}>Điều chỉnh số dư</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Sub-screen: Set Default ──────────────────────────────────────────────────
function SubScreenDefault({
  walletName,
  saving,
  onBack,
  onConfirm,
}: {
  walletName: string;
  saving: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <View style={styles.subScreen}>
      <SubScreenHeader title="Đặt làm mặc định" onBack={onBack} />
      <View style={styles.subScrollContent}>
        <View style={[styles.actionIcon, { backgroundColor: '#FFF8E1', width: 56, height: 56, borderRadius: 16, marginBottom: 16 }]}>
          <Ionicons name="star" size={28} color="#B8860B" />
        </View>
        <Text style={styles.confirmTitle}>Đặt ví "{walletName}" làm mặc định?</Text>
        <Text style={styles.confirmDesc}>
          Ví mặc định sẽ được tự động chọn khi bạn ghi giao dịch mới hoặc mở dashboard.
        </Text>

        <TouchableOpacity
          style={[styles.primaryBtn, saving && styles.disabledBtn, { marginTop: 24 }]}
          onPress={onConfirm}
          disabled={saving}
          testID="btn-confirm-default"
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.primaryBtnText}>⭐ Xác nhận đặt mặc định</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onBack}>
          <Text style={styles.cancelBtnText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Sub-screen: Delete ───────────────────────────────────────────────────────
function SubScreenDelete({
  walletName,
  saving,
  onBack,
  onConfirm,
}: {
  walletName: string;
  saving: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <View style={styles.subScreen}>
      <SubScreenHeader title="Xóa ví" onBack={onBack} danger />
      <View style={styles.subScrollContent}>
        <View style={[styles.actionIcon, { backgroundColor: C.dangerBg, width: 56, height: 56, borderRadius: 16, marginBottom: 16 }]}>
          <Ionicons name="trash" size={28} color={C.danger} />
        </View>
        <Text style={[styles.confirmTitle, { color: C.danger }]}>Xóa ví "{walletName}"?</Text>
        <Text style={styles.confirmDesc}>
          Toàn bộ lịch sử giao dịch của ví này sẽ bị ẩn và{' '}
          <Text style={{ fontWeight: '700' }}>không thể hiển thị lại</Text> trên ứng dụng.
        </Text>

        <TouchableOpacity
          style={[styles.dangerBtn, saving && styles.disabledBtn, { marginTop: 24 }]}
          onPress={onConfirm}
          disabled={saving}
          testID="btn-confirm-delete"
        >
          {saving
            ? <ActivityIndicator size="small" color={C.danger} />
            : <Text style={styles.dangerBtnText}>🗑️ Xóa ví vĩnh viễn</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onBack}>
          <Text style={styles.cancelBtnText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Shared: Sub-screen header ────────────────────────────────────────────────
function SubScreenHeader({
  title,
  onBack,
  danger,
}: {
  title: string;
  onBack: () => void;
  danger?: boolean;
}) {
  return (
    <View style={styles.subHeader}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} testID="btn-back-subscreen">
        <Ionicons name="arrow-back" size={18} color={danger ? C.danger : C.primary} />
        <Text style={[styles.backBtnText, danger && { color: C.danger }]}>Quay lại</Text>
      </TouchableOpacity>
      <Text style={[styles.subHeaderTitle, danger && { color: C.danger }]}>{title}</Text>
    </View>
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
    backgroundColor: C.bg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    maxHeight: '88%',
    shadowColor: '#864E5A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
    overflow: 'hidden',
  },
  dragIndicator: {
    width: 44,
    height: 5,
    backgroundColor: C.border,
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
    borderColor: C.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textMain,
    flex: 1,
    marginRight: 12,
  },
  closeBtn: {
    width: 30,
    height: 30,
    backgroundColor: C.border,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Action list ──
  listContent: {
    padding: 16,
    paddingBottom: 48,
    gap: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 16,
    padding: 14,
  },
  actionItemDanger: {
    borderColor: C.dangerBorder,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionText: {
    flex: 1,
  },
  actionName: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textMain,
  },
  actionDesc: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },

  // ── Sub-screen wrapper ──
  subScreenWrapper: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  subScreen: {
    flex: 1,
  },
  subHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.primary,
  },
  subHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.textMain,
  },
  subScrollContent: {
    padding: 20,
    paddingBottom: 48,
  },

  // ── Input ──
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputBox: {
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inputBoxError: {
    borderColor: C.danger,
  },
  textInput: {
    fontSize: 16,
    color: C.textMain,
    fontWeight: '500',
    padding: 0,
  },
  inputMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: C.danger,
    fontWeight: '600',
    flex: 1,
  },
  hintText: {
    fontSize: 12,
    color: C.textMuted,
    flex: 1,
  },
  charCount: {
    fontSize: 12,
    color: C.textMuted,
  },

  // ── Note box ──
  noteBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFBEA',
    borderLeftWidth: 3,
    borderLeftColor: C.noteYellowBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#8a6200',
    lineHeight: 18,
  },

  // ── Balance display ──
  currentBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  currentBalLabel: {
    fontSize: 13,
    color: C.textMuted,
    fontWeight: '500',
  },
  currentBalValue: {
    fontSize: 16,
    color: C.textMain,
    fontWeight: '700',
  },

  // ── Confirm screens ──
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textMain,
    marginBottom: 10,
  },
  confirmDesc: {
    fontSize: 14,
    color: C.textMid,
    lineHeight: 22,
  },

  // ── Buttons ──
  primaryBtn: {
    backgroundColor: C.primaryDark,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: C.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: C.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  dangerBtn: {
    backgroundColor: C.dangerBg,
    borderWidth: 1.5,
    borderColor: C.dangerBorder,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: C.danger,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    color: C.textMuted,
    fontWeight: '600',
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
