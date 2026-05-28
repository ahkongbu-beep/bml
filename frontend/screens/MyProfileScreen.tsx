import React, { useState, useCallback } from 'react';
import styles from '../styles/screens/MyProfileScreen.styles';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useAuth } from '../libs/contexts/AuthContext';
import { useMyFeeds, useScraps } from '../libs/hooks/useFeeds';
import MyFeedGrid from '../components/MyFeedGrid';
import ScrapGrid from '../components/ScrapGrid';
import { LoadingPage } from '../components/Loading';
import Layout from '../components/Layout';
import { getStaticImage } from '../libs/utils/common';

export default function MyProfileScreen({ navigation }: any) {
  const { user, isLoading } = useAuth();
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'myFeeds' | 'scraps'>('myFeeds');

  // 훅은 항상 최상단에서 조건 없이 호출해야 함 (Rules of Hooks)
  const { data: myFeedsData, isLoading: feedsLoading, refetch: refetchFeeds } = useMyFeeds();
  const { data: scrapsData, isLoading: scrapsLoading, refetch: refetchScraps } = useScraps();

  const myFeeds = Array.isArray(myFeedsData?.data) ? myFeedsData.data : [];
  const scraps = Array.isArray(scrapsData?.data) ? scrapsData.data : [];

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refetchFeeds(), refetchScraps()]);
    setIsRefreshing(false);
  }, [refetchFeeds, refetchScraps]);

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

  return (
    <Layout>
      <View style={styles.container}>
        <Header title="마이페이지" showMenu={true} />
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#FF9AA2"
              colors={['#FF9AA2']}
            />
          }
        >
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

            {/* 피드 작성 버튼 */}
            <TouchableOpacity
              style={styles.createFeedButton}
              onPress={() => navigation.navigate('MealRegist')}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.createFeedButtonText}>식단캘린더 작성하기</Text>
            </TouchableOpacity>
          </View>

          {/* 내 피드 섹션 */}
          <View style={styles.myFeedsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'myFeeds' && styles.tabActive]}
                  onPress={() => setActiveTab('myFeeds')}
                >
                  <Text style={[styles.tabText, activeTab === 'myFeeds' && styles.tabTextActive]}>
                    내 피드
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'scraps' && styles.tabActive]}
                  onPress={() => setActiveTab('scraps')}
                >
                  <Text style={[styles.tabText, activeTab === 'scraps' && styles.tabTextActive]}>
                    스크랩
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => setViewType(viewType === 'grid' ? 'list' : 'grid')}>
                <Ionicons
                  name={viewType === 'grid' ? 'list-outline' : 'grid-outline'}
                  size={26}
                  color="#FF9AA2"
                />
              </TouchableOpacity>
            </View>

            {activeTab === 'myFeeds' && (
              <MyFeedGrid
                meals={myFeeds}
                isLoading={feedsLoading}
                viewType={viewType}
                onFeedPress={(mealHash) => navigation.navigate('MealMyDetail', { userHash: user.view_hash, mealHash })}
              />
            )}

            {activeTab === 'scraps' && (
              <ScrapGrid
                scraps={scraps}
                isLoading={scrapsLoading}
                onScrapPress={(mealHash, userHash) => navigation.navigate('MealUserDetail', { userHash, mealHash })}
              />
            )}
          </View>
        </ScrollView>
      </View>
    </Layout>
  );
}
