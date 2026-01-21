import React, { useEffect } from 'react';
import styles from './SplashScreen.styles';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const appName = process.env.EXPO_PUBLIC_APP_NAME || "";
  const appSubtitle = process.env.EXPO_PUBLIC_APP_SUBTITLE || "";

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
        <Text style={styles.logo}>{appName}</Text>
        <Text style={styles.subtitle}>{appSubtitle}</Text>
      </View>
      <ActivityIndicator size="large" color="#FF9AA2" style={styles.loader} />
    </View>
  );
}
