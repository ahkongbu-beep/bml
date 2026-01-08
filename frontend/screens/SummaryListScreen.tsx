import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useSummaries } from '../libs/hooks/useSummaries';
import { useAuth } from '../libs/contexts/AuthContext';
import { formatDate } from '../libs/utils/common';
import Layout from '@/components/Layout';

export default function SummaryListScreen({ navigation }: any) {
  const { user } = useAuth();
  const { summaryData, isLoading, error, refetch } = useSummaries({ userHash: user?.view_hash || '', model: 'FeedsImages' });

  const handleSummaryPress = (item: any) => {
    console.log('Summary item pressed:', item.answer);
  }
  if (isLoading) {
    return (
      <Layout>
        <View style={styles.container}>
          <Header title="AI 요약" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF9AA2" />
          </View>
        </View>
      </Layout>
    );
  }

  console.log("SummaryListScreen summaryData", summaryData);
  const summary = summaryData.summaries || [];
  const totalCount = summaryData.total || 0;

  return (
    <Layout>
      <Text>Summary List Screen</Text>
      <View style={styles.container}>
        <Header title="AI 요약" />
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {summary && totalCount > 0 ? (
              summary.map((item, key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.noticeCard,
                    item.is_important === 'Y' && styles.importantCard,
                  ]}
                  onPress={() => handleSummaryPress(item)}
                >
                  <Text style={styles.noticeTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.summaryQuestion} numberOfLines={3}>
                    <Ionicons name="help-circle-outline" size={18} color="red" />
                    {item.question}
                  </Text>
                  <View style={styles.noticeFooter}>
                    <Text style={styles.noticeDate}>{formatDate(item.created_at)}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#CCC" />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={64} color="#DDD" />
                <Text style={styles.emptyText}>저장한 ai 요약이 없습니다</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF7',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  importantCard: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF9AA2',
    borderWidth: 2,
  },
  summaryQuestion: {
    fontWeight: '700',
    color: '#333',
    paddingRight: 10,
    marginBottom: 4,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  importantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  importantBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoryBadge: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9AA2',
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
  noticeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noticeDate: {
    fontSize: 13,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});
