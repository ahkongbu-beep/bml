import React from 'react';
import styles from './NoticeDetailScreen.styles';
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
import { LoadingPage } from '../components/Loading';

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
      <LoadingPage title="공지사항을 불러오는 중" />
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
