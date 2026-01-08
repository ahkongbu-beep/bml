import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../components/Layout';
import Header from '../components/Header';
import CommentModal from '../components/CommentModal';
import AiSummaryModal from '../components/AiSummaryModal';
import UserHeader from '../components/UserHeader';
import BannerCarousel from '../components/BannerCarousel';
import FeedItem from '../components/FeedItem';
import { Feed } from '../libs/types/FeedType';
import {
  useFeeds,
  useToggleLike,
  useToggleBookmark,
  useBlockUser,
  useFeedComments,
  useCreateFeedComment,
  useDeleteFeedComment,
  useSummaryFeedImage
} from '../libs/hooks/useFeeds';
import { useAuth } from '../libs/contexts/AuthContext';
export default function FeedListScreen() {
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({});
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedFeedId, setSelectedFeedId] = useState<number | null>(null);
  const [likingFeedId, setLikingFeedId] = useState<number | null>(null);
  const [aiSummaryModalVisible, setAiSummaryModalVisible] = useState(false);
  const [aiSummaryParams, setAiSummaryParams] = useState<{
    userHash: string;
    feedId: number;
    imageId: string;
  } | null>(null);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const { user } = useAuth();

  // 댓글 목록 조회 - selectedFeedId가 있을 때만 호출
  const { data: commentsData, refetch: refetchComments } = useFeedComments({
    feedId: selectedFeedId || 0,
    userHash: user?.view_hash || "",
    limit: 50,
    offset: 0
  }, {
    enabled: !!selectedFeedId && commentModalVisible, // 모달이 열리고 feedId가 있을 때만 실행
  });

  const createFeedCommentMutation = useCreateFeedComment(); // 댓글등록
  const deleteFeedCommentMutation = useDeleteFeedComment(); // 댓글삭제
  const summaryFeedImageMutation = useSummaryFeedImage(); // 이미지 요약

  // React Query로 피드 데이터 조회
  const { data, isLoading, isError, error, refetch } = useFeeds({ page: 1, limit: 20, type: 'list', user_hash: user?.view_hash });

  // Mutations
  const toggleLikeMutation = useToggleLike();
  const toggleBookmarkMutation = useToggleBookmark();
  const blockUserMutation = useBlockUser(user?.view_hash, "");

  const feeds = data?.data;

  const handleLike = useCallback((id: number) => {
    if (!user?.view_hash) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    setLikingFeedId(id);
    toggleLikeMutation.mutate({ feedId: id, userHash: user.view_hash }, {
      onSuccess: () => {
        refetch(); // 성공 후 피드 목록 새로고침
        setLikingFeedId(null);
      },
      onError: (error) => {
        Alert.alert('오류', '좋아요 처리 중 오류가 발생했습니다.');
        console.error('Like error:', error);
        setLikingFeedId(null);
      },
    });
  }, [user?.view_hash, toggleLikeMutation, refetch]);

  const handleSave = (id: number) => {
    setMenuVisible(null);
    toggleBookmarkMutation.mutate(id, {
      onError: (error) => {
        Alert.alert('오류', '찜하기 처리 중 오류가 발생했습니다.');
        console.error('Bookmark error:', error);
      },
    });
  };

  const handleViewProfile = useCallback((userId: number, nickname: string) => {
    setMenuVisible(null);
    Alert.alert('프로필 보기', `${nickname}님의 프로필을 확인합니다.`);
  }, []);

  const handleBlock = useCallback((deny_user_hash: string, nickname: string) => {
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
            blockUserMutation.mutate({user_hash: user?.view_hash , deny_user_hash}, {
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
  }, [blockUserMutation, user?.view_hash]);

  const handleMenuToggle = useCallback((id: number) => {
    setMenuVisible(prev => prev === id ? null : id);
  }, []);

  const handleImageScroll = useCallback((id: number, index: number) => {
    setCurrentImageIndex(prev => ({ ...prev, [id]: index }));
  }, []);

  const handleCommentPress = useCallback((feedId: number) => {
    setSelectedFeedId(feedId);
    setCommentModalVisible(true);
  }, []);

  const handleAiSummary = useCallback((userHash: string, feedId: number, imageId: string) => {
    setAiSummaryParams({ userHash, feedId, imageId });
    setAiSummaryModalVisible(true);
  }, []);

  const handleAiSummarySubmit = useCallback((prompt: string) => {
    if (!aiSummaryParams) return;

    const { userHash, feedId, imageId } = aiSummaryParams;
    setUserPrompt(prompt); // 사용자 질문 저장

    summaryFeedImageMutation.mutate(
      {
        feedId,
        imageId: parseInt(imageId),
        user_hash: userHash,
        prompt
      },
      {
        onSuccess: (data) => {
          setAiSummaryModalVisible(false);
          // 사용자 질문과 함께 결과 표시
          Alert.alert(
            'AI 요약 결과',
            `📝 질문: ${prompt}\n\n✨ 답변:\n${data}`,
            [
              {
                text: '확인',
                onPress: () => {
                  setAiSummaryParams(null);
                  setUserPrompt('');
                }
              }
            ]
          );
        },
        onError: (error) => {
          setAiSummaryModalVisible(false);
          Alert.alert('오류', 'AI 요약 중 오류가 발생했습니다.');
          console.error('AI Summary error:', error);
          setAiSummaryParams(null);
          setUserPrompt('');
        }
      }
    );
  }, [aiSummaryParams, summaryFeedImageMutation]);

  const renderFeed = useCallback(({ item }: { item: Feed }) => (
    <FeedItem
      item={item}
      menuVisible={menuVisible}
      currentImageIndex={currentImageIndex}
      isLiking={likingFeedId === item.id}
      onMenuToggle={handleMenuToggle}
      onImageScroll={handleImageScroll}
      onViewProfile={handleViewProfile}
      onBlock={handleBlock}
      onLike={handleLike}
      onCommentPress={handleCommentPress}
      onAiSummary={handleAiSummary}
      userHash={user?.view_hash}
    />
  ), [menuVisible, currentImageIndex, likingFeedId, handleMenuToggle, handleImageScroll, handleViewProfile, handleBlock, handleLike, handleCommentPress, handleAiSummary, user?.view_hash]);

  const keyExtractor = useCallback((item: Feed) => item.id.toString(), []);

  // FlatList 헤더
  const renderListHeader = () => (
    <View>
      <UserHeader user={user} />
      <BannerCarousel />
      <View style={styles.feedDivider} />
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
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={5}
        windowSize={10}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={['#FF9AA2']}
            tintColor="#FF9AA2"
          />
        }
      />

      {/* 댓글 모달 */}
      <CommentModal
        visible={commentModalVisible}
        onClose={() => {
          setCommentModalVisible(false);
          setSelectedFeedId(null);
        }}
        feedId={selectedFeedId || 0}
        comments={commentsData || []}
        onSubmit={(content, parentHash) => {
          if (!user?.view_hash || !selectedFeedId) {
            Alert.alert('오류', '로그인이 필요합니다.');
            return;
          }

          createFeedCommentMutation.mutate(
            {
              feed_id: selectedFeedId,
              user_hash: user.view_hash,
              comment: content,
              parent_hash: parentHash || '',
            },
            {
              onSuccess: () => {
                Alert.alert('성공', '댓글이 등록되었습니다.');
                refetchComments(); // 댓글 목록 새로고침
              },
              onError: (error) => {
                Alert.alert('오류', '댓글 등록 중 오류가 발생했습니다.');
                console.error('Comment create error:', error);
              },
            }
          );
        }}
        onDelete={(commentHash) => {
          deleteFeedCommentMutation.mutate(
            {
              comment_hash: commentHash,
              user_hash: user?.view_hash || '',
            },
            {
              onSuccess: () => {
                Alert.alert('성공', '댓글이 삭제되었습니다.');
                refetchComments(); // 댓글 목록 새로고침
              },
              onError: (error) => {
                Alert.alert('오류', '댓글 삭제 중 오류가 발생했습니다.');
                console.error('Comment delete error:', error);
              },
            }
          );
        }}
      />

      {/* AI 요약 모달 */}
      <AiSummaryModal
        visible={aiSummaryModalVisible}
        onClose={() => {
          setAiSummaryModalVisible(false);
          setAiSummaryParams(null);
          setUserPrompt('');
        }}
        onSubmit={handleAiSummarySubmit}
        isLoading={summaryFeedImageMutation.isPending}
        userPrompt={userPrompt}
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
  feedDivider: {
    height: 8,
    backgroundColor: '#F5F5F5',
  },
});
