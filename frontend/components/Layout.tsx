import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

interface LayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function Layout({ children, style }: LayoutProps) {
  return (
    <SafeAreaView style={[styles.container, style]} edges={['top']}>
      <StatusBar style="dark" translucent />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF7',
  },
});
