import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { Wallet, fetchWallets } from '../services/dashboardService';
import WalletCreateSheet from '../components/WalletCreateSheet';
import WalletEditSheet from '../components/WalletEditSheet';
import { supabase } from '../services/supabaseClient';

interface WalletScreenProps {
  userId: string;
  onWalletSelected?: (wallet: Wallet) => void;
}

const COLORS = {
  primary: '#864E5A',
  background: '#FFF8F7',
  surface: '#FFF8F7',
  onSurface: '#23191A',
  onSurfaceVariant: '#514345',
  outline: '#837375',
  outlineVariant: '#D6C2C4',
  disabled: '#D6C2C4',
  disabledText: '#837375',
};

export default function WalletScreen({ userId, onWalletSelected }: WalletScreenProps) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [selectedWalletForEdit, setSelectedWalletForEdit] = useState<Wallet | null>(null);

  useEffect(() => {
    loadWallets();
  }, [userId]);

  const loadWallets = async () => {
    setLoading(true);
    try {
      const res = await fetchWallets(userId);
      if (res.success && res.data) {
        // Filter out soft deleted wallets (is_deleted === true)
        const activeWallets = res.data.filter((w: any) => !w.is_deleted);
        setWallets(activeWallets);

        // Fetch user roles for shared wallets
        const { data: memberRows } = await supabase
          .from('wallet_members')
          .select('wallet_id, role')
          .eq('user_id', userId);

        const rolesMap: Record<string, string> = {};
        if (memberRows) {
          memberRows.forEach((row: any) => {
            rolesMap[row.wallet_id] = row.role;
          });
        }
        setRoles(rolesMap);
      } else {
        Alert.alert('Lỗi', res.error || 'Không thể tải danh sách ví.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const walletCount = wallets.length;
  const isLimitReached = walletCount >= 5;

  if (loading) {
    return (
      <View style={styles.loadingContainer} testID="loading-indicator">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const GRADIENTS: Record<string, [string, string]> = {
    '#FFB7C5': ['#FFB7C5', '#944652'],
    '#FFD4A8': ['#FFD4A8', '#B25E2B'],
    '#FFFEC4': ['#FFFEC4', '#A58B24'],
    '#A8DFCE': ['#A8DFCE', '#2D7560'],
    '#B4CAFF': ['#B4CAFF', '#3252A2'],
    '#C8B7FF': ['#C8B7FF', '#4B369D'],
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Ví của tôi</Text>

        <View style={styles.deckContainer}>
          {wallets.map((wallet) => {
            const gradientColors: [string, string] = GRADIENTS[wallet.color] || ['#FFB7C5', '#944652'];

            return (
              <TouchableOpacity
                key={wallet.id}
                activeOpacity={0.9}
                style={styles.cardWrapper}
                onPress={() => onWalletSelected?.(wallet)}
              >
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                >
                  {/* Ornament */}
                  <View style={styles.cardOrnament} />

                  <View style={styles.cardHeader}>
                    <Text style={styles.walletName}>{wallet.name}</Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.balanceLabel}>Số dư</Text>
                      <Text style={styles.balanceValue}>
                        {wallet.balance.toLocaleString('vi-VN')} đ
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.settingsBtn}
                      onPress={() => setSelectedWalletForEdit(wallet)}
                      testID={`btn-settings-${wallet.id}`}
                    >
                      <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quota limit notice */}
        {isLimitReached && (
          <Text style={styles.warningText}>
            Bạn đã đạt giới hạn ví miễn phí (tối đa 5 ví). Nâng cấp Premium để tạo thêm
          </Text>
        )}

        {/* Create Wallet Button */}
        <TouchableOpacity
          testID="create-wallet-btn"
          activeOpacity={0.8}
          disabled={isLimitReached}
          accessibilityState={{ disabled: isLimitReached }}
          style={[styles.createBtn, isLimitReached && styles.disabledCreateBtn]}
          onPress={() => setShowCreateSheet(true)}
        >
          <Text style={[styles.createBtnText, isLimitReached && styles.disabledCreateBtnText]}>
            ➕ Tạo ví mới
          </Text>
        </TouchableOpacity>


      </ScrollView>

      {/* Sheets */}
      {showCreateSheet && (
        <WalletCreateSheet
          visible={showCreateSheet}
          userId={userId}
          onClose={() => setShowCreateSheet(false)}
          onSaveSuccess={() => {
            setShowCreateSheet(false);
            loadWallets();
          }}
        />
      )}

      {selectedWalletForEdit && (
        <WalletEditSheet
          visible={!!selectedWalletForEdit}
          wallet={selectedWalletForEdit}
          userId={userId}
          onClose={() => setSelectedWalletForEdit(null)}
          onSaveSuccess={() => {
            setSelectedWalletForEdit(null);
            loadWallets();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 20,
  },
  deckContainer: {
    marginBottom: 24,
  },
  cardWrapper: {
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: '#FFB7C5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGradient: {
    borderRadius: 20,
    padding: 20,
    height: 160,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardOrnament: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  badgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningText: {
    fontSize: 12,
    color: COLORS.disabledText,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  createBtn: {
    backgroundColor: '#944652',
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#944652',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledCreateBtn: {
    backgroundColor: COLORS.disabled,
    shadowColor: 'transparent',
    elevation: 0,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledCreateBtnText: {
    color: COLORS.disabledText,
  },
  joinBtn: {
    backgroundColor: '#FFF8F7',
    borderWidth: 1.5,
    borderColor: '#944652',
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#944652',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  joinBtnText: {
    color: '#944652',
    fontSize: 16,
    fontWeight: '700',
  },
});
