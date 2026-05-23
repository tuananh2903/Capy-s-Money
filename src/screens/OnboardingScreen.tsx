import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Animated,
} from 'react-native';
import CapyMascot from '../components/CapyMascot';

const { width } = Dimensions.get('window');

interface JarRatio {
  nec: number;
  lt: number;
  ffa: number;
  edu: number;
  play: number;
  give: number;
}

const DEFAULT_RATIOS: JarRatio = {
  nec: 55,
  lt: 10,
  ffa: 10,
  edu: 10,
  play: 10,
  give: 5,
};

const EMPTY_RATIOS: JarRatio = {
  nec: 0,
  lt: 0,
  ffa: 0,
  edu: 0,
  play: 0,
  give: 0,
};

const JARS_METADATA = [
  { key: 'nec', name: 'Thiết yếu', label: 'Hũ Thiết yếu', color: '#FF8C8C', desc: 'Chi tiêu ăn uống, nhà cửa, hóa đơn bắt buộc hàng ngày.' },
  { key: 'lt', name: 'Tiết kiệm', label: 'Hũ Tiết kiệm', color: '#A8E6CF', desc: 'Tiết kiệm dài hạn: tích lũy mua nhà, mua xe hoặc dự phòng khẩn cấp.' },
  { key: 'ffa', name: 'Tự do TC', label: 'Hũ Tự do TC', color: '#FFD3B6', desc: 'Tự do tài chính: Tiền đầu tư, kinh doanh để tạo ra thu nhập thụ động.' },
  { key: 'edu', name: 'Giáo dục', label: 'Hũ Giáo dục', color: '#D4E2FC', desc: 'Quỹ học hành, mua sách, tham gia khóa học nâng cấp bản thân.' },
  { key: 'play', name: 'Hưởng thụ', label: 'Hũ Hưởng thụ', color: '#FCE1FC', desc: 'Ăn chơi, xem phim, nuông chiều bản thân mà không lo áy náy.' },
  { key: 'give', name: 'Cho đi', label: 'Hũ Cho đi', color: '#EAE1FC', desc: 'Tiền làm từ thiện, quà cáp, giúp đỡ gia đình, bạn bè.' },
];

const SUGGESTED_GOALS = [
  'Tiết kiệm mua nhà/xe',
  'Quản lý chi tiêu hàng ngày',
  'Tự do tài chính (Đầu tư)',
];

interface OnboardingScreenProps {
  onComplete: (
    goal: string,
    balance: number,
    walletName: string,
    jarsRatios: JarRatio
  ) => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<number>(1);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  // Step 1: Tạo ví
  const [walletName, setWalletName] = useState<string>('Ví của tôi');
  const [balanceText, setBalanceText] = useState<string>('0');
  const [step1Error, setStep1Error] = useState<string | null>(null);

  // Step 2: 6 Hũ
  const [template, setTemplate] = useState<'A' | 'B'>('A');
  const [jars, setJars] = useState<JarRatio>({ ...DEFAULT_RATIOS });
  const [activeJarKey, setActiveJarKey] = useState<keyof JarRatio>('nec');

  // Step 3: Mục tiêu
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [customGoal, setCustomGoal] = useState<string>('');
  const [step3Error, setStep3Error] = useState<string | null>(null);

  // Progress Bar Animation
  const progressAnim = useState(new Animated.Value(0.33))[0];

  const updateProgress = (targetStep: number) => {
    Animated.timing(progressAnim, {
      toValue: targetStep / 3,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Timer for Step 1 success transition
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        setStep(2);
        updateProgress(2);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleStep1Submit = () => {
    const trimmedName = walletName.trim();
    if (!trimmedName) {
      setStep1Error('Hãy đặt tên cho ví của bạn nhé! 🌱');
      return;
    }
    if (trimmedName.length > 32) {
      setStep1Error('Tên ví tối đa 32 ký tự thôi nha!');
      return;
    }

    const cleanNumber = parseInt(balanceText.replace(/,/g, ''), 10);
    if (isNaN(cleanNumber) || cleanNumber < 0) {
      setStep1Error('Số dư không thể nhỏ hơn 0 đâu nhé!');
      return;
    }
    if (cleanNumber > 99999999999) {
      setStep1Error('Số tiền lớn quá, Capy không ôm hết nổi! Vui lòng nhập dưới 100 tỷ.');
      return;
    }

    setStep1Error(null);
    setShowSuccess(true);
  };

  const handleTemplateChange = (type: 'A' | 'B') => {
    setTemplate(type);
    if (type === 'A') {
      setJars({ ...DEFAULT_RATIOS });
    } else {
      setJars({ ...EMPTY_RATIOS });
    }
  };

  const handleJarPercentChange = (key: keyof JarRatio, valueText: string) => {
    // Only accept positive integers
    const clean = valueText.replace(/[^0-9]/g, '');
    const val = clean === '' ? 0 : parseInt(clean, 10);

    if (val > 100) return;

    setJars((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const getJarsTotal = (): number => {
    return jars.nec + jars.lt + jars.ffa + jars.edu + jars.play + jars.give;
  };

  const totalPercent = getJarsTotal();
  const step2Warning =
    totalPercent < 100
      ? `Còn ${100 - totalPercent}% chưa phân bổ, bạn điều chỉnh thêm nhé!`
      : totalPercent > 100
      ? `Bạn vượt quá ${totalPercent - 100}%`
      : null;

  const handleStep2Submit = () => {
    if (totalPercent !== 100) return;
    setStep(3);
    updateProgress(3);
  };

  const handleStep3Submit = (skip: boolean) => {
    const finalBalance = parseInt(balanceText.replace(/,/g, ''), 10) || 0;
    
    if (skip) {
      onComplete('', finalBalance, walletName.trim(), jars);
      return;
    }

    if (!selectedGoal) {
      setStep3Error('Vui lòng chọn mục tiêu hoặc nhấn bỏ qua.');
      return;
    }

    if (selectedGoal === 'Khác') {
      const trimmedCustom = customGoal.trim();
      if (!trimmedCustom) {
        setStep3Error('Vui lòng nhập mục tiêu của bạn.');
        return;
      }
      if (trimmedCustom.length > 50) {
        setStep3Error('Mục tiêu tối đa 50 ký tự thôi nha!');
        return;
      }
      onComplete(trimmedCustom, finalBalance, walletName.trim(), jars);
    } else {
      onComplete(selectedGoal, finalBalance, walletName.trim(), jars);
    }
  };

  const formatVND = (text: string) => {
    // Allow empty for backspace
    const isNegative = text.startsWith('-');
    const clean = text.replace(/[^0-9]/g, '');
    if (!clean) {
      setBalanceText(isNegative ? '-' : '');
      return;
    }
    const formatted = parseInt(clean, 10).toLocaleString('en-US');
    setBalanceText((isNegative ? '-' : '') + formatted);
  };

  const activeJarMeta = JARS_METADATA.find((m) => m.key === activeJarKey)!;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Tiến Trình */}
      {!showSuccess && (
        <View style={styles.header}>
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.stepIndicator}>Bước {step} trên 3</Text>
        </View>
      )}

      {showSuccess ? (
        <View style={styles.successContainer}>
          <CapyMascot type="success" />
          <Text style={styles.successTitle}>Tuyệt vời! 🦦</Text>
          <Text style={styles.successMessage}>
            🎉 Chúc mừng bạn đã tạo ví đầu tiên thành công! Cùng quản lý tài chính với chú capybara nào!
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Step 1: Tạo ví */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <CapyMascot type="thinking" />
              <Text style={styles.title}>Tạo ví đầu tiên của bạn</Text>
              <Text style={styles.subtitle}>
                Nhập số dư hiện tại trong ví tiền mặt hoặc tài khoản ngân hàng chính của bạn nhé.
              </Text>

              <View style={styles.formContainer}>
                <Text style={styles.label}>Tên ví</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ví của tôi"
                  placeholderTextColor="#A89A9B"
                  value={walletName}
                  onChangeText={setWalletName}
                  maxLength={50}
                />

                <Text style={[styles.label, { marginTop: 16 }]}>Số dư ban đầu (VND)</Text>
                <View style={styles.balanceInputContainer}>
                  <TextInput
                    style={styles.balanceInput}
                    placeholder="0"
                    placeholderTextColor="#A89A9B"
                    keyboardType="numeric"
                    value={balanceText}
                    onChangeText={formatVND}
                  />
                  <Text style={styles.currencyUnit}>VND</Text>
                </View>
              </View>

              {step1Error && <Text style={styles.errorText}>{step1Error}</Text>}

              <TouchableOpacity activeOpacity={0.8} style={styles.primaryButton} onPress={handleStep1Submit}>
                <Text style={styles.primaryButtonText}>Tạo ví nào! 🐾</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: 6 Hũ */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <CapyMascot type="jars" />
              <Text style={styles.title}>Công thức 6 Hũ Tài Chính</Text>
              <Text style={styles.subtitle}>
                Chọn mẫu phân bổ hũ tài chính của bạn. Bạn có thể tinh chỉnh lại phần trăm cho từng hũ.
              </Text>

              {/* Template selection buttons */}
              <View style={styles.templateSelection}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.templateButton, template === 'A' && styles.templateButtonActive]}
                  onPress={() => handleTemplateChange('A')}
                >
                  <Text style={[styles.templateButtonText, template === 'A' && styles.templateButtonTextActive]}>
                    Hũ mặc định
                  </Text>
                  {template === 'A' && <View style={styles.recommendedBadge}><Text style={styles.recommendedText}>Đề xuất</Text></View>}
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.templateButton, template === 'B' && styles.templateButtonActive]}
                  onPress={() => handleTemplateChange('B')}
                >
                  <Text style={[styles.templateButtonText, template === 'B' && styles.templateButtonTextActive]}>
                    Trống (Tự điền)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Jars inline edit layout */}
              <View style={styles.jarsGrid}>
                {JARS_METADATA.map((meta) => {
                  const key = meta.key as keyof JarRatio;
                  const percent = jars[key];
                  const isSelected = activeJarKey === key;

                  return (
                    <TouchableOpacity
                      key={key}
                      activeOpacity={0.8}
                      style={[
                        styles.jarRowCard,
                        { borderLeftColor: meta.color },
                        isSelected && styles.jarRowCardSelected,
                      ]}
                      onPress={() => setActiveJarKey(key)}
                    >
                      <View style={styles.jarRowInfo}>
                        <View style={[styles.colorIndicator, { backgroundColor: meta.color }]} />
                        <Text style={styles.jarRowName}>{meta.name}</Text>
                      </View>

                      <View style={styles.jarInputWrapper}>
                        <TextInput
                          style={styles.jarPercentInput}
                          placeholder={meta.label}
                          placeholderTextColor="#A89A9B"
                          keyboardType="numeric"
                          value={percent === 0 ? '' : percent.toString()}
                          onChangeText={(val) => handleJarPercentChange(key, val)}
                          maxLength={3}
                        />
                        <Text style={styles.percentSymbol}>%</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Active Jar Explanation */}
              <View style={styles.explanationBox}>
                <Text style={styles.explanationTitle}>
                  💡 {activeJarMeta.name} ({jars[activeJarKey]}%)
                </Text>
                <Text style={styles.explanationText}>{activeJarMeta.desc}</Text>
              </View>

              {/* Hint and Warning */}
              <View style={styles.warningContainer}>
                {step2Warning ? (
                  <Text style={styles.warningText}>{step2Warning}</Text>
                ) : (
                  <Text style={styles.successWording}>🎉 Tổng phân bổ đủ 100%! Sẵn sàng tiếp tục.</Text>
                )}
                <Text style={styles.hintText}>
                  Bạn có thể chỉnh lại tỷ lệ bất cứ lúc nào trong mục Ngân sách
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.primaryButton, totalPercent !== 100 && styles.disabledButton]}
                onPress={handleStep2Submit}
                disabled={totalPercent !== 100}
              >
                <Text style={styles.primaryButtonText}>Tiếp tục</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: Mục tiêu */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <CapyMascot type="success" />
              <Text style={styles.title}>Mục tiêu tài chính của bạn?</Text>
              <Text style={styles.subtitle}>Chọn mục tiêu phù hợp để Capy giúp bạn theo dõi nhé!</Text>

              <View style={styles.optionsContainer}>
                {SUGGESTED_GOALS.map((goal) => {
                  const isSelected = selectedGoal === goal;
                  return (
                    <TouchableOpacity
                      key={goal}
                      activeOpacity={0.8}
                      style={[styles.goalCard, isSelected && styles.goalCardSelected]}
                      onPress={() => {
                        setSelectedGoal(goal);
                        setStep3Error(null);
                      }}
                    >
                      <Text style={[styles.goalText, isSelected && styles.goalTextSelected]}>{goal}</Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.goalCard, selectedGoal === 'Khác' && styles.goalCardSelected]}
                  onPress={() => {
                    setSelectedGoal('Khác');
                    setStep3Error(null);
                  }}
                >
                  <Text style={[styles.goalText, selectedGoal === 'Khác' && styles.goalTextSelected]}>Khác</Text>
                </TouchableOpacity>

                {selectedGoal === 'Khác' && (
                  <TextInput
                    style={styles.customGoalInput}
                    placeholder="Nhập mục tiêu khác của bạn..."
                    placeholderTextColor="#A89A9B"
                    value={customGoal}
                    onChangeText={setCustomGoal}
                    maxLength={100}
                  />
                )}
              </View>

              {step3Error && <Text style={styles.errorText}>{step3Error}</Text>}

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.secondaryButton}
                  onPress={() => handleStep3Submit(true)}
                >
                  <Text style={styles.secondaryButtonText}>Bỏ qua, làm sau</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.accentButton}
                  onPress={() => handleStep3Submit(false)}
                >
                  <Text style={styles.accentButtonText}>Xong! Bắt đầu thôi!</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F7',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#FFE5E2',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF8C8C',
    borderRadius: 4,
  },
  stepIndicator: {
    marginTop: 8,
    fontSize: 12,
    color: '#8A7A7B',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  stepContainer: {
    alignItems: 'center',
    paddingTop: 12,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A3E3F',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8A7A7B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFE5E2',
    shadowColor: '#4A3E3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A3E3F',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFF8F7',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE5E2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#4A3E3F',
    fontWeight: '600',
  },
  balanceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F7',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE5E2',
    paddingHorizontal: 16,
  },
  balanceInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    color: '#4A3E3F',
    fontWeight: 'bold',
  },
  currencyUnit: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF8C8C',
    marginLeft: 8,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#20E3B2',
    shadowColor: '#20E3B2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 24,
  },
  disabledButton: {
    backgroundColor: '#D1C7C8',
    shadowColor: 'transparent',
    elevation: 0,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  templateSelection: {
    flexDirection: 'row',
    backgroundColor: '#FFE5E2',
    borderRadius: 20,
    padding: 4,
    width: '100%',
    marginBottom: 20,
  },
  templateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 16,
  },
  templateButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#4A3E3F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  templateButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A7A7B',
  },
  templateButtonTextActive: {
    color: '#4A3E3F',
  },
  recommendedBadge: {
    backgroundColor: '#FF8C8C',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  recommendedText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  jarsGrid: {
    width: '100%',
    gap: 10,
    marginBottom: 16,
  },
  jarRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FFE5E2',
    borderLeftWidth: 5,
  },
  jarRowCardSelected: {
    borderColor: '#4A3E3F',
    borderLeftWidth: 5,
  },
  jarRowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  jarRowName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A3E3F',
  },
  jarInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE5E2',
    paddingHorizontal: 10,
    width: 90,
  },
  jarPercentInput: {
    flex: 1,
    textAlign: 'right',
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A3E3F',
  },
  percentSymbol: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A7A7B',
    marginLeft: 4,
  },
  explanationBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FFE5E2',
    marginBottom: 20,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A3E3F',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 12,
    color: '#8A7A7B',
    lineHeight: 16,
  },
  warningContainer: {
    width: '100%',
    alignItems: 'center',
  },
  warningText: {
    color: '#E84545',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  successWording: {
    color: '#20E3B2',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  hintText: {
    color: '#8A7A7B',
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FFE5E2',
    alignItems: 'center',
    shadowColor: '#4A3E3F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  goalCardSelected: {
    borderColor: '#FF8C8C',
    backgroundColor: '#FFF4F3',
  },
  goalText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A3E3F',
  },
  goalTextSelected: {
    color: '#FF8C8C',
  },
  customGoalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FF8C8C',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#4A3E3F',
    fontWeight: '600',
    marginTop: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 32,
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFE5E2',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#8A7A7B',
  },
  accentButton: {
    flex: 1.5,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF8C8C',
    shadowColor: '#FF8C8C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  accentButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  errorText: {
    color: '#E84545',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
    width: '100%',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A3E3F',
    marginTop: 20,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 15,
    color: '#8A7A7B',
    textAlign: 'center',
    lineHeight: 22,
  },
});
