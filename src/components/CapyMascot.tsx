import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text, StyleProp, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

interface CapyMascotProps {
  type: 'thinking' | 'jars' | 'success';
  style?: StyleProp<ViewStyle>;
  loop?: boolean;
  autoPlay?: boolean;
}

const mascotAnimations = {
  thinking: require('../../assets/animations/capy-thinking.json'),
  jars: require('../../assets/animations/capy-jars.json'),
  success: require('../../assets/animations/capy-success.json'),
};

const mascotEmoji = {
  thinking: '🤔🦦',
  jars: '📦🦦',
  success: '😎🦦',
};

export default function CapyMascot({ type, style, loop = true, autoPlay = true }: CapyMascotProps) {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (autoPlay) {
      animationRef.current?.play();
    }
  }, [type, autoPlay]);

  // Kiểm tra nếu là file Lottie trống (layers là empty array), ta hiển thị mascot dự phòng
  const source = mascotAnimations[type];
  const isPlaceholder = !source || !source.layers || source.layers.length === 0;

  if (isPlaceholder) {
    const flatStyle = StyleSheet.flatten(style) || {};
    const w = typeof flatStyle.width === 'number' ? flatStyle.width : 140;
    const h = typeof flatStyle.height === 'number' ? flatStyle.height : 140;
    const size = Math.min(w, h);
    const circleSizeStyle = {
      width: size,
      height: size,
      borderRadius: size / 2,
    };
    const fontSizeStyle = {
      fontSize: size * 0.37,
    };
    const showSubText = size >= 100;

    return (
      <View style={[styles.fallbackContainer, style]}>
        <View style={[styles.fallbackCircle, circleSizeStyle]}>
          <Text style={[styles.fallbackText, fontSizeStyle]}>{mascotEmoji[type]}</Text>
        </View>
        {showSubText && (
          <Text style={styles.fallbackSubText}>[Capy mascot động ({type}) đang chờ bạn import file JSON real]</Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <LottieView
        ref={animationRef}
        source={source}
        style={styles.animation}
        loop={loop}
        autoPlay={autoPlay}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: 220,
    height: 220,
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  fallbackCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFE5E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF8C8C',
    shadowColor: '#4A3E3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  fallbackText: {
    fontSize: 52,
  },
  fallbackSubText: {
    marginTop: 10,
    fontSize: 10,
    color: '#8A7A7B',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
