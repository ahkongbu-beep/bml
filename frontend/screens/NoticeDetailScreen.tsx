import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '@/components/Layout';
import Header from '../components/Header';
import { useNoticeDetail } from '../libs/hooks/useNotices';

export default function NoticeDetailScreen({ route, navigation }: any) {
  const { notice } = route.params;
  const { noticeDetail, isLoading } = useNoticeDetail(notice.view_hash);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  if (isLoading || !noticeDetail) {
    return (
      <Layout>
        <View style={styles.container}>
          <Header
            title="공지사항"
            showBack={true}
            onBackPress={() => navigation.goBack()}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF9AA2" />
          </View>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <View style={styles.container}>
        <Header
          title="공지사항"
          showBack={true}
          onBackPress={() => navigation.goBack()}
        />
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {/* 헤더 정보 */}
            <View style={styles.headerSection}>
              <View style={styles.badgeContainer}>
                {noticeDetail.is_important === 'Y' && (
                  <View style={styles.importantBadge}>
                    <Ionicons name="megaphone" size={14} color="#FFFFFF" />
                    <Text style={styles.importantBadgeText}>중요</Text>
                  </View>
                )}
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{noticeDetail.category_text}</Text>
                </View>
              </View>

              <Text style={styles.title}>{noticeDetail.title}</Text>

              <View style={styles.metaInfo}>
                <View style={styles.metaRow}>
                  <Ionicons name="person-circle-outline" size={16} color="#999" />
                  <Text style={styles.metaText}>{noticeDetail.admin_name}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={16} color="#999" />
                  <Text style={styles.metaText}>{formatDate(noticeDetail.created_at)}</Text>
                </View>
              </View>
            </View>

            {/* 구분선 */}
            <View style={styles.divider} />

            {/* 내용 */}
            <View style={styles.contentSection}>
              <Text style={styles.contentText}>{noticeDetail.content}</Text>
            </View>
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
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    marginBottom: 20,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    lineHeight: 30,
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#999',
  },
  divider: {
    height: 1,
    backgroundColor: '#FFE5E5',
    marginBottom: 20,
  },
  contentSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contentText: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 26,
  },
});
