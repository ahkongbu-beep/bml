/*
 * 피드 좋아요 리스트 화면
 * ㅇ 작성자: 임영민
 * ㅇ 작성일: 2025-12-18
 * ㅇ 설명: 피드에 좋아요를 누른 사용자들의 리스트를 보여주는 화면
           세로 리스트형태로 노출되며 30개씩 페이징 처리하여 보여줌
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import styles from './FeedLikeListScreen.styles';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { useToggleLike, useLikedFeeds, mealKeys } from '../libs/hooks/useMeals';
import { useAuth } from '../libs/contexts/AuthContext';
import { formatDate, getStaticImage } from '@/libs/utils/common';
import { LikedFeed } from '../libs/types/FeedType';
import { toastSuccess } from '@/libs/utils/toast';

interface LikedFeedItem extends LikedFeed {}

export default function FeedLikeListScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [allFeeds, setAllFeeds] = useState<LikedFeedItem[]>([]);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const limit = 30;

  // 좋아요한 피드 목록 조회 (초기 로드만)
  // 항상 offset 0으로 초기 데이터만 가져옴
  const { data: likedFeeds, isLoading, isError, refetch } = useLikedFeeds(limit, 0);
  // 좋아요 토글 mutation
  const toggleLikeMutation = useToggleLike();

  // 좋아요 취소 핸들러
  const handleToggleLike = useCallback((mealHash: string, e: any) => {
    e.stopPropagation(); // 피드 상세로 이동하는 것 방지
    if (!user?.view_hash) return;
    setAllFeeds(prev => prev.filter(meal => meal.like_hash !== mealHash));
    toggleLikeMutation.mutate(mealHash, {
      onSuccess: () => {
        // 로컬 상태에서 해당 피드 제거
        toastSuccess('반영되었습니다.');
      },
      onError: (error) => {
        console.error('Toggle like error:', error);
      },
    });
  }, [user?.view_hash, toggleLikeMutation]);

  // 초기 로딩 시 데이터 설정
  React.useEffect(() => {
    if (likedFeeds) {
      setAllFeeds(likedFeeds);
    }
  }, [likedFeeds]);

  // 새로고침
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await refetch();
      if (result.data) {
        setAllFeeds(result.data);
      } else {
        setAllFeeds([]);
      }
    } catch (error) {
      setAllFeeds([]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // 더 많은 데이터 로드
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || allFeeds.length < limit) {
      return;
    }

    setIsLoadingMore(true);
    const newOffset = allFeeds.length;

    try {
      const result = await getLikedFeeds(limit, newOffset);

      if (result && result.length > 0) {
        setAllFeeds(prev => [...prev, ...result]);
      }
    } catch (error) {
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, allFeeds.length, limit]);

  // 피드 상세로 이동
  const handleFeedPress = (mealHash: string, userHash: string) => {
    if (user.view_hash === userHash) {
      navigation.navigate('MealMyDetail', { mealHash, userHash: userHash });
    } else {
      navigation.navigate('MealUserDetail', { mealHash, userHash: userHash });
    }
  };

  // 렌더링: 각 피드 아이템
  const renderFeedItem = ({ item }: { item: LikedFeedItem }) => {
    const imageUrl = item.image_url
      ? getStaticImage('medium', item.image_url)
      : null;

    return (
      <TouchableOpacity
        style={styles.feedItem}
        onPress={() => handleFeedPress(item.like_hash, item.user_hash)}
        activeOpacity={0.7}
      >
        {imageUrl && (
          <Image
            source={{ uri: imageUrl || '' }}
            style={styles.feedImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.feedContent}>
          <Text style={styles.feedDescription} numberOfLines={2}>
            {item.contents}
          </Text>
          <View style={styles.feedFooter}>
            <View style={styles.likeInfo}>
              <Ionicons name="heart" size={16} color="#FF6B6B" />
              <Text style={styles.likedAtText}>
                {formatDate(item.liked_at)}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.likeButton}
          onPress={(e) => handleToggleLike(item.like_hash, e)}
          activeOpacity={0.7}
        >
          <Ionicons name="heart" size={24} color="#FF6B6B" />
        </TouchableOpacity>

        <Ionicons
          name="chevron-forward"
          size={20}
          color="#999"
          style={styles.chevron}
        />
      </TouchableOpacity>
    );
  };

  // 로딩 중
  if (isLoading && allFeeds.length === 0) {
    return (
      <Layout>
        <Header
          title="좋아요한 피드"
          showBack
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      </Layout>
    );
  }
  // 에러
  if (isError) {
    return (
      <Layout>
        <Header
          title="좋아요한 피드"
          showBack
          onBackPress={() => navigation.goBack()}
        />
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          <Text style={styles.errorText}>데이터를 불러오는 중 오류가 발생했습니다.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </ScrollView>
      </Layout>
    );
  }

  // 데이터가 없을 때 (로딩이 완료된 후에만 체크)
  if (!isLoading && (!allFeeds || allFeeds.length === 0)) {
    return (
      <Layout>
        <Header
          title="좋아요한 피드"
          showBack
          onBackPress={() => navigation.goBack()}
        />
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          <Ionicons name="heart-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>좋아요한 피드가 없습니다.</Text>
        </ScrollView>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header
        title="좋아요한 피드"
        showBack
        onBackPress={() => navigation.goBack()}
      />
      <FlatList
        data={allFeeds}
        keyExtractor={(item, index) => `${item.feed_id}-${index}`}
        renderItem={renderFeedItem}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#4A90E2" />
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContainer}
      />
    </Layout>
  );
}
