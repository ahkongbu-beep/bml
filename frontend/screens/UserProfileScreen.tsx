/*
 * 타인의 프로필을 확인하는 페이지
 * MyPageScreen과 유사하지만, 다른 사용자의 정보를 보여줌
 */
import React, { useState, useEffect } from 'react';
import styles from './FeedListScreen.styles';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useAuth } from '../libs/contexts/AuthContext';
import { useUserFeeds } from '../libs/hooks/useFeeds';
import { useGetUserProfile } from '../libs/hooks/useUsers';
import { useBlockUser } from '../libs/hooks/useFeeds';
import MyFeedGrid from '../components/MyFeedGrid';
import Layout from '../components/Layout';
import { LoadingPage } from '../components/Loading';
import { ErrorPage } from '../components/ErrorPage';

export default function UserProfileScreen({ route, navigation }: any) {
  const { userHash } = route.params; // 조회할 사용자 Hash
  const { user: currentUser } = useAuth();
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');

  // 사용자 프로필 조회
  const { data: userProfile, isLoading: profileLoading, error: profileError } = useGetUserProfile(userHash);
  // 사용자의 피드 목록 조회
  const { data: userFeedsData, isLoading: feedsLoading } = useUserFeeds(userHash);
  // 피드 데이터
  const userFeeds = userFeedsData?.data || [];
  // 차단 mutation
  const blockUserMutation = useBlockUser();

  // 본인 프로필인 경우 MyPage로 이동
  useEffect(() => {
    if (currentUser?.view_hash === userHash) {
      navigation.replace('MyPage');
    }
  }, [currentUser?.view_hash, userHash, navigation]);

  const handleBlockUser = () => {
    if (!userProfile?.view_hash) return;

    Alert.alert(
      '사용자 차단',
      `${userProfile.nickname}님을 차단하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '차단',
          style: 'destructive',
          onPress: () => {
            blockUserMutation.mutate(userProfile.view_hash, {
              onSuccess: () => {
                Alert.alert('차단 완료', `${userProfile.nickname}님을 차단했습니다.`);
                navigation.goBack();
              },
              onError: (error) => {
                Alert.alert('오류', '차단 처리 중 오류가 발생했습니다.');
              },
            });
          },
        },
      ]
    );
  };

  if (profileLoading && feedsLoading) {
    return (
      <LoadingPage title="프로필을 불러오는 중" />
    );
  }

  // 에러 상태
  if (profileError || !userProfile) {
    return (
      <ErrorPage
        message="프로필을 불러오는 중 오류가 발생했습니다."
        refetch={() => { navigation.replace('UserProfile', { userHash }) }}
      />
    );
  }

  return (
    <Layout>
      <View style={styles.container}>
        <Header title="프로필" showBack={true} />
        <ScrollView style={styles.content}>
          {/* 프로필 섹션 */}
          <View style={styles.profileSection}>
            <Image
              source={{
                uri: userProfile.profile_image || 'https://i.pravatar.cc/200?img=5'
              }}
              style={styles.profileImage}
            />
            <Text style={styles.nickname}>{userProfile.nickname || 'unknown'}</Text>
            <Text style={styles.email}>{userProfile.email}</Text>
            {userProfile.description && (
              <Text style={styles.description}>{userProfile.description}</Text>
            )}

            {/* 통계 */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userProfile.feed_count || 0}</Text>
                <Text style={styles.statLabel}>피드</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userProfile.like_count || 0}</Text>
                <Text style={styles.statLabel}>좋아요</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userProfile.meal_count || 0}</Text>
                <Text style={styles.statLabel}>식단</Text>
              </View>
            </View>

            {/* 액션 버튼들 */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.followButton}
                onPress={() => Alert.alert('알림', '팔로우 기능은 준비 중입니다.')}
              >
                <Ionicons name="person-add-outline" size={20} color="#fff" />
                <Text style={styles.followButtonText}>팔로우</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.messageButton}
                onPress={() => Alert.alert('알림', '메시지 기능은 준비 중입니다.')}
              >
                <Ionicons name="mail-outline" size={20} color="#FF9AA2" />
                <Text style={styles.messageButtonText}>메시지</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.moreButton}
                onPress={handleBlockUser}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color="#7A7A7A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 사용자 피드 섹션 */}
          <View style={styles.myFeedsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {userProfile.nickname}님의 피드
              </Text>
              <TouchableOpacity onPress={() => setViewType(viewType === 'grid' ? 'list' : 'grid')}>
                <Ionicons
                  name={viewType === 'grid' ? 'list-outline' : 'grid-outline'}
                  size={26}
                  color="#FF9AA2"
                />
              </TouchableOpacity>
            </View>

            <MyFeedGrid
              feeds={userFeeds}
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
