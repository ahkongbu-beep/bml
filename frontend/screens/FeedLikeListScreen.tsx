/*
 * 피드 좋아요 리스트 화면
 * ㅇ 작성자: 임영민
 * ㅇ 작성일: 2025-12-18
 * ㅇ 설명: 피드에 좋아요를 누른 사용자들의 리스트를 보여주는 화면
            세로 리스트형태로 노출되며 30개씩 페이징 처리하여 보여줌
 * ㅇ 샘플 데이터:
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { useLikedFeeds, useToggleLike } from '../libs/hooks/useFeeds';
import { useAuth } from '../libs/contexts/AuthContext';
import { formatDate } from '@/libs/utils/common';
import { LikedFeed } from '../libs/types/FeedType';

const { width } = Dimensions.get('window');
const API_BASE_URL = process.env.STATIC_BASE_URL || 'http://172.30.1.3:8000';

interface LikedFeedItem extends LikedFeed {}

export default function FeedLikeListScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [allFeeds, setAllFeeds] = useState<LikedFeedItem[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const limit = 30;

  // 좋아요한 피드 목록 조회 (초기 로드만)
  const { data: likedFeeds, isLoading, isError, refetch } = useLikedFeeds(
    user?.view_hash || '',
    limit,
    0  // 항상 offset 0으로 초기 데이터만 가져옴
  );

  // 좋아요 토글 mutation
  const toggleLikeMutation = useToggleLike();

  // 좋아요 취소 핸들러
  const handleToggleLike = useCallback((feedId: number, e: any) => {
    e.stopPropagation(); // 피드 상세로 이동하는 것 방지

    if (!user?.view_hash) return;

    toggleLikeMutation.mutate(
      { feedId, userHash: user.view_hash },
      {
        onSuccess: () => {
          // 로컬 상태에서 해당 피드 제거
          setAllFeeds(prev => prev.filter(feed => feed.feed_id !== feedId));
        },
        onError: (error) => {
          console.error('Toggle like error:', error);
        },
      }
    );
  }, [user?.view_hash, toggleLikeMutation]);

  // 초기 로딩 시 데이터 설정
  React.useEffect(() => {
    console.log('likedFeeds data:', likedFeeds);
    console.log('isLoading:', isLoading);
    if (likedFeeds) {
      console.log('Setting allFeeds with:', likedFeeds.length, 'items');
      setAllFeeds(likedFeeds);
    }
  }, [likedFeeds]);

  // 새로고침
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/feeds/like/list?user_hash=${user?.view_hash}&limit=${limit}&offset=0`
      );
      const result = await response.json();

      if (result.data) {
        setAllFeeds(result.data);
      } else {
        setAllFeeds([]);
      }
    } catch (error) {
      console.error('Refresh error:', error);
      setAllFeeds([]);
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.view_hash, limit]);

  // 더 많은 데이터 로드
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || allFeeds.length < limit) {
      return;
    }

    setIsLoadingMore(true);
    const newOffset = allFeeds.length;

    try {
      // 다음 페이지 데이터를 가져오기 위해 새로운 쿼리 실행
      const response = await fetch(
        `${API_BASE_URL}/feeds/like/list?user_hash=${user?.view_hash}&limit=${limit}&offset=${newOffset}`
      );
      const result = await response.json();

      if (result.data && result.data.length > 0) {
        setAllFeeds(prev => [...prev, ...result.data]);
      }
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, allFeeds.length, limit, user?.view_hash]);

  // 피드 상세로 이동
  const handleFeedPress = (feedId: number) => {
    navigation.navigate('FeedDetail' as never, { feedId } as never);
  };

  // 렌더링: 각 피드 아이템
  const renderFeedItem = ({ item }: { item: LikedFeedItem }) => {
    const imageUrl = item.feed_image_url
      ? `${API_BASE_URL}${item.feed_image_url}`
      : null;

    return (
      <TouchableOpacity
        style={styles.feedItem}
        onPress={() => handleFeedPress(item.feed_id)}
        activeOpacity={0.7}
      >
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.feedImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.feedContent}>
          <Text style={styles.feedTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.feedDescription} numberOfLines={2}>
            {item.content}
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
          onPress={(e) => handleToggleLike(item.feed_id, e)}
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
        <Header title="좋아요한 피드" showBackButton />
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
        <Header title="좋아요한 피드" showBackButton />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>데이터를 불러오는 중 오류가 발생했습니다.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </Layout>
    );
  }

  // 데이터가 없을 때 (로딩이 완료된 후에만 체크)
  if (!isLoading && (!allFeeds || allFeeds.length === 0)) {
    return (
      <Layout>
        <Header title="좋아요한 피드" showBackButton />
        <View style={styles.centerContainer}>
          <Ionicons name="heart-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>좋아요한 피드가 없습니다.</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header title="좋아요한 피드" showBackButton />
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

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    padding: 16,
  },
  feedItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  feedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F5F5F5',
  },
  feedContent: {
    flex: 1,
    justifyContent: 'center',
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  feedDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  feedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likedAtText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  likeButton: {
    padding: 8,
    marginLeft: 4,
  },
  chevron: {
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

