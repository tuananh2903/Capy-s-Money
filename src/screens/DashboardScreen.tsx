import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import CapyMascot from '../components/CapyMascot';
import QuickAddBottomSheet from '../components/QuickAddBottomSheet';
import { fetchWallets, fetchJars, Wallet, Jar } from '../services/dashboardService';
import { evaluateJarBudget, BudgetAlertStatus } from '../utils/budgetChecker';

const { width } = Dimensions.get('window');

interface DashboardScreenProps {
  userId: string;
  onSignOut: () => void;
}

const goatQuotes: Record<string, string> = {
  save_big: 'Capy tin bạn sẽ sớm tậu nhà tậu xe, đạt tự do tài chính thôi! Fighting! 🏠✨',
  reduce_spend: 'Tiêu tiền ít thôi kẻo cuối tháng lại phải ăn mì gói nha bạn thân ơi! 🦦🍜',
  self_invest: 'Đầu tư cho trí tuệ là khoản đầu tư lãi nhất đời! Học tập chăm chỉ nhé! 📚💡',
  exit_broke_loop: 'Cố lên! Cùng chia hũ thông minh để thoát kiếp viêm màng túi vĩnh viễn nha! 🦦💸',
};

const defaultQuote = 'Hãy quản lý tài chính thật chill cùng Capy mỗi ngày nhé! 🥰🦦';

const JAR_NAMES: Record<string, { name: string; color: string }> = {
  NEC: { name: 'Thiết yếu', color: '#FF8C8C' },
  LTSS: { name: 'Tiết kiệm', color: '#A8E6CF' },
  FFA: { name: 'Tự do TC', color: '#FFD3B6' },
  EDU: { name: 'Giáo dục', color: '#D4E2FC' },
  PLAY: { name: 'Hưởng thụ', color: '#FCE1FC' },
  GIVE: { name: 'Cho đi', color: '#EAE1FC' },
};

export default function DashboardScreen({ userId, onSignOut }: DashboardScreenProps) {
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [jars, setJars] = useState<Jar[]>([]);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quote, setQuote] = useState(defaultQuote);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (targetWalletId?: string) => {
    try {
      setLoading(true);
      const walletsRes = await fetchWallets(userId);
      if (walletsRes.success && walletsRes.data && walletsRes.data.length > 0) {
        setWallets(walletsRes.data);
        
        let activeWallet = walletsRes.data[0];
        if (targetWalletId) {
          activeWallet = walletsRes.data.find(w => w.id === targetWalletId) || activeWallet;
        } else {
          const defaultWallet = walletsRes.data.find(w => w.is_default);
          if (defaultWallet) activeWallet = defaultWallet;
        }
        
        setSelectedWallet(activeWallet);
        
        const jarsRes = await fetchJars(activeWallet.id);
        if (jarsRes.success && jarsRes.data) {
          setJars(jarsRes.data);
        }
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWallet = async (wallet: Wallet) => {
    setShowWalletModal(false);
    setLoading(true);
    setSelectedWallet(wallet);
    const jarsRes = await fetchJars(wallet.id);
    if (jarsRes.success && jarsRes.data) {
      setJars(jarsRes.data);
    }
    setLoading(false);
  };

  const handleQuickAddSuccess = () => {
    if (selectedWallet) {
      loadDashboardData(selectedWallet.id);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C8C" />
        <Text style={styles.loadingText}>Đang chuẩn bị Dashboard cực chill cho bạn...</Text>
      </View>
    );
  }

  // Calculate alert statuses and select caption
  let hasOverBudget = false;
  let hasSpendingTooFast = false;

  const jarsWithAlerts = jars.map(jar => {
    const balance = selectedWallet?.balance ?? 0;
    const limit = balance * (jar.allocation_percentage / 100);
    const alertStatus = evaluateJarBudget({
      type: jar.type,
      spentAmount: jar.spent_amount,
      budgetLimit: limit,
    });

    if (alertStatus === BudgetAlertStatus.OVER_BUDGET) {
      hasOverBudget = true;
    } else if (alertStatus === BudgetAlertStatus.SPENDING_TOO_FAST) {
      hasSpendingTooFast = true;
    }

    return {
      ...jar,
      limit,
      alertStatus,
    };
  });

  const getMascotSpeech = () => {
    if (hasOverBudget) {
      return 'Ối bạn ơi! Có hũ bị vượt ngân sách kìa, hãy kiểm soát chi tiêu lại nha! 🦦';
    }
    if (hasSpendingTooFast) {
      return 'Cần thận nha, bạn đang tiêu hơi bị nhanh cho một số hũ đấy! 🦦';
    }
    return quote;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Capy's Money 🦦</Text>
          <Text style={styles.headerSubtitle}>Tài chính thảnh thơi, sống đời thong thả</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8} style={styles.signOutButton} onPress={onSignOut}>
          <Text style={styles.signOutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Capy Motivation Banner */}
        <View style={styles.quoteCard}>
          <CapyMascot type={hasOverBudget ? 'thinking' : 'success'} style={styles.mascotStyle} />
          <View style={styles.quoteTextContainer}>
            <Text style={styles.quoteBubble}>“ {getMascotSpeech()} ”</Text>
          </View>
        </View>

        {/* Balance & Wallet Selector Card */}
        {selectedWallet && (
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Ví hiện tại</Text>
              <TouchableOpacity
                style={styles.walletSwitcher}
                onPress={() => setShowWalletModal(true)}
              >
                <Text style={styles.walletSwitcherText}>{selectedWallet.name}</Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceAmount}>
              {selectedWallet.balance.toLocaleString('en-US')} VND
            </Text>
          </View>
        )}

        {/* Floating/Bottom Action Bar */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.floatingAddButton}
          onPress={() => setShowQuickAdd(true)}
        >
          <Text style={styles.floatingAddButtonText}>+ Giao dịch</Text>
        </TouchableOpacity>

        {/* 6 Jars splits breakdown */}
        <Text style={styles.sectionTitle}>💰 Phân phối 6 Hũ Tài Chính</Text>
        <View style={styles.jarsContainer}>
          {jarsWithAlerts.length === 0 ? (
            <Text style={styles.emptyJarsText}>Chưa cấu hình hũ tài chính cho ví này.</Text>
          ) : (
            jarsWithAlerts.map((jar, idx) => {
              const metadata = JAR_NAMES[jar.type] || { name: jar.type, color: '#B3B3B3' };
              const percent = jar.allocation_percentage;
              const limit = jar.limit;
              
              // Progress ratio
              const ratio = limit > 0 ? jar.spent_amount / limit : 0;
              const progressWidth = Math.min(100, Math.round(ratio * 100));

              // Colors & labels by budget checker
              let barColor = metadata.color;
              let alertText = '';
              let alertTextColor = '#8A7A7B';

              if (jar.alertStatus === BudgetAlertStatus.OVER_BUDGET) {
                barColor = '#E84545';
                alertText = 'Đã vượt hạn mức!';
                alertTextColor = '#E84545';
              } else if (jar.alertStatus === BudgetAlertStatus.SPENDING_TOO_FAST) {
                barColor = '#D81B60'; // Dark pink
                alertText = 'Tiêu quá nhanh!';
                alertTextColor = '#D81B60';
              }

              return (
                <View key={idx} style={styles.jarRow}>
                  <View style={styles.jarHeaderRow}>
                    <View style={styles.jarNameContainer}>
                      <View style={[styles.jarColorDot, { backgroundColor: barColor }]} />
                      <Text style={styles.jarNameText}>
                        {metadata.name} ({percent}%)
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.jarAmountText}>
                        {jar.spent_amount.toLocaleString('en-US')} / {Math.round(limit).toLocaleString('en-US')} đ
                      </Text>
                      {alertText !== '' && (
                        <Text style={[styles.alertBadgeText, { color: alertTextColor }]}>
                          {alertText}
                        </Text>
                      )}
                    </View>
                  </View>
                  {/* Progress bar visualizer */}
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${progressWidth}%`, backgroundColor: barColor },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Wallet Switcher Modal */}
      <Modal
        visible={showWalletModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWalletModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setShowWalletModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn ví tài chính</Text>
            {wallets.map((w) => (
              <TouchableOpacity
                key={w.id}
                style={[
                  styles.walletOption,
                  selectedWallet?.id === w.id && styles.walletOptionActive,
                ]}
                onPress={() => handleSelectWallet(w)}
              >
                <Text
                  style={[
                    styles.walletOptionText,
                    selectedWallet?.id === w.id && styles.walletOptionTextActive,
                  ]}
                >
                  {w.name}
                </Text>
                <Text style={styles.walletOptionBalance}>
                  {w.balance.toLocaleString('en-US')} đ
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Quick Add Bottom Sheet */}
      {selectedWallet && (
        <QuickAddBottomSheet
          visible={showQuickAdd}
          onClose={() => setShowQuickAdd(false)}
          walletId={selectedWallet.id}
          userId={userId}
          onSaveSuccess={handleQuickAddSuccess}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F7',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFF8F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#8A7A7B',
    fontStyle: 'italic',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE5E2',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A3E3F',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#8A7A7B',
    marginTop: 2,
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#FFE5E2',
  },
  signOutText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF8C8C',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Make room for floating button
  },
  quoteCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE5E2',
    shadowColor: '#4A3E3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  mascotStyle: {
    width: 80,
    height: 80,
  },
  quoteTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  quoteBubble: {
    fontSize: 13,
    color: '#4A3E3F',
    fontWeight: '600',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  balanceCard: {
    backgroundColor: '#20E3B2',
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    shadowColor: '#20E3B2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  walletSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  walletSwitcherText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 6,
  },
  dropdownArrow: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
  },
  floatingAddButton: {
    backgroundColor: '#FF8C8C',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: 16,
    shadowColor: '#FF8C8C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingAddButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A3E3F',
    marginTop: 12,
    marginBottom: 16,
  },
  jarsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFE5E2',
    gap: 16,
  },
  emptyJarsText: {
    fontSize: 14,
    color: '#8A7A7B',
    textAlign: 'center',
    paddingVertical: 20,
  },
  jarRow: {
    width: '100%',
  },
  jarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  jarNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jarColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  jarNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A3E3F',
  },
  jarAmountText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4A3E3F',
  },
  alertBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#FFF5F4',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(74, 62, 63, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: '#FFF8F7',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#FFE5E2',
    shadowColor: '#4A3E3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3E3F',
    marginBottom: 16,
    textAlign: 'center',
  },
  walletOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFE5E2',
  },
  walletOptionActive: {
    borderColor: '#FF8C8C',
    backgroundColor: '#FFF4F3',
  },
  walletOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A3E3F',
  },
  walletOptionTextActive: {
    color: '#FF8C8C',
  },
  walletOptionBalance: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A7A7B',
  },
});
