import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, KeyboardAvoidingView,
  Platform, ScrollView, Keyboard,
} from 'react-native';
import CapyMascot from '../components/CapyMascot';
import { joinWalletByCode } from '../services/walletInviteService';

interface WalletJoinScreenProps {
  visible: boolean;
  onClose: () => void;
  initialCode?: string | null;
  onJoinSuccess: (walletName: string) => void;
}

const COLORS = {
  primary: '#864E5A',
  primaryContainer: '#FFB7C5',
  surface: '#FFF8F7',
  surfaceContainer: '#FDE9EA',
  outline: '#837375',
  outlineVariant: '#D6C2C4',
  onSurface: '#23191A',
  onSurfaceVariant: '#514345',
  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
  success: '#2E7D32',
  successContainer: '#E8F5E9',
};

export default function WalletJoinScreen({ visible, onClose, initialCode, onJoinSuccess }: WalletJoinScreenProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [joinedWalletName, setJoinedWalletName] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (initialCode) {
        setCode(initialCode.toUpperCase());
        // Tự động trigger join nếu có deep link code
        handleJoin(initialCode.toUpperCase());
      } else {
        setCode('');
      }
      setError(null);
      setErrorCode(null);
      setJoinedWalletName(null);
    }
  }, [visible, initialCode]);

  const handleTextChange = (text: string) => {
    setError(null);
    setErrorCode(null);
    // Tự động viết hoa và giới hạn độ dài
    let formatted = text.toUpperCase();
    
    // Hỗ trợ tự động thêm tiền tố CAPY- nếu người dùng bắt đầu gõ số
    if (/^\d/.test(formatted) && !formatted.startsWith('CAPY-')) {
      formatted = `CAPY-${formatted}`;
    }
    
    setCode(formatted);
  };

  const handleJoin = async (targetCode?: string) => {
    const codeToUse = targetCode || code;
    
    // Validate format
    let normalized = codeToUse.trim();
    if (!normalized) {
      setError('Vui lòng nhập mã mời.');
      return;
    }

    // Nếu người dùng chỉ nhập số, tự động thêm CAPY-
    if (/^\d{6}$/.test(normalized)) {
      normalized = `CAPY-${normalized}`;
      setCode(normalized);
    }

    if (!/^CAPY-\d{6}$/.test(normalized)) {
      setError('Định dạng mã mời không hợp lệ. Ví dụ đúng: CAPY-123456');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const res = await joinWalletByCode(normalized);
      if (res.success && res.walletName) {
        setJoinedWalletName(res.walletName);
      } else {
        setErrorCode(res.errorCode || 'E-wallet-999');
        setError(res.error || 'Có lỗi xảy ra khi tham gia ví.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối.');
      setErrorCode('E-wallet-999');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    if (joinedWalletName) {
      onJoinSuccess(joinedWalletName);
    }
    onClose();
  };

  // Lựa chọn mascot dựa trên lỗi hoặc thành công
  const getMascotType = () => {
    if (joinedWalletName) return 'success';
    if (errorCode === 'E-wallet-003') return 'thinking'; // ví đầy -> buồn/suy nghĩ
    if (errorCode === 'E-wallet-005') return 'thinking'; // bị khóa
    return 'success'; // mặc định Capy vui vẻ
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Tham gia Ví chung</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={loading}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {joinedWalletName ? (
              /* Success State */
              <View style={styles.statusView}>
                <View style={styles.mascotWrapper}>
                  <CapyMascot type="success" style={styles.mascot} />
                </View>
                <Text style={styles.successTitle}>Tham gia thành công! 🎉</Text>
                <Text style={styles.successSubtitle}>
                  Bạn đã trở thành thành viên của ví chung{'\n'}
                  <Text style={styles.walletNameHighlight}>"{joinedWalletName}"</Text>
                </Text>
                <Text style={styles.privacyNote}>
                  🦦 Chỉ các giao dịch được tạo trong ví này mới được chia sẻ. Các ví cá nhân khác của bạn vẫn được bảo mật 100%.
                </Text>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSuccess]}
                  onPress={handleSuccessClose}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionButtonText, styles.actionButtonTextSuccess]}>Đến ví chung ngay</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Input/Pending State */
              <View style={styles.inputView}>
                <View style={styles.mascotWrapper}>
                  <CapyMascot type={getMascotType()} style={styles.mascot} />
                </View>
                
                <Text style={styles.introText}>
                  Nhập mã mời ví chung gồm 6 số bạn nhận được từ chủ ví để cùng quản lý chi tiêu.
                </Text>

                {/* Input block */}
                <TextInput
                  style={[
                    styles.input,
                    error ? styles.inputError : null,
                    errorCode === 'E-wallet-005' ? styles.inputDisabled : null
                  ]}
                  placeholder="CAPY-123456"
                  placeholderTextColor={COLORS.outline}
                  value={code}
                  onChangeText={handleTextChange}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={11}
                  editable={!loading && errorCode !== 'E-wallet-005'}
                />

                {/* Error Banner */}
                {error && (
                  <View style={styles.errorCard}>
                    <Text style={styles.errorCardText}>{error}</Text>
                  </View>
                )}

                {/* Submit button */}
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    loading && styles.actionButtonDisabled,
                    errorCode === 'E-wallet-005' && styles.actionButtonLocked
                  ]}
                  onPress={() => handleJoin()}
                  disabled={loading || errorCode === 'E-wallet-005'}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>
                      {errorCode === 'E-wallet-005' ? 'Tài khoản bị tạm khóa' : 'Tham gia ví'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(35, 25, 26, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 16,
    width: '100%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.outline,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  statusView: {
    alignItems: 'center',
    width: '100%',
  },
  inputView: {
    alignItems: 'center',
    width: '100%',
  },
  mascotWrapper: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mascot: {
    width: 90,
    height: 90,
  },
  introText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderRadius: 32,
    width: '100%',
    height: 60,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: '#FFF2F2',
  },
  inputDisabled: {
    backgroundColor: COLORS.outlineVariant,
    borderColor: COLORS.outline,
    color: COLORS.onSurfaceVariant,
  },
  errorCard: {
    backgroundColor: COLORS.errorContainer,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFB4AB',
  },
  errorCardText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.success,
    marginTop: 8,
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 15,
    color: COLORS.onSurface,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  walletNameHighlight: {
    fontWeight: '800',
    color: COLORS.primary,
    fontSize: 18,
  },
  privacyNote: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    marginBottom: 32,
    fontStyle: 'italic',
    backgroundColor: COLORS.surfaceContainer,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 100,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonLocked: {
    backgroundColor: COLORS.outline,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  actionButtonSuccess: {
    backgroundColor: COLORS.primaryContainer,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primaryContainer,
  },
  actionButtonTextSuccess: {
    color: COLORS.primary,
  },
});
