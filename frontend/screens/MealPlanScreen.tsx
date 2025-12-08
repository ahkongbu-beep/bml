import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Header from '../components/Header';
import Layout from '@/components/Layout';
export default function MealPlanScreen() {
  return (
    <Layout>
      <View style={styles.container}>
      <Header title="식단 관리" />
      <ScrollView style={styles.content}>
          <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>식단 관리 화면</Text>
          <Text style={styles.placeholderSubtext}>
              주단위/월단위 식단표를 계획하고 관리할 수 있습니다.
          </Text>
          </View>
      </ScrollView>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
