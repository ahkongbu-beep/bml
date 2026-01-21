import React, { useState } from 'react';
import styles from './SummaryListScreen.styles';
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
import AiSummaryAnswerModal from '../components/AiSummaryAnswerModal';
import { useSummaries } from '../libs/hooks/useSummaries';
import { useAuth } from '../libs/contexts/AuthContext';
import { formatDate } from '../libs/utils/common';
import { LoadingPage } from '../components/Loading';
import Layout from '@/components/Layout';

export default function SummaryListScreen({ navigation }: any) {
  const { user } = useAuth();
  const { summaryData, isLoading, error, refetch } = useSummaries({ model: 'FeedsImages' });
  const [answerLayer, setAnswerLayer] = useState(false);
  const [answerData, setAnswerData] = useState<any>(null);

  const handleSummaryPress = (item: any) => {
    setAnswerLayer(true);
    setAnswerData(item);
  };

  const handleCloseAnswer = () => {
    setAnswerLayer(false);
    setAnswerData(null);
  };

  if (isLoading) {
    return (
      <LoadingPage title="AI 요약을 불러오는 중" />
    );
  }

  const summary = summaryData.summaries || [];
  const totalCount = summaryData.total || 0;

  return (
    <Layout>
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

        {/* AI 답변 모달 */}
        <AiSummaryAnswerModal
          visible={answerLayer}
          onClose={handleCloseAnswer}
          question={answerData?.question || ''}
          answer={answerData?.answer || ''}
          title={answerData?.title || 'AI 요약'}
        />
      </View>
    </Layout>
  );
}