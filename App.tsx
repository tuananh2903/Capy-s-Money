import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, SafeAreaView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { supabase } from './src/services/supabaseClient';
if (Platform.OS === 'web') {
  require('./src/utils/register-sw');

  // Polyfill Alert.alert for Web, since react-native-web implements it as an empty function.
  Alert.alert = (title: string, message?: string, buttons?: any[]) => {
    const formattedMsg = message ? `${title}\n${message}` : title;
    if (buttons && buttons.length > 0) {
      const confirmResult = window.confirm(formattedMsg);
      if (confirmResult) {
        // Trigger the onPress callback of the positive action button (usually the last button in the array)
        const confirmBtn = buttons[buttons.length - 1];
        if (confirmBtn && confirmBtn.onPress) confirmBtn.onPress();
      } else {
        // Trigger the onPress callback of the cancel action button if it exists
        const cancelBtn = buttons.find(b => b.style === 'cancel');
        if (cancelBtn && cancelBtn.onPress) cancelBtn.onPress();
      }
    } else {
      window.alert(formattedMsg);
    }
  };
}
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import { completeOnboarding } from './src/services/onboardingService';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [savingOnboarding, setSavingOnboarding] = useState<boolean>(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');

  // 1. Kiểm tra trạng thái Onboarding của người dùng
  const checkOnboardingStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .single();

      if (error) {
        // Trong trường hợp tài khoản mới chưa kịp sinh Trigger profile (hoặc lỗi kết nối)
        console.warn('Profile not found, defaulting onboarding_completed to false:', error.message);
        setOnboardingCompleted(false);
      } else if (data) {
        setOnboardingCompleted(data.onboarding_completed ?? false);
      }
    } catch (err) {
      console.error('Failed to check onboarding status:', err);
      setOnboardingCompleted(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 2. Lấy session hiện tại
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkOnboardingStatus(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 3. Đăng ký lắng nghe thay đổi Auth State từ Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkOnboardingStatus(session.user.id);
      } else {
        setOnboardingCompleted(false);
        setLoading(false);
      }
    });

    // --- DEEP LINK LISTENER FOR OAUTH ---
    const handleDeepLink = async (event: { url: string }) => {
      console.log('--- RECEIVED DEEP LINK URL ---');
      console.log('URL:', event.url);
      console.log('------------------------------');

      // Thay thế '#' bằng '?' để Linking.parse có thể đọc được các tham số trong hash fragment
      const cleanUrl = event.url.includes('#') ? event.url.replace('#', '?') : event.url;
      const parsed = Linking.parse(cleanUrl);

      // 2. Kiểm tra token OAuth
      const { access_token, refresh_token } = parsed.queryParams || {};

      console.log('Parsed deep link tokens:', {
        access_token: access_token ? 'Exists' : 'Missing',
        refresh_token: refresh_token ? 'Exists' : 'Missing'
      });

      if (access_token && refresh_token) {
        setLoading(true);
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: Array.isArray(access_token) ? access_token[0] : access_token,
            refresh_token: Array.isArray(refresh_token) ? refresh_token[0] : refresh_token,
          });

          if (sessionError) {
            console.error('Error setting session from deep link:', sessionError.message);
            setLoading(false);
          } else {
            // Clear hash on Web to prevent loops
            if (Platform.OS === 'web' && window.history && window.history.replaceState) {
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
          }
        } catch (err) {
          console.error('Failed to set session:', err);
          setLoading(false);
        }
      }
    };

    // Đăng ký lắng nghe sự kiện URL khi ứng dụng đang chạy
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    // Kiểm tra nếu ứng dụng được mở từ một deep link (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, []);

  // 4. Xử lý hoàn tất Onboarding (Lưu data lên DB và chuyển trạng thái)
  const handleOnboardingComplete = async (
    goal: string,
    balance: number,
    walletName: string,
    jarsRatios: { nec: number; lt: number; ffa: number; edu: number; play: number; give: number }
  ) => {
    if (!session?.user) return;
    setSavingOnboarding(true);
    setOnboardingError(null);

    const res = await completeOnboarding(session.user.id, goal, balance, walletName, jarsRatios);

    if (res.success) {
      setOnboardingCompleted(true);
    } else {
      setOnboardingError(res.error || 'Có lỗi xảy ra khi thiết lập ví. Vui lòng thử lại.');
    }
    setSavingOnboarding(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error.message);
      }
    } catch (err) {
      console.error('Unexpected error during signOut:', err);
    } finally {
      setSession(null);
      setOnboardingCompleted(false);
      setLoading(false);
    }
  };

  // Màn hình Loading khi đang fetch trạng thái từ database
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C8C" />
        <Text style={styles.loadingText}>Đang tải cấu hình Capy...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.rootContainer}>
      {/* 5. Cấu hình Định tuyến thông minh (Route Protection) */}
      {!session ? (
        authScreen === 'login' ? (
          <LoginScreen onSwitchToRegister={() => setAuthScreen('register')} />
        ) : (
          <RegisterScreen onSwitchToLogin={() => setAuthScreen('login')} />
        )
      ) : !onboardingCompleted ? (
        <View style={styles.flexContainer}>
          <OnboardingScreen onComplete={handleOnboardingComplete} />
          {onboardingError && <Text style={styles.errorBanner}>{onboardingError}</Text>}
        </View>
      ) : (
        <DashboardScreen
          userId={session.user.id}
          onSignOut={handleSignOut}
        />
      )}
      
      {/* Màn hình Overlay khi đang lưu dữ liệu onboarding lên DB */}
      {savingOnboarding && (
        <View style={styles.overlayLoadingContainer}>
          <ActivityIndicator size="large" color="#20E3B2" />
          <Text style={[styles.loadingText, { color: '#20E3B2' }]}>Capy đang chia hũ và khởi tạo Ví của bạn...</Text>
        </View>
      )}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FFF8F7',
  },
  flexContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFF8F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 248, 247, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#8A7A7B',
    fontStyle: 'italic',
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#FFD2D2',
    color: '#D8000C',
    textAlign: 'center',
    padding: 10,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
