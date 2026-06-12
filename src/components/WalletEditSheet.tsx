import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Wallet, Jar, fetchJars, updateJarAllocations, deleteWallet, setDefaultWallet } from '../services/dashboardService';

interface WalletEditSheetProps {
  visible: boolean;
  onClose: () => void;
  wallet: Wallet;
  userId: string;
  onSaveSuccess: () => void;
}

const JAR_NAMES: Record<string, string> = {
  NEC: 'Thiết yếu (NEC)',
  LTSS: 'Tiết kiệm (LTSS)',
  EDU: 'Giáo dục (EDU)',
  PLAY: 'Hưởng thụ (PLAY)',
  FFA: 'Đầu tư (FFA)',
  GIVE: 'Từ thiện (GIVE)',
};

export default function WalletEditSheet({
  visible,
  onClose,
  wallet,
  userId,
  onSaveSuccess,
}: WalletEditSheetProps) {
  const [jars, setJars] = useState<Jar[]>([]);
  const [loadingJars, setLoadingJars] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Allocations state
  const [allocations, setAllocations] = useState<Record<string, number>>({
    NEC: 55,
    LTSS: 10,
    EDU: 10,
    PLAY: 10,
    FFA: 10,
    GIVE: 5,
  });

  useEffect(() => {
    if (visible && wallet?.id) {
      loadJars();
      setValidationError(null);
    }
  }, [visible, wallet]);

  const loadJars = async () => {
    setLoadingJars(true);
    const res = await fetchJars(wallet.user_id);
    setLoadingJars(false);
    if (res.success && res.data && res.data.length > 0) {
      setJars(res.data);
      const newAlloc: Record<string, number> = {};
      res.data.forEach((jar) => {
        newAlloc[jar.type] = jar.allocation_percentage;
      });
      setAllocations(newAlloc);
    }
  };



  const totalPercentage = Object.values(allocations).reduce((sum, val) => sum + val, 0);

  const handleAdjust = (type: string, delta: number) => {
    const current = allocations[type] || 0;
    const nextValue = Math.max(0, Math.min(100, current + delta));
    setAllocations({
      ...allocations,
      [type]: nextValue,
    });
    setValidationError(null);
  };

  const handleResetDefault = () => {
    setAllocations({
      NEC: 55,
      LTSS: 10,
      EDU: 10,
      PLAY: 10,
      FFA: 10,
      GIVE: 5,
    });
    setValidationError(null);
  };

  const handleSaveAllocations = async () => {
    if (totalPercentage !== 100) {
      setValidationError(`Tổng tỷ lệ phân bổ của các hũ phải bằng 100% (hiện tại: ${totalPercentage}%).`);
      return;
    }

    setSaving(true);
    const apiAllocations = Object.keys(allocations).map((type) => ({
      type,
      percentage: allocations[type],
    }));

    const res = await updateJarAllocations(wallet.user_id, apiAllocations);
    setSaving(false);

    if (res.success) {
      onSaveSuccess();
      onClose();
    } else {
      setValidationError(res.error || 'Có lỗi xảy ra khi cập nhật tỷ lệ hũ.');
    }
  };

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

  const handleDelete = () => {
    Alert.alert(
      'Xác nhận xóa ví',
      `Cảnh báo: Bạn có chắc chắn muốn xóa ví '${wallet.name}' không? Hành động này sẽ ẩn toàn bộ lịch sử chi tiêu của ví này và không thể hiển thị lại trên ứng dụng.`,
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
      ]
    );
  };

  const isOwner = wallet.user_id === userId;

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
            <Text style={styles.headerTitle}>Cài đặt: {wallet.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Quick Actions Footer */}
            <View style={styles.footerActions}>
              {!wallet.is_default && (
                <TouchableOpacity
                  style={styles.defaultActionBtn}
                  onPress={handleSetDefault}
                >
                  <Text style={styles.defaultActionText}>⭐ Đặt làm mặc định</Text>
                </TouchableOpacity>
              )}

              {isOwner && (
                <TouchableOpacity
                  style={styles.deleteActionBtn}
                  onPress={handleDelete}
                >
                  <Text style={styles.deleteActionText}>🗑️ Xóa ví</Text>
                </TouchableOpacity>
              )}
            </View>
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
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#864E5A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  // Shared Members List
  membersSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#F1DEDF',
    marginBottom: 20,
  },
  membersList: {
    marginBottom: 10,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE9EA',
  },
  memberName: {
    fontSize: 14,
    color: '#23191A',
    fontWeight: '600',
    flex: 2,
  },
  memberRole: {
    fontSize: 12,
    color: '#837375',
    flex: 1,
    textAlign: 'right',
    marginRight: 8,
  },
  removeMemberBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#FFDAD6',
    borderRadius: 100,
  },
  removeMemberText: {
    fontSize: 11,
    color: '#BA1A1A',
    fontWeight: '700',
  },
  inviteButton: {
    backgroundColor: '#FFF8F7',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#944652',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  inviteButtonText: {
    fontSize: 13,
    color: '#944652',
    fontWeight: '700',
  },
  // Allocations Section
  allocHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  totalPctText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#864E5A',
  },
  jarRow: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#F1DEDF',
  },
  jarRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  jarName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#23191A',
  },
  jarPct: {
    fontSize: 13,
    fontWeight: '700',
    color: '#864E5A',
  },
  sliderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adjustBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#F1DEDF',
    borderRadius: 8,
  },
  adjustBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#864E5A',
  },
  visualTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#FDE9EA',
    borderRadius: 3,
    marginHorizontal: 12,
    position: 'relative',
  },
  visualFill: {
    height: '100%',
    backgroundColor: '#944652',
    borderRadius: 3,
  },
  visualThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#944652',
    position: 'absolute',
    top: -3,
    marginLeft: -6,
  },
  errorText: {
    color: '#BA1A1A',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#864E5A',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#864E5A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#D6C2C4',
    shadowColor: 'transparent',
    elevation: 0,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resetButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 6,
  },
  resetButtonText: {
    fontSize: 13,
    color: '#837375',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1.5,
    borderTopColor: '#FDE9EA',
    paddingTop: 16,
    marginTop: 12,
  },
  defaultActionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFF8F7',
    borderWidth: 1.5,
    borderColor: '#864E5A',
    borderRadius: 100,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  defaultActionText: {
    color: '#864E5A',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteActionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFDAD6',
    borderWidth: 1.5,
    borderColor: '#FFBAAC',
    borderRadius: 100,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  deleteActionText: {
    color: '#BA1A1A',
    fontSize: 13,
    fontWeight: '700',
  },
});
