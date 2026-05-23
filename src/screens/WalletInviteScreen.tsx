import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ActivityIndicator, Share, Clipboard, Modal,
  Dimensions,
} from 'react-native';
import CapyMascot from '../components/CapyMascot';
import { generateInviteCode } from '../services/walletInviteService';

const { width } = Dimensions.get('window');

interface WalletInviteScreenProps {
  visible: boolean;
  onClose: () => void;
  walletId: string;
  walletName: string;
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
  success: '#2E7D32',
};

export default function WalletInviteScreen({ visible, onClose, walletId, walletName }: WalletInviteScreenProps) {
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible && walletId) {
      handleGenerateCode();
    } else {
      setCode(null);
      setExpiresAt(null);
      setError(null);
      setCopied(false);
    }
  }, [visible, walletId]);

  const handleGenerateCode = async () => {
    try {
      setLoading(true);
      setError(null);
      setCopied(false);
      const res = await generateInviteCode(walletId);
      if (res.success && res.code) {
        setCode(res.code);
        setExpiresAt(res.expiresAt || null);
      } else {
        setError(res.error || 'Không thể tạo mã mời.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!code) return;
    Clipboard.setString(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!code) return;
    try {
      const shareUrl = `capymoney://invite?code=${code}`;
      await Share.share({
        message: `🦦 Tham gia ví chung "${walletName}" của mình trên Capy's Money nhé! Nhập mã mời: ${code} hoặc bấm vào link: ${shareUrl}`,
        url: shareUrl,
        title: `Mời tham gia ví chung "${walletName}"`,
      });
    } catch (err) {
      console.error('Lỗi khi chia sẻ:', err);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Mời thành viên</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.mascotWrapper}>
              <CapyMascot type="success" style={styles.mascot} />
            </View>

            <Text style={styles.instructionText}>
              Chia sẻ mã này với người bạn muốn mời tham gia ví chung "{walletName}"
            </Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Đang tạo mã mời...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleGenerateCode}>
                  <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : (
              code && (
                <>
                  {/* Code Card */}
                  <View style={styles.codeCard}>
                    <Text style={styles.codeText}>{code}</Text>
                    <TouchableOpacity
                      style={[styles.copyIconBtn, copied && styles.copyIconBtnSuccess]}
                      onPress={handleCopy}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.copyIconBtnText}>
                        {copied ? 'Đã chép!' : 'Sao chép'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.expiryNote}>
                    ⚠️ Mã mời sẽ hết hạn sau 24 giờ.
                  </Text>

                  {/* Actions */}
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShare}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.shareButtonText}>Chia sẻ liên kết</Text>
                  </TouchableOpacity>
                </>
              )
            )}
          </View>
        </View>
      </View>
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
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    width: '100%',
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
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
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
  instructionText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontStyle: 'italic',
  },
  errorContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: COLORS.primaryContainer,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  retryButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: '100%',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  codeText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  copyIconBtn: {
    backgroundColor: COLORS.primaryContainer,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  copyIconBtnSuccess: {
    backgroundColor: '#E8F5E9',
    borderColor: COLORS.success,
  },
  copyIconBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  expiryNote: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontStyle: 'italic',
    fontWeight: '500',
    marginBottom: 24,
  },
  shareButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 100,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
