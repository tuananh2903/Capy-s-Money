import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  SafeAreaView, ActivityIndicator, Dimensions, Alert, Image,
  Platform, StatusBar, Modal, TextInput
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchProfile, updateProfileName } from "../services/profileService";
import { supabase } from "../services/supabaseClient";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import CapyMascot from "../components/CapyMascot";
import QuickAddBottomSheet from "../components/QuickAddBottomSheet";
import { fetchWallets, fetchJars, fetchWalletIncome, fetchWalletExpense, ensureJarsExist, Wallet, Jar } from "../services/dashboardService";
import { evaluateJarBudget, BudgetAlertStatus } from "../utils/budgetChecker";
import BudgetScreen from "./BudgetScreen";
import WalletScreen from "./WalletScreen";
import { LedgerScreen } from "./LedgerScreen";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#864E5A",
  onPrimary: "#FFFFFF",
  primaryContainer: "#FFB7C5",
  onPrimaryContainer: "#7B4551",
  secondary: "#944652",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#FE9DA9",
  onSecondaryContainer: "#79313D",
  tertiary: "#71585C",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#E3C2C7",
  onTertiaryContainer: "#674F53",
  background: "#FFF8F7",
  surface: "#FFF8F7",
  surfaceContainer: "#FDE9EA",
  surfaceContainerHigh: "#F7E4E5",
  surfaceContainerLowest: "#FFFFFF",
  onSurface: "#23191A",
  onSurfaceVariant: "#514345",
  outline: "#837375",
  outlineVariant: "#D6C2C4",
  error: "#BA1A1A",
  errorContainer: "#FFDAD6",
};

const JAR_META: Record<string, {
  name: string;
  icon: string;
  iconLib: "Ionicons" | "MaterialIcons" | "MaterialCommunityIcons";
  iconColor: string;
  iconBg: string;
  fillColor: string;
}> = {
  NEC: {
    name: "Thiết yếu",
    icon: "shopping-basket",
    iconLib: "MaterialIcons",
    iconColor: "#944652",
    iconBg: "rgba(254, 157, 169, 0.3)",
    fillColor: "#944652",
  },
  LTSS: {
    name: "Tiết kiệm",
    icon: "piggy-bank-outline",
    iconLib: "MaterialCommunityIcons",
    iconColor: "#864e5a",
    iconBg: "rgba(255, 183, 197, 0.3)",
    fillColor: "#864e5a",
  },
  EDU: {
    name: "Giáo dục",
    icon: "school-outline",
    iconLib: "Ionicons",
    iconColor: "#71585c",
    iconBg: "rgba(227, 194, 199, 0.3)",
    fillColor: "#71585c",
  },
  PLAY: {
    name: "Hưởng thụ",
    icon: "celebration",
    iconLib: "MaterialIcons",
    iconColor: "#ea580c",
    iconBg: "#ffedd5",
    fillColor: "#fb923c",
  },
  FFA: {
    name: "Đầu tư",
    icon: "trending-up",
    iconLib: "Ionicons",
    iconColor: "#2563eb",
    iconBg: "#dbeafe",
    fillColor: "#2563eb",
  },
  GIVE: {
    name: "Từ thiện",
    icon: "volunteer-activism",
    iconLib: "MaterialIcons",
    iconColor: "#dc2626",
    iconBg: "#fee2e2",
    fillColor: "#ef4444",
  },
};

const TAB_ITEMS = [
  { id: "home", label: "Trang chủ" },
  { id: "ledger", label: "Sổ GD" },
  { id: "budget", label: "Ngân sách" },
  { id: "wallets", label: "Ví" },
] as const;

const defaultQuote = "Ghi chép mỗi ngày, tâm hồn thảnh thơi cùng Capy bạn nhé!";

interface DashboardScreenProps {
  userId: string;
  onSignOut: () => void;
}

export default function DashboardScreen({
  userId,
  onSignOut,
}: DashboardScreenProps) {
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [jars, setJars] = useState<Jar[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("home");

  const [walletIncome, setWalletIncome] = useState<number>(0);
  const [walletExpense, setWalletExpense] = useState<number>(0);
  const [showTotalBalance, setShowTotalBalance] = useState<boolean>(true);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [appLanguage, setAppLanguage] = useState<'vi' | 'en'>('vi');
  const [appTheme, setAppTheme] = useState<'light' | 'dark'>('light');
  const [userJarsRatios, setUserJarsRatios] = useState<any>(null);
  const [isRolloverEnabled, setIsRolloverEnabled] = useState<boolean>(false);
  const [totalBudget, setTotalBudget] = useState<number>(10000000);

  useEffect(() => {
    async function loadRolloverSettings() {
      try {
        let dbBudget = 10000000;
        let dbRollover = false;
        
        if (supabase && typeof supabase.from === 'function') {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('total_budget, rollover_enabled')
            .eq('id', userId)
            .single();
          
          if (error) {
            // Fallback if rollover_enabled does not exist in profiles table yet
            if (error.message?.includes('rollover_enabled') || error.code === '42703' || error.code === 'PGRST204') {
              const fallbackRes = await supabase
                .from('profiles')
                .select('total_budget')
                .eq('id', userId)
                .single();
              if (fallbackRes.data && fallbackRes.data.total_budget) {
                dbBudget = Number(fallbackRes.data.total_budget);
              }
              const savedEnabled = await AsyncStorage.getItem(`@app_rollover_enabled_${userId}`);
              dbRollover = savedEnabled === 'true';
            }
          } else if (profile) {
            if (profile.total_budget) {
              dbBudget = Number(profile.total_budget);
            }
            dbRollover = !!profile.rollover_enabled;
          }
        } else {
          const savedEnabled = await AsyncStorage.getItem(`@app_rollover_enabled_${userId}`);
          dbRollover = savedEnabled === 'true';
        }
        
        setTotalBudget(dbBudget);
        setIsRolloverEnabled(dbRollover);
      } catch (e) {
        console.error("Error loading rollover settings on dashboard:", e);
      }
    }
    loadRolloverSettings();
  }, [userId, activeTab]);

  useEffect(() => {
    let isMounted = true;
    
    const load = async () => {
      try {
        setLoading(true);
        // Load profile first to get jars ratios
        const profileRes = await fetchProfile(userId);
        let currentJarsRatios = null;
        if (isMounted && profileRes.success && profileRes.data) {
          setUserDisplayName(profileRes.data.display_name || "Thành viên Capy");
          setUserJarsRatios(profileRes.data.jars_ratios || null);
          currentJarsRatios = profileRes.data.jars_ratios || null;
        }

        const walletsRes = await fetchWallets(userId);
        if (isMounted && walletsRes.success && walletsRes.data && walletsRes.data.length > 0) {
          setWallets(walletsRes.data);
          
          let activeWallet = walletsRes.data[0];
          let isLastWalletFound = false;
          try {
            const lastWalletId = await AsyncStorage.getItem(`last_active_wallet_id_${userId}`);
            if (lastWalletId) {
              const found = walletsRes.data.find((w) => w.id === lastWalletId);
              if (found) {
                activeWallet = found;
                isLastWalletFound = true;
              }
            }
            if (!isLastWalletFound) {
              await AsyncStorage.setItem(`last_active_wallet_id_${userId}`, activeWallet.id);
            }
          } catch (e) {
            console.error("Lỗi khi đọc/lưu ví active từ AsyncStorage:", e);
          }
          
          setSelectedWallet(activeWallet);
          const jarsRes = await fetchJars(userId);
          if (isMounted && jarsRes.success && jarsRes.data) {
            setJars(jarsRes.data);
            if (jarsRes.data.length < 6 || jarsRes.data.some((j) => j.allocation_percentage === 0)) {
              const ensureRes = await ensureJarsExist(userId, jarsRes.data, currentJarsRatios);
              if (ensureRes.success && isMounted) {
                const refetched = await fetchJars(userId);
                if (refetched.success && refetched.data) setJars(refetched.data);
              }
            }
          }
          const [incomeRes, expenseRes] = await Promise.all([
            fetchWalletIncome(activeWallet.id),
            fetchWalletExpense(activeWallet.id)
          ]);
          if (isMounted) {
            if (incomeRes.success) setWalletIncome(incomeRes.data);
            if (expenseRes.success) setWalletExpense(expenseRes.data);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);



  useEffect(() => {
    if (activeTab === "home" && selectedWallet?.id) {
      loadDashboardData(selectedWallet.id, true);
    }
  }, [activeTab]);

  const loadDashboardData = async (targetWalletId?: string, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const walletsRes = await fetchWallets(userId);
      if (walletsRes.success && walletsRes.data && walletsRes.data.length > 0) {
        setWallets(walletsRes.data);
        
        let wallet = walletsRes.data[0];
        if (targetWalletId) {
          const target = walletsRes.data.find((w) => w.id === targetWalletId);
          if (target) wallet = target;
        } else {
          try {
            const lastWalletId = await AsyncStorage.getItem(`last_active_wallet_id_${userId}`);
            if (lastWalletId) {
              const found = walletsRes.data.find((w) => w.id === lastWalletId);
              if (found) wallet = found;
            }
          } catch (e) {
            console.error("Lỗi khi đọc ví active từ AsyncStorage:", e);
          }
        }
        
        setSelectedWallet(wallet);
        
        try {
          await AsyncStorage.setItem(`last_active_wallet_id_${userId}`, wallet.id);
        } catch (e) {
          console.error("Lỗi khi lưu ví active vào AsyncStorage:", e);
        }

        const jarsRes = await fetchJars(userId);
        if (jarsRes.success && jarsRes.data) {
          setJars(jarsRes.data);
          if (jarsRes.data.length < 6 || jarsRes.data.some((j) => j.allocation_percentage === 0)) {
            const ensureRes = await ensureJarsExist(userId, jarsRes.data, userJarsRatios);
            if (ensureRes.success) {
              const refetched = await fetchJars(userId);
              if (refetched.success && refetched.data) setJars(refetched.data);
            }
          }
        }
        const [incomeRes, expenseRes] = await Promise.all([
          fetchWalletIncome(wallet.id),
          fetchWalletExpense(wallet.id)
        ]);
        if (incomeRes.success) setWalletIncome(incomeRes.data);
        if (expenseRes.success) setWalletExpense(expenseRes.data);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSelectWallet = async (wallet: Wallet) => {
    setSelectedWallet(wallet);
    try {
      await AsyncStorage.setItem(`last_active_wallet_id_${userId}`, wallet.id);
    } catch (e) {
      console.error("Lỗi khi lưu ví active vào AsyncStorage:", e);
    }
    fetchJars(userId).then(async (res) => {
      if (res.success && res.data) {
        setJars(res.data);
        if (res.data.length < 6 || res.data.some((j) => j.allocation_percentage === 0)) {
          const ensureRes = await ensureJarsExist(userId, res.data, userJarsRatios);
          if (ensureRes.success) {
            const refetched = await fetchJars(userId);
            if (refetched.success && refetched.data) setJars(refetched.data);
          }
        }
      }
    });
    Promise.all([
      fetchWalletIncome(wallet.id),
      fetchWalletExpense(wallet.id)
    ]).then(([incomeRes, expenseRes]) => {
      if (incomeRes.success) setWalletIncome(incomeRes.data);
      if (expenseRes.success) setWalletExpense(expenseRes.data);
    });
  };

  const handleQuickAddSuccess = () => {
    if (selectedWallet) loadDashboardData(selectedWallet.id);
  };



  const jarsWithAlerts = useMemo(() => {
    return jars.map((jar) => ({
      ...jar,
      alertStatus: evaluateJarBudget({ type: jar.type, spentAmount: jar.spent_amount, budgetLimit: jar.budget_limit }),
    }));
  }, [jars]);

  const { hasOverBudget, hasSpendingTooFast } = useMemo(() => {
    const over = jarsWithAlerts.some((j) => j.alertStatus === BudgetAlertStatus.OVER_BUDGET);
    const fast = jarsWithAlerts.some((j) => j.alertStatus === BudgetAlertStatus.SPENDING_TOO_FAST);
    return { hasOverBudget: over, hasSpendingTooFast: fast };
  }, [jarsWithAlerts]);

  const totalBalance = useMemo(() => {
    return wallets.reduce((sum, w) => sum + w.balance, 0);
  }, [wallets]);

  const walletSpent = useMemo(() => {
    return jars.reduce((sum, jar) => sum + jar.spent_amount, 0);
  }, [jars]);

  const walletStatusText = useMemo(() => {
    if (hasOverBudget) return "CÓ HŨ VƯỢT NGÂN SÁCH";
    if (hasSpendingTooFast) return "CHI TIÊU ĐANG NHANH";
    return "TÀI CHÍNH ỔN ĐỊNH";
  }, [hasOverBudget, hasSpendingTooFast]);

  const walletStatusStyle = useMemo(() => {
    if (hasOverBudget) return styles.statusChipError;
    if (hasSpendingTooFast) return styles.statusChipWarning;
    return styles.statusChipNormal;
  }, [hasOverBudget, hasSpendingTooFast]);

  const walletStatusTextStyle = useMemo(() => {
    if (hasOverBudget) return styles.statusChipTextError;
    if (hasSpendingTooFast) return styles.statusChipTextWarning;
    return styles.statusChipTextNormal;
  }, [hasOverBudget, hasSpendingTooFast]);

  const getMascotSpeech = () => {
    if (isRolloverEnabled) {
      const rolloverDiff = totalBudget - walletSpent;
      if (rolloverDiff >= 0) {
        return "Duy trì phong độ nhé! Bạn đang có số dư dồn sang tháng sau đấy.";
      } else {
        return "Tiêu quá tay rồi bạn ơi, tháng sau sẽ bị giảm hạn mức đấy nha!";
      }
    }
    if (hasOverBudget) return "Ôi bạn ơi! Có hũ bị vượt ngân sách kìa, hãy kiểm soát chi tiêu lại nhé!";
    if (hasSpendingTooFast) return "Cẩn thận nhé, bạn đang tiêu hơi nhanh cho một số hũ đấy!";
    return defaultQuote;
  };

  const renderJarIcon = (jarType: string) => {
    const meta = JAR_META[jarType];
    if (!meta) return null;
    const IconComponent =
      meta.iconLib === "Ionicons"
        ? Ionicons
        : meta.iconLib === "MaterialCommunityIcons"
        ? MaterialCommunityIcons
        : MaterialIcons;
    return (
      <IconComponent
        name={meta.icon as any}
        size={20}
        color={meta.iconColor}
      />
    );
  };

  const renderTabIcon = (tabId: string, isActive: boolean) => {
    const color = isActive ? "#79313D" : "#514345";
    const size = 24;
    if (tabId === "home") {
      return <Ionicons name={isActive ? "home" : "home-outline"} size={size} color={color} />;
    } else if (tabId === "ledger") {
      return <MaterialIcons name="receipt-long" size={size} color={color} />;
    } else if (tabId === "budget") {
      return <MaterialIcons name="account-balance-wallet" size={size} color={color} />;
    } else if (tabId === "wallets") {
      return <MaterialIcons name="account-balance" size={size} color={color} />;
    }
    return null;
  };

  // Fetch profile and app settings on mount
  useEffect(() => {
    const loadProfile = async () => {
      const res = await fetchProfile(userId);
      if (res.success && res.data) {
        setUserDisplayName(res.data.display_name || "Thành viên Capy");
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || "");
          setUserPhone(user.phone || "");
        }
      } catch (e) {
        console.error("Error fetching user email/phone:", e);
      }
    };

    const loadAppSettings = async () => {
      try {
        const lang = await AsyncStorage.getItem(`@app_language_${userId}`);
        if (lang === 'vi' || lang === 'en') setAppLanguage(lang);
        
        const theme = await AsyncStorage.getItem(`@app_theme_${userId}`);
        if (theme === 'light' || theme === 'dark') setAppTheme(theme);
      } catch (e) {
        console.error("Error loading app settings:", e);
      }
    };

    loadProfile();
    loadAppSettings();
  }, [userId]);

  const handleSaveProfile = async () => {
    const cleanName = userDisplayName.trim();
    if (!cleanName) {
      Alert.alert("Lỗi", "Tên hiển thị không được để trống.");
      return;
    }
    if (cleanName.length > 32) {
      Alert.alert("Lỗi", "Tên hiển thị không được vượt quá 32 ký tự.");
      return;
    }

    const res = await updateProfileName(userId, cleanName);
    if (res.success) {
      Alert.alert("Thành công", "Cập nhật tên hiển thị thành công!");
      setShowUserInfoModal(false);
    } else {
      Alert.alert("Lỗi", res.error || "Không thể cập nhật tên. Vui lòng kiểm tra lại kết nối mạng.");
    }
  };

  const handleSaveSettings = async () => {
    try {
      await AsyncStorage.setItem(`@app_language_${userId}`, appLanguage);
      await AsyncStorage.setItem(`@app_theme_${userId}`, appTheme);
      Alert.alert("Thành công", "Đã lưu cài đặt tài khoản của bạn.");
      setShowSettingsModal(false);
    } catch (e) {
      Alert.alert("Lỗi", "Không thể lưu cài đặt.");
    }
  };

  const handleSignOutClick = () => {
    Alert.alert(
      "Xác nhận đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất không?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Đăng xuất", style: "destructive", onPress: onSignOut }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang chuẩn bị tài chính...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowProfileMenu(true)}
            style={styles.avatarContainer}
            testID="avatar-button"
          >
            <Image
              source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhq93xgHYB9zHvKzMxBGPaG_OntFhm2_owD9L-J5PZQd8V5m175trDv00QBQ8tbkJz0mOW40gWTmfWEsjNFIc343KEQM03Fq6lbGVvG3Lsw6R9H-wNI9q1rBI64e6cW5CLQtEcsTToAXkXODMl2WFRApvtkDyW-5OyD9rU26j_ni9krkQ_StHegdhySbuQ062MdFw_6RQrM4I7RkMBf4WU_u_Rd-wgp58_iC1DT-XqPh6xHbtijpqMimWRCJoq38mloeqZfCtAfyI9" }}
              style={styles.avatarImage}
            />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Capy's Money</Text>
            <Text style={styles.headerSubtitle}>Tài chính thảnh thơi</Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.bellButton}
          onPress={() => Alert.alert("Thông báo", "Hiện tại bạn chưa có thông báo mới nào.")}
          testID="bell-button"
        >
          <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Profile Dropdown Menu */}
      <Modal
        visible={showProfileMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProfileMenu(false)}
        >
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowProfileMenu(false);
                setShowUserInfoModal(true);
              }}
              activeOpacity={0.7}
              testID="dropdown-profile-info"
            >
              <Ionicons name="person-outline" size={20} color={COLORS.onSurface} style={styles.dropdownIcon} />
              <Text style={styles.dropdownText}>Thông tin người dùng</Text>
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowProfileMenu(false);
                setShowSettingsModal(true);
              }}
              activeOpacity={0.7}
              testID="dropdown-settings"
            >
              <Ionicons name="settings-outline" size={20} color={COLORS.onSurface} style={styles.dropdownIcon} />
              <Text style={styles.dropdownText}>Cài đặt</Text>
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity
              style={[styles.dropdownItem, styles.dropdownItemDestructive]}
              onPress={() => {
                setShowProfileMenu(false);
                handleSignOutClick();
              }}
              activeOpacity={0.7}
              testID="dropdown-logout"
            >
              <Ionicons name="log-out-outline" size={20} color={COLORS.error} style={styles.dropdownIcon} />
              <Text style={[styles.dropdownText, styles.dropdownTextDestructive]}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* User Info Popup Modal */}
      <Modal
        visible={showUserInfoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserInfoModal(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.infoModalContainer}>
            <Text style={styles.modalHeading}>Thông tin cá nhân</Text>
            
            <View style={styles.modalFieldGroup}>
              <Text style={styles.modalFieldLabel}>Tên hiển thị</Text>
              <TextInput
                style={styles.modalInput}
                value={userDisplayName}
                onChangeText={setUserDisplayName}
                placeholder="Nhập tên hiển thị"
                maxLength={32}
              />
            </View>

            <View style={styles.modalFieldGroup}>
              <Text style={styles.modalFieldLabel}>Email (Đăng nhập)</Text>
              <Text style={styles.modalReadOnlyValue}>{userEmail || "Chưa thiết lập"}</Text>
            </View>

            <View style={styles.modalFieldGroup}>
              <Text style={styles.modalFieldLabel}>Số điện thoại</Text>
              <Text style={styles.modalReadOnlyValue}>{userPhone || "Chưa thiết lập"}</Text>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowUserInfoModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveProfile}
                activeOpacity={0.7}
                testID="save-profile-btn"
              >
                <Text style={styles.modalSaveBtnText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Popup Modal */}
      <Modal
        visible={showSettingsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.infoModalContainer}>
            <Text style={styles.modalHeading}>Cài đặt tài khoản</Text>

            {/* Language Selection */}
            <View style={styles.modalFieldGroup}>
              <Text style={styles.modalFieldLabel}>Ngôn ngữ</Text>
              <View style={styles.settingToggleRow}>
                <TouchableOpacity
                  style={[styles.settingOptionBtn, appLanguage === 'vi' && styles.settingOptionActive]}
                  onPress={() => setAppLanguage('vi')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.settingOptionText, appLanguage === 'vi' && styles.settingOptionActiveText]}>Tiếng Việt</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.settingOptionBtn, appLanguage === 'en' && styles.settingOptionActive]}
                  onPress={() => setAppLanguage('en')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.settingOptionText, appLanguage === 'en' && styles.settingOptionActiveText]}>English</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Theme Selection */}
            <View style={styles.modalFieldGroup}>
              <Text style={styles.modalFieldLabel}>Giao diện hiển thị</Text>
              <View style={styles.settingToggleRow}>
                <TouchableOpacity
                  style={[styles.settingOptionBtn, appTheme === 'light' && styles.settingOptionActive]}
                  onPress={() => setAppTheme('light')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.settingOptionText, appTheme === 'light' && styles.settingOptionActiveText]}>Sáng</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.settingOptionBtn, appTheme === 'dark' && styles.settingOptionActive]}
                  onPress={() => setAppTheme('dark')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.settingOptionText, appTheme === 'dark' && styles.settingOptionActiveText]}>Tối</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowSettingsModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveSettings}
                activeOpacity={0.7}
                testID="save-settings-btn"
              >
                <Text style={styles.modalSaveBtnText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {activeTab === "home" ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {selectedWallet && (
          <>
            {/* Total Balance Card */}
            <LinearGradient
              colors={["#FE9DA9", "#864E5A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.totalBalanceCard}
            >
              <View style={styles.totalBalanceOrnament} />
              <View style={styles.totalBalanceHeader}>
                <Text style={styles.totalBalanceTitle}>Tổng số dư</Text>
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowTotalBalance(!showTotalBalance)}
                  activeOpacity={0.7}
                  testID="total-balance-eye-toggle"
                >
                  <Ionicons
                    name={showTotalBalance ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.totalBalanceValueRow}>
                <Text style={styles.totalBalanceAmount} numberOfLines={1} adjustsFontSizeToFit>
                  {showTotalBalance ? totalBalance.toLocaleString("vi-VN") : "••••••••"}
                </Text>
                <Text style={styles.totalBalanceSymbol}>đ</Text>
              </View>
            </LinearGradient>

            {/* Wallet Switcher */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.walletSwitcherScroll}
              contentContainerStyle={styles.walletSwitcherContent}
            >
              {wallets.map((w) => {
                const isActive = selectedWallet.id === w.id;
                if (isActive) {
                  return (
                    <TouchableOpacity
                      key={w.id}
                      activeOpacity={0.8}
                      style={styles.walletPillActive}
                      onPress={() => handleSelectWallet(w)}
                    >
                      <Ionicons name="wallet" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.walletPillTextActive}>{w.name}</Text>
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={w.id}
                    activeOpacity={0.8}
                    style={styles.walletPillInactive}
                    onPress={() => handleSelectWallet(w)}
                  >
                    <Ionicons
                      name="wallet-outline"
                      size={18}
                      color={COLORS.onSurfaceVariant}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.walletPillTextInactive}>{w.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Wallet Balance Hero Card */}
            <View style={styles.balanceHeroCard}>
              <View style={styles.balanceHeroHeader}>
                <View>
                  <Text style={styles.balanceHeroLabel}>Số dư ví này</Text>
                  <View style={styles.balanceHeroAmountContainer}>
                    <Text style={styles.balanceHeroAmount} numberOfLines={1} adjustsFontSizeToFit>
                      {selectedWallet.balance.toLocaleString("vi-VN")}
                    </Text>
                    <Text style={styles.balanceHeroSymbol}>đ</Text>
                  </View>
                </View>
                <View style={[styles.statusChip, walletStatusStyle]}>
                  <Text style={[styles.statusChipText, walletStatusTextStyle]}>{walletStatusText}</Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.balanceColumns}>
                <View style={styles.balanceColumn}>
                  <Text style={styles.columnLabel}>Thu nhập</Text>
                  <Text style={styles.incomeAmount} numberOfLines={1} adjustsFontSizeToFit>
                    +{walletIncome.toLocaleString("vi-VN")} đ
                  </Text>
                </View>
                <View style={styles.balanceColumnRight}>
                  <Text style={styles.columnLabel}>Đã chi tiêu</Text>
                  <Text style={styles.spentAmount} numberOfLines={1} adjustsFontSizeToFit>
                    -{walletExpense.toLocaleString("vi-VN")} đ
                  </Text>
                </View>
              </View>
            </View>

            {/* Rollover forecast banner */}
            {isRolloverEnabled && (() => {
              const diff = totalBudget - walletSpent;
              const isSurplus = diff >= 0;
              const absDiff = Math.abs(diff);
              return (
                <View
                  testID="banner-rollover-forecast"
                  style={[
                    styles.rolloverBanner,
                    isSurplus ? styles.rolloverBannerSurplus : styles.rolloverBannerDeficit
                  ]}
                >
                  <Ionicons
                    name={isSurplus ? "sparkles-outline" : "alert-circle-outline"}
                    size={16}
                    color={isSurplus ? COLORS.secondary : COLORS.error}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.rolloverBannerText, isSurplus ? styles.rolloverBannerTextSurplus : styles.rolloverBannerTextDeficit]}>
                    {isSurplus 
                      ? `Dự kiến cộng thêm +${absDiff.toLocaleString()}đ vào hạn mức tháng sau!`
                      : `Lạm chi -${absDiff.toLocaleString()}đ sẽ khấu trừ vào hạn mức tháng sau!`}
                  </Text>
                </View>
              );
            })()}
          </>
        )}

          <>

            {/* Mascot Quote Card */}
            <View style={styles.quoteCard}>
              <View style={styles.quoteMascotContainer}>
                <Image
                  source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBj1MKMqCSYp8V3fzVZnQ2uX4NGuF_mpo3N6_wA2bWHNveg-AX6juNT72cmpykoOchnz70IsItbgaLVgdnzOImnFGnlubITL1OAS7Vs_5rpLUR31h_gGw1_NE8jMQOzV40SHJVtQDmTIrx98LrtnUai7YpWLiATYxe_l2MZx542Yq_JMu4OMTnU-GP5GQHLAx1N1yP0lIS4AKD68WcsUEGwOmTlKkE9E0uMucR9fOAMAxAWrF_-Se2R35fGIQoBqLstSXiNM21u_GUb" }}
                  style={styles.quoteMascot}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.quoteTextContainer}>
                <Text style={styles.quoteText}>
                  "{getMascotSpeech()}"
                </Text>
              </View>
            </View>

            {/* Jars Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Phân phối 6 Hũ</Text>
              <TouchableOpacity style={styles.detailBtn} activeOpacity={0.7}>
                <Text style={styles.detailBtnText}>Chi tiết</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.jarsContainer}>
              {jarsWithAlerts.length === 0 ? (
                <Text style={styles.emptyJarsText}>Chưa có hũ nào. Hãy thiết lập ngân sách nhé!</Text>
              ) : (
                jarsWithAlerts.map((jar) => {
                  const meta = JAR_META[jar.type] || {
                    name: jar.type,
                    icon: "help-outline",
                    iconLib: "Ionicons",
                    iconColor: COLORS.outline,
                    iconBg: COLORS.surfaceContainer,
                    fillColor: COLORS.primary,
                  };
                  const budgetLimit = jar.budget_limit || 1;
                  const ratio = Math.min((jar.spent_amount / budgetLimit) * 100, 100);
                  const progressWidth = Math.max(ratio, 0);

                  let barColor = meta.fillColor;
                  let alertText = "";
                  let alertTextColor = COLORS.onSurfaceVariant;
                  if (jar.alertStatus === BudgetAlertStatus.OVER_BUDGET) {
                    barColor = COLORS.error;
                    alertText = "VỰT HẠN MỨC!";
                    alertTextColor = COLORS.error;
                  } else if (jar.alertStatus === BudgetAlertStatus.SPENDING_TOO_FAST) {
                    barColor = "#fb923c"; // Orange-400
                    alertText = "TIÊU DÙNG NHANH!";
                    alertTextColor = "#ea580c"; // Orange-600
                  }

                  return (
                    <View key={jar.type} style={styles.jarGridItem}>
                      <View style={styles.jarGridHeader}>
                        <View style={[styles.jarIconWrapper, { backgroundColor: meta.iconBg }]}>
                          {renderJarIcon(jar.type)}
                        </View>
                        <Text style={styles.jarPercentText}>
                          {jar.allocation_percentage}%
                        </Text>
                      </View>
                      
                      <Text style={styles.jarNameText} numberOfLines={1}>
                        {meta.name}
                      </Text>

                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBar, { width: `${progressWidth}%`, backgroundColor: barColor }]} />
                      </View>

                      {alertText ? (
                        <Text style={[styles.alertBadgeText, { color: alertTextColor }]} numberOfLines={1}>
                          {alertText}
                        </Text>
                      ) : (
                        <View style={styles.alertPlaceholder} />
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </>
        </ScrollView>
      ) : activeTab === "wallets" ? (
        <WalletScreen
          userId={userId}
          onWalletSelected={(w) => {
            handleSelectWallet(w);
            setActiveTab("home");
          }}
        />
      ) : activeTab === "budget" ? (
        <BudgetScreen />
      ) : activeTab === "ledger" && selectedWallet ? (
        <LedgerScreen walletIds={wallets.map(w => w.id)} />
      ) : null}

      {/* Bottom Navigation Bar */}
      <View style={styles.tabBar}>
        {TAB_ITEMS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              style={isActive ? styles.activeTabItem : styles.inactiveTabItem}
              onPress={() => setActiveTab(tab.id)}
            >
              {renderTabIcon(tab.id, isActive)}
              <Text style={isActive ? styles.activeTabLabel : styles.inactiveTabLabel}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedWallet && (
        <QuickAddBottomSheet
          visible={showQuickAdd}
          onClose={() => setShowQuickAdd(false)}
          walletId={selectedWallet.id}
          userId={userId}
          onSaveSuccess={handleQuickAddSuccess}
        />
      )}



      {activeTab === "home" && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.fabButton}
          onPress={() => setShowQuickAdd(true)}
          testID="fab-add-transaction"
        >
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontStyle: "italic",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 12 : 12,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.secondaryContainer,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary,
    lineHeight: 28,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: "500",
    marginTop: 2,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: 110,
    paddingTop: 4,
  },
  totalBalanceCard: {
    borderRadius: 32,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 16,
    overflow: "hidden",
    shadowColor: "rgba(255, 183, 197, 0.4)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 8,
  },
  totalBalanceOrnament: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 128,
    height: 128,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 64,
    marginRight: -64,
    marginTop: -64,
  },
  totalBalanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  totalBalanceTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.9,
  },
  eyeButton: {
    padding: 4,
  },
  totalBalanceValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  totalBalanceAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  totalBalanceSymbol: {
    fontSize: 20,
    fontWeight: "500",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  walletSwitcherScroll: {
    marginTop: 16,
    maxHeight: 52,
  },
  walletSwitcherContent: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  walletPillActive: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
    marginRight: 12,
    shadowColor: "rgba(255, 183, 197, 0.4)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  walletPillInactive: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceContainerHigh,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
    marginRight: 12,
  },
  walletPillTextActive: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  walletPillTextInactive: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
  },
  balanceHeroCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 32,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    shadowColor: "rgba(255, 183, 197, 0.2)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 3,
  },
  balanceHeroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  balanceHeroLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.onSurfaceVariant,
  },
  balanceHeroAmountContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 2,
  },
  balanceHeroAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary,
  },
  balanceHeroSymbol: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    marginLeft: 2,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  statusChipNormal: {
    backgroundColor: "rgba(255, 183, 197, 0.2)",
    borderColor: "rgba(255, 183, 197, 0.3)",
  },
  statusChipWarning: {
    backgroundColor: "#ffedd5",
    borderColor: "#fed7aa",
  },
  statusChipError: {
    backgroundColor: COLORS.errorContainer,
    borderColor: "#ffb4ab",
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  statusChipTextNormal: {
    color: COLORS.onPrimaryContainer,
  },
  statusChipTextWarning: {
    color: "#c2410c",
  },
  statusChipTextError: {
    color: COLORS.error,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(214, 194, 196, 0.4)",
    marginVertical: 16,
  },
  balanceColumns: {
    flexDirection: "row",
  },
  balanceColumn: {
    flex: 1,
  },
  balanceColumnRight: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(214, 194, 196, 0.4)",
    paddingLeft: 16,
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.onSurfaceVariant,
    marginBottom: 4,
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  spentAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  quoteCard: {
    backgroundColor: "rgba(227, 194, 199, 0.3)",
    borderRadius: 32,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(227, 194, 199, 0.5)",
  },
  quoteMascotContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  quoteMascot: {
    width: "100%",
    height: "100%",
  },
  quoteTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  quoteText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.onTertiaryContainer,
    fontStyle: "italic",
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
  },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    marginRight: 2,
  },
  jarsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    width: "100%",
  },
  emptyJarsText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    paddingVertical: 20,
    width: "100%",
  },
  jarGridItem: {
    width: "48.5%",
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 32,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    shadowColor: "rgba(255, 183, 197, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 12,
  },
  jarGridHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  jarIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  jarPercentText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  jarNameText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  progressBarBg: {
    width: "100%",
    height: 8,
    backgroundColor: "#F1DEDF",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  alertBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },
  alertPlaceholder: {
    height: 14,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceContainer,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 16,
    paddingTop: 8,
    paddingHorizontal: 16,
    shadowColor: "rgba(255, 183, 197, 0.2)",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
    alignItems: "center",
    justifyContent: "space-around",
  },
  activeTabItem: {
    backgroundColor: COLORS.secondaryContainer,
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  inactiveTabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  activeTabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.onSecondaryContainer,
    marginTop: 2,
  },
  inactiveTabLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  walletsTabContainer: {
    marginTop: 16,
    width: "100%",
    paddingHorizontal: 20,
  },
  memberCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 32,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    shadowColor: "rgba(255, 183, 197, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 1,
    marginBottom: 16,
  },
  walletTabSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.onSurface,
    marginBottom: 16,
  },
  membersList: {
    marginBottom: 16,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    fontSize: 18,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.onSurface,
  },
  selfText: {
    color: COLORS.outline,
    fontWeight: "400",
    fontSize: 12,
  },
  memberRoleText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  removeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: COLORS.errorContainer,
    borderWidth: 1,
    borderColor: "#FFB4AB",
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.error,
  },
  inviteButton: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 100,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  inviteButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  limitText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
  },
  personalWalletCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    alignItems: "center",
    shadowColor: "rgba(255, 183, 197, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 1,
    marginBottom: 16,
  },
  personalWalletMascot: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  personalWalletTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  personalWalletDesc: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 18,
  },
  joinWalletMainBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  joinWalletMainBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  fabButton: {
    position: "absolute",
    bottom: 92,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FFB7C5",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 99,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  dropdownMenu: {
    position: "absolute",
    top: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 68 : 68,
    left: 20,
    width: 220,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemDestructive: {
    // Optional additional styling
  },
  dropdownIcon: {
    marginRight: 12,
  },
  dropdownText: {
    fontSize: 14,
    color: COLORS.onSurface,
    fontWeight: "500",
  },
  dropdownTextDestructive: {
    color: COLORS.error,
    fontWeight: "600",
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.5,
    marginHorizontal: 16,
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoModalContainer: {
    width: "85%",
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeading: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: "center",
  },
  modalFieldGroup: {
    marginBottom: 16,
  },
  modalFieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
    marginBottom: 6,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.onSurface,
    backgroundColor: "#FFFFFF",
  },
  modalReadOnlyValue: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  modalCancelBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  modalSaveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  modalSaveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  settingToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  settingOptionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    backgroundColor: "#FFFFFF",
  },
  settingOptionActive: {
    backgroundColor: COLORS.primaryContainer,
    borderColor: COLORS.primary,
  },
  settingOptionText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    fontWeight: "600",
  },
  settingOptionActiveText: {
    color: COLORS.onPrimaryContainer,
    fontWeight: "700",
  },
  rolloverBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  rolloverBannerSurplus: {
    backgroundColor: '#f0fdf4',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  rolloverBannerDeficit: {
    backgroundColor: '#fef2f2',
    borderColor: 'rgba(186, 26, 26, 0.2)',
  },
  rolloverBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  rolloverBannerTextSurplus: {
    color: '#10b981',
  },
  rolloverBannerTextDeficit: {
    color: '#ba1a1a',
  },
});

