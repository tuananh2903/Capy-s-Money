import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { loginWithEmail, loginWithGoogle } from '../services/authService';
import CapyMascot from '../components/CapyMascot';

interface LoginScreenProps {
  onSwitchToRegister?: () => void;
}

export default function LoginScreen({ onSwitchToRegister }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await loginWithEmail(email, pass);
      if (res.error) {
        setError(res.error);
      } else {
        // Đăng nhập thành công, điều hướng hoặc cập nhật state ứng dụng
      }
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử đăng nhập lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res.error) {
        setError(res.error);
      } else {
        // Đăng nhập thành công
      }
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử đăng nhập lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Logo Header */}
          <View style={styles.brandContainer}>
            <Text style={styles.brandText}>CAPY'S MONEY</Text>
          </View>

          {/* Soft Card Container */}
          <View style={styles.card}>
            {/* Capy Mascot Illustration */}
            <View style={styles.mascotContainer}>
              <CapyMascot type="thinking" />
            </View>

            {/* App Header */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Chào mừng bạn đến với không gian tài chính chill nhất</Text>
              <Text style={styles.subtitle}>Đăng nhập để tiếp tục hành trình tiết kiệm cùng Capy</Text>
            </View>

            {/* Form Content */}
            <View style={styles.formContainer}>
              {/* Email Input */}
              <View
                style={[
                  styles.inputWrapper,
                  emailFocused && styles.inputWrapperFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#8A7A7B"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>

              {/* Password Input */}
              <View
                style={[
                  styles.inputWrapper,
                  passwordFocused && styles.inputWrapperFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu"
                  placeholderTextColor="#8A7A7B"
                  value={pass}
                  onChangeText={setPass}
                  secureTextEntry
                  editable={!loading}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
              </View>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Email Login Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.loginButton, loading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.loginButtonText}>Đăng nhập</Text>
                )}
              </TouchableOpacity>

              {/* Google Login Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.googleButton, loading && styles.disabledButton]}
                onPress={handleGoogleLogin}
                disabled={loading}
              >
                <View style={styles.googleContent}>
                  {/* Google Logo Representation */}
                  <View style={styles.googleLogo}>
                    <Text style={styles.googleG}>G</Text>
                  </View>
                  <Text style={styles.googleButtonText}>Tiếp tục với Google</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Footer Registration Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Bạn chưa có tài khoản? </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={onSwitchToRegister}>
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Footer Links */}
          <View style={styles.footerLinksContainer}>
            <TouchableOpacity activeOpacity={0.7} style={styles.footerLink}>
              <Text style={styles.footerLinkText}>Điều khoản</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>|</Text>
            <TouchableOpacity activeOpacity={0.7} style={styles.footerLink}>
              <Text style={styles.footerLinkText}>Bảo mật</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>|</Text>
            <TouchableOpacity activeOpacity={0.7} style={styles.footerLink}>
              <Text style={styles.footerLinkText}>Trợ giúp</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f7', // Stitch Background: warm off-white
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  brandText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 14,
    fontWeight: '800',
    color: '#864e5a',
    letterSpacing: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 32, // Stitch Design System: Card roundness 32px
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderWidth: 1,
    borderColor: '#FFDDE2', // Light border
    // Ethereal light pink shadow
    shadowColor: '#ffb7c5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
  mascotContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerContainer: {
    marginBottom: 28,
    alignItems: 'center',
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#864e5a', // Stitch Primary color
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 14,
    color: '#8A7A7B', // Stitch On-Surface muted/soft grey
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 16,
    backgroundColor: '#FFF4F3', // Tertiary light pink background
    borderRadius: 9999, // Pill-first rounded input
    borderWidth: 1.5,
    borderColor: '#FFF4F3', // Blends with background normally
  },
  inputWrapperFocused: {
    borderColor: '#864e5a', // Primary pink border on focus
    backgroundColor: '#ffffff', // Shift background on focus
  },
  input: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    color: '#23191a', // Warm dark brown text
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#ffdad6', // On-error container background
    borderColor: '#ffb4ab',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#ba1a1a', // Stitch Error color
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#864e5a', // Stitch Primary color
    paddingVertical: 16,
    borderRadius: 9999, // Fully pill-shaped
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#864e5a', // Prominent brand pink shadow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: '#ffffff', // Clean white background
    paddingVertical: 14,
    borderRadius: 9999, // Fully pill-shaped
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFE5E2',
    shadowColor: '#ffb7c5', // Subtle pink shadow tint
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF4F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FFE5E2',
  },
  googleG: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 14,
    fontWeight: '900',
    color: '#ba1a1a', // Reddish color for Google G representation
  },
  googleButtonText: {
    color: '#23191a', // Dark brown text for Google login
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.5,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  registerText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    color: '#8A7A7B',
    fontSize: 14,
  },
  registerLink: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    color: '#864e5a',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footerLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  footerLink: {
    paddingHorizontal: 8,
  },
  footerLinkText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    color: '#8A7A7B',
    fontSize: 12,
  },
  footerDivider: {
    color: '#FFE5E2',
    fontSize: 12,
  },
});

