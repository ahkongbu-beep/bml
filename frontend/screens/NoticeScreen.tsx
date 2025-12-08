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
import { useNotices } from '../libs/hooks/useNotices';
import Layout from '@/components/Layout';

export default function NoticeScreen({ navigation }: any) {
  const { notices, isLoading } = useNotices('active');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const handleNoticePress = (notice: Notice) => {
    navigation.navigate('NoticeDetail', { notice });
  };

  if (isLoading) {
    return (
      <Layout>
        <View style={styles.container}>
          <Header title="공지사항" />
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
        <Header title="공지사항" />
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {notices && notices.length > 0 ? (
              notices.map((notice) => (
                <TouchableOpacity
                  key={notice.view_hash}
                  style={[
                    styles.noticeCard,
                    notice.is_important === 'Y' && styles.importantCard,
                  ]}
                  onPress={() => handleNoticePress(notice)}
                >
                  <View style={styles.noticeHeader}>
                    {notice.is_important === 'Y' && (
                      <View style={styles.importantBadge}>
                        <Ionicons name="megaphone" size={14} color="#FFFFFF" />
                        <Text style={styles.importantBadgeText}>중요</Text>
                      </View>
                    )}
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{notice.category_text}</Text>
                    </View>
                  </View>
                  <Text style={styles.noticeTitle} numberOfLines={2}>
                    {notice.title}
                  </Text>
                  <View style={styles.noticeFooter}>
                    <Text style={styles.noticeDate}>{formatDate(notice.created_at)}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#CCC" />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={64} color="#DDD" />
                <Text style={styles.emptyText}>등록된 공지사항이 없습니다</Text>
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
