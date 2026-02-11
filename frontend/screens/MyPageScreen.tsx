import React, { useState } from 'react';
import styles from './MyPageScreen.styles';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useAuth } from '../libs/contexts/AuthContext';
import { useMyFeeds } from '../libs/hooks/useFeeds';
import { useGetMyInfo } from '../libs/hooks/useUsers';
import MyFeedGrid from '../components/MyFeedGrid';
import { LoadingPage } from '../components/Loading';
import Layout from '../components/Layout';
import { getStaticImage } from '../libs/utils/common';

export default function MyPageScreen({ navigation }: any) {
  const { user, isLoading } = useAuth();
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');

  if (isLoading) {
    return (
      <LoadingPage title="화면을 구성하는 중" />
    );
  }

  if (!user) {
    return (
      <Layout>
        <View style={styles.container}>
          <Header title="마이페이지" showMenu={true} />
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>사용자 정보를 불러올 수 없습니다.</Text>
          </View>
        </View>
      </Layout>
    );
  }

  const { data: myFeedsData, isLoading: feedsLoading } = useMyFeeds();
  const { data: myInfoData, isLoading: myInfoLoading } = useGetMyInfo(user?.view_hash || '');
  const myFeeds = myFeedsData?.data || [];

  return (
    <Layout>
      <View style={styles.container}>
        <Header title="마이페이지" showMenu={true} />
        <ScrollView style={styles.content}>
          {/* 프로필 섹션 */}
          <View style={styles.profileSection}>
            <Image
              source={{
                uri: getStaticImage('small', user.profile_image) || ''
              }}
              style={styles.profileImage}
            />
            <Text style={styles.nickname}>{user.nickname || 'unknown'}</Text>
            <Text style={styles.email}>{user.email}</Text>
            {user.description && (
              <Text style={styles.description}>{user.description}</Text>
            )}

            {/* 통계 */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{myInfoLoading ? 0 : (myInfoData?.feed_count || 0)}</Text>
                <Text style={styles.statLabel}>피드</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('FeedLikeList')}
                >
                    <Text style={styles.statNumber}>{myInfoLoading ? 0 : (myInfoData?.like_count || 0)}</Text>
                    <Text style={styles.statLabel}>좋아요</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('MealPlan')}
                >
                  <Text style={styles.statNumber}>{myInfoLoading ? 0 : (myInfoData?.meal_count || 0)}</Text>
                  <Text style={styles.statLabel}>식단</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 피드 작성 버튼 */}
            <TouchableOpacity
              style={styles.createFeedButton}
              onPress={() => navigation.navigate('FeedSave')}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.createFeedButtonText}>피드 작성하기</Text>
            </TouchableOpacity>
          </View>

          {/* 내 피드 섹션 */}
          <View style={styles.myFeedsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>내 피드</Text>
              <TouchableOpacity onPress={() => setViewType(viewType === 'grid' ? 'list' : 'grid')}>
                <Ionicons
                  name={viewType === 'grid' ? 'list-outline' : 'grid-outline'}
                  size={26}
                  color="#FF9AA2"
                />
              </TouchableOpacity>
            </View>

            <MyFeedGrid
              feeds={myFeeds}
              isLoading={feedsLoading}
              viewType={viewType}
              onFeedPress={(feedId) => navigation.navigate('FeedDetail', { feedId })}
            />
          </View>
        </ScrollView>
      </View>
    </Layout>
  );
}
