import React from 'react';
import styles from './NoticeScreen.styles';
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
import { LoadingPage } from '../components/Loading';
import { formatDate } from '@/libs/utils/common';

export default function NoticeScreen({ navigation }: any) {
  const { notices, isLoading } = useNotices('active');

  const handleNoticePress = (notice: Notice) => {
    navigation.navigate('NoticeDetail', { notice });
  };

  if (isLoading) {
    return (
      <LoadingPage title="공지사항을 불러오는 중" />
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
                    <Text style={styles.noticeDate}>{formatDate(notice.created_at, "YYYY-MM-DD")}</Text>
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
