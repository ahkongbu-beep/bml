import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from './Layout';
import Header from './Header';

export function ErrorPage({ message, subMessage, refetch }: { message: string, subMessage?: string, refetch?: () => void }) {
  const appName = process.env.EXPO_PUBLIC_APP_NAME || "";
  return (
    <Layout>
      <Header title={appName} showMenu={true} />
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#FF9AA2" />
        <Text style={styles.errorText}>{message}</Text>
        <Text style={styles.errorSubText}>{subMessage || '네트워크 연결을 확인해주세요'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch && refetch()}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#4A4A4A',
    fontWeight: '700',
  },
  errorSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#FF9AA2',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#FF9AA2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});


export default ErrorPage;