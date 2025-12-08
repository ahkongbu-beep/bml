import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    // 2초 후 스플래시 종료
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>BML</Text>
        <Text style={styles.subtitle}>Baby Meal List</Text>
      </View>
      <ActivityIndicator size="large" color="#FF9AA2" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FF9AA2',
    letterSpacing: 4,
    textShadowColor: '#FFE5E5',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#4A4A4A',
    marginTop: 12,
    letterSpacing: 2,
  },
  loader: {
    marginTop: 20,
  },
});
