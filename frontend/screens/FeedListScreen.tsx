import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { Feed } from '../libs/types/FeedType';
import { useFeeds, useToggleLike, useToggleBookmark, useBlockUser } from '../libs/hooks/useFeeds';
import { useAuth } from '../libs/hooks/useAuth';

const { width } = Dimensions.get('window');

export default function FeedListScreen() {
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({});
  const { user } = useAuth();

  // React Query로 피드 데이터 조회
  const { data, isLoading, isError, error, refetch } = useFeeds({ page: 1, limit: 20 });

  // Mutations
  const toggleLikeMutation = useToggleLike();
  const toggleBookmarkMutation = useToggleBookmark();
  const blockUserMutation = useBlockUser();
  // 로딩 중일 때 샘플 데이터 사용 (백엔드 연동 전)
  const feeds = data?.data;

  const handleLike = (id: number) => {
    if (!user?.view_hash) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    toggleLikeMutation.mutate({ feedId: id, userHash: user.view_hash }, {
      onError: (error) => {
        Alert.alert('오류', '좋아요 처리 중 오류가 발생했습니다.');
        console.error('Like error:', error);
      },
    });
  };

  const handleSave = (id: number) => {
    setMenuVisible(null);
    toggleBookmarkMutation.mutate(id, {
      onError: (error) => {
        Alert.alert('오류', '찜하기 처리 중 오류가 발생했습니다.');
        console.error('Bookmark error:', error);
      },
    });
  };

  const handleViewProfile = (userId: number, nickname: string) => {
    setMenuVisible(null);
    Alert.alert('프로필 보기', `${nickname}님의 프로필을 확인합니다.`);
  };

  const handleBlock = (userId: number, nickname: string) => {
    setMenuVisible(null);
    Alert.alert(
      '사용자 차단',
      `${nickname}님을 차단하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '차단',
          style: 'destructive',
          onPress: () => {
            blockUserMutation.mutate(userId, {
              onSuccess: () => {
                Alert.alert('차단 완료', `${nickname}님을 차단했습니다.`);
              },
              onError: (error) => {
                Alert.alert('오류', '차단 처리 중 오류가 발생했습니다.');
                console.error('Block error:', error);
              },
            });
          },
        },
      ]
    );
  };

  const renderFeed = ({ item }: { item: Feed }) => (
    <View style={styles.feedContainer}>
      {/* 사용자 정보 */}
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: item.user.profile_image }}
            style={styles.profileImage}
          />
          <View>
            <Text style={styles.nickname}>{item.user.nickname}</Text>
            <Text style={styles.timestamp}>{item.created_at}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setMenuVisible(menuVisible === item.id ? null : item.id)}>
          <Ionicons name="ellipsis-vertical" size={22} color="#C0C0C0" />
        </TouchableOpacity>
      </View>

      {/* 드롭다운 메뉴 */}
      {menuVisible === item.id && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleViewProfile(item.user_id, item.user.nickname)}
          >
            <Ionicons name="person-outline" size={20} color="#4A4A4A" />
            <Text style={styles.menuText}>사용자 계정보기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleBlock(item.user_id, item.user.nickname)}
          >
            <Ionicons name="ban-outline" size={20} color="#FF6B6B" />
            <Text style={[styles.menuText, styles.menuTextDanger]}>차단하기</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              handleLike(item.id);
              setMenuVisible(null);
            }}
          >
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={item.isLiked ? '#FF9AA2' : '#4A4A4A'}
            />
            <Text style={styles.menuText}>
              {item.isLiked ? '좋아요 취소' : '좋아요'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleSave(item.id)}
          >
            <Ionicons
              name={item.isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={item.isSaved ? '#FFCC99' : '#4A4A4A'}
            />
            <Text style={styles.menuText}>
              {item.isSaved ? '찜하기 취소' : '찜하기'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 피드 이미지 */}
      {item.images.length > 0 ? (
        <View style={styles.imageCarouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const slideIndex = Math.round(
                event.nativeEvent.contentOffset.x / (width - 16)
              );
              setCurrentImageIndex(prev => ({ ...prev, [item.id]: slideIndex }));
            }}
            scrollEventThrottle={16}
          >
            {item.images.map((imageUri, index) => (
              <Image
                key={index}
                source={{ uri: imageUri }}
                style={styles.feedImage}
              />
            ))}
          </ScrollView>
          {item.images.length > 1 && (
            <View style={styles.imageIndicatorContainer}>
              <Text style={styles.imageIndicator}>
                {(currentImageIndex[item.id] || 0) + 1} / {item.images.length}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.feedImage, styles.noImageContainer]}>
          <Text style={styles.noImageTitle}>{item.title}</Text>
        </View>
      )}

      {/* 액션 버튼 */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            onPress={() => handleLike(item.id)}
            style={styles.actionButton}
          >
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={30}
              color={item.isLiked ? '#FF9AA2' : '#C0C0C0'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={28} color="#C0C0C0" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={28} color="#C0C0C0" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => handleSave(item.id)}>
          <Ionicons
            name={item.isSaved ? 'bookmark' : 'bookmark-outline'}
            size={28}
            color={item.isSaved ? '#FFCC99' : '#C0C0C0'}
          />
        </TouchableOpacity>
      </View>

      {/* 좋아요 수 */}
      <Text style={styles.likeCount}>좋아요 {item.like_count}개</Text>

      {/* 내용 */}
      <View style={styles.contentContainer}>

        <Text style={styles.content}>
          {item.tags.length > 0 && item.tags.map((tag) => `#${tag} `)}{"\n"}
          <Text style={styles.contentNickname}>{item.user.nickname}</Text>{' '}
          {item.content}
        </Text>
      </View>
    </View>
  );

  // 로딩 상태
  if (isLoading) {
    return (
      <Layout>
        <Header title="BML" showMenu={true} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF9AA2" />
          <Text style={styles.loadingText}>피드를 불러오는 중...</Text>
        </View>
      </Layout>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <Layout>
        <Header title="BML" showMenu={true} />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#FF9AA2" />
          <Text style={styles.errorText}>피드를 불러올 수 없습니다</Text>
          <Text style={styles.errorSubText}>{error?.message || '네트워크 연결을 확인해주세요'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header title="BML" showMenu={true} />
      <FlatList
        data={feeds}
        renderItem={renderFeed}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={['#FF9AA2']}
            tintColor="#FF9AA2"
          />
        }
      />
    </Layout>
  );
}

const styles = StyleSheet.create({
  feedContainer: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    right: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 15,
    color: '#4A4A4A',
    marginLeft: 12,
    fontWeight: '500',
  },
  menuTextDanger: {
    color: '#FF6B6B',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#FFE5E5',
    marginVertical: 4,
    marginHorizontal: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFFBF7',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFE5E5',
  },
  nickname: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A4A4A',
  },
  timestamp: {
    fontSize: 12,
    color: '#B0B0B0',
    marginTop: 3,
  },
  imageCarouselContainer: {
    position: 'relative',
  },
  feedImage: {
    width: width - 16,
    height: width - 16,
    backgroundColor: '#FFF5F0',
    resizeMode: 'cover',
  },
  imageIndicatorContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageIndicator: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  noImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noImageTitle: {
    color: '#4A4A4A',
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFBF7',
  },
  leftActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginRight: 16,
  },
  likeCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A4A4A',
    paddingHorizontal: 14,
    marginBottom: 6,
    backgroundColor: '#FFFBF7',
  },
  contentContainer: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    backgroundColor: '#FFFBF7',
  },
  content: {
    fontSize: 14,
    color: '#4A4A4A',
    lineHeight: 22,
  },
  contentNickname: {
    fontWeight: '700',
    color: '#FF9AA2',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4A4A4A',
    fontWeight: '500',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#4A4A4A',
    fontWeight: '700',
  },
  errorSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#FF9AA2',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#FF9AA2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
