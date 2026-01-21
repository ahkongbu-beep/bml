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


export function LoadingPage({title}: {title?: string}) {
  const appName = process.env.EXPO_PUBLIC_APP_NAME || "";
  return (
    <Layout>
      <Header title={appName} showMenu={true} />
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF9AA2" />
        <Text style={styles.loadingText}>{title}...</Text>
      </View>
    </Layout>
  )
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4A4A4A',
    fontWeight: '500',
  },
});

export default LoadingPage;