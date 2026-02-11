import React, { useState, useRef, useCallback } from 'react';
import styles from './FeedListScreen.styles';
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
import ConfirmPortal from '@/components/ConfirmPortal';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { Feed } from '../libs/types/FeedType';
import { useAuth } from '../libs/contexts/AuthContext';

import Layout from '../components/Layout';
import Header from '../components/Header';
import AiSummaryModal from '../components/AiSummaryModal';
import AiSummaryAnswerModal from '../components/AiSummaryAnswerModal';
import UserHeader from '../components/UserHeader';
import BannerCarousel from '../components/BannerCarousel';
import FeedItem from '../components/FeedItem';
import { LoadingPage } from '../components/Loading';
import { ErrorPage } from '../components/ErrorPage';
import {
  useFeeds,
  useToggleLike,
  useToggleBookmark,
  useBlockUser,
  useSummaryFeedImage
} from '../libs/hooks/useFeeds';
import { toastError, toastSuccess, toastInfo } from '@/libs/utils/toast';


export default function FeedListScreen() {
  const appName = process.env.EXPO_PUBLIC_APP_NAME || "";
  const navigation = useNavigation();
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({});
  const [likingFeedId, setLikingFeedId] = useState<number | null>(null);
  const [aiSummaryModalVisible, setAiSummaryModalVisible] = useState(false);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [aiAnswerModalVisible, setAiAnswerModalVisible] = useState(false);

  const [aiSummaryParams, setAiSummaryParams] = useState<{
    userHash: string;
    feedId: number;
    imageId: string;
  } | null>(null);

  const [aiAnswerData, setAiAnswerData] = useState<{
    question: string;
    answer: string;
  } | null>(null);

  const [blockDialogVisible, setBlockDialogVisible] = useState(false);
  const [userToBlock, setUserToBlock] = useState<{
    userHash: string;
    nickname: string;
  } | null>(null);

  // 낙관적 업데이트를 위한 로컬 좋아요 상태
  const [optimisticLikes, setOptimisticLikes] = useState<{
    [key: number]: { is_liked: boolean; like_count: number };
  }>({});

  // React Query로 피드 데이터 조회
  const { data, isLoading, isError, error, refetch } = useFeeds({ page: 1, limit: 20, type: 'list' });

  const feeds = data?.data;

  const summaryFeedImageMutation  = useSummaryFeedImage(); // 이미지 요약

  // Mutations
  const toggleLikeMutation     = useToggleLike();
  const blockUserMutation      = useBlockUser();
  const toggleBookmarkMutation = useToggleBookmark();

  // 좋아요 처리 (낙관적 업데이트)
  const handleLike = useCallback((id: number) => {
    // 현재 피드 찾기
    const currentFeed = feeds?.find(feed => feed.id === id);
    if (!currentFeed) return;

    // 낙관적으로 UI 먼저 업데이트
    const newIsLiked = !currentFeed.is_liked;
    const newLikeCount = newIsLiked
      ? currentFeed.like_count + 1
      : currentFeed.like_count - 1;

    setOptimisticLikes(prev => ({
      ...prev,
      [id]: {
        is_liked: newIsLiked,
        like_count: newLikeCount,
      },
    }));

    // 백그라운드에서 API 호출
    toggleLikeMutation.mutate(id, {
      onSuccess: () => {
        // 성공 시 서버 데이터로 동기화
        refetch();
      },
      onError: (error) => {
        // 실패 시 롤백
        setOptimisticLikes(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
        toastError('좋아요 처리 중 오류가 발생했습니다.');
      },
    });
  }, [feeds, toggleLikeMutation, refetch]);

  const handleSave = (id: number) => {
    setMenuVisible(null);
    toggleBookmarkMutation.mutate(id, {
      onError: (error) => {
        toastError('찜하기 처리 중 오류가 발생했습니다.');
      },
    });
  };

  // 식단캘린더에 복사 추가
  const handleAddToMealCalendar = (userHash: string, feedId: number) => {
    setMenuVisible(null);
    navigation.navigate('MealCopyByFeed', { feedId, userHash });
  }

  // 프로필 이동 (내 프로필 or 타인 프로필)
  const handleViewProfile = useCallback((userHash: string, nickname: string) => {
    setMenuVisible(null);

    // 해쉬정보가 같은 경우 내 프로필로 이동
    if (user.view_hash === userHash) {
      navigation.navigate('MyPage');
    } else {
      // 타인 프로필로 이동
      navigation.navigate('UserProfile', { userHash });
    }
  }, [navigation, user?.view_hash]);

  // 사용자 차단 or 해제
  const handleBlock = useCallback((deny_user_hash: string, nickname: string) => {
    setMenuVisible(null);
    setUserToBlock({ userHash: deny_user_hash, nickname });
    setBlockDialogVisible(true);
  }, []);

  const confirmBlock = () => {
    if (userToBlock) {
      blockUserMutation.mutate(userToBlock.userHash, {
        onSuccess: () => { toastSuccess(`${userToBlock.nickname}님을 차단했습니다.`); },
        onError: (error) => { toastError('차단 처리 중 오류가 발생했습니다.'); },
      });
    }
    setBlockDialogVisible(false);
    setUserToBlock(null);
  };

  const cancelBlock = () => {
    setBlockDialogVisible(false);
    setUserToBlock(null);
  };

  const handleMenuToggle = useCallback((id: number) => {
    setMenuVisible(prev => prev === id ? null : id);
  }, []);

  const handleImageScroll = useCallback((id: number, index: number) => {
    setCurrentImageIndex(prev => ({ ...prev, [id]: index }));
  }, []);

  const handleCommentPress = useCallback((feedId: number) => {
    navigation.navigate('FeedComment', { feedId });
  }, [navigation]);

  const handleAiSummary = useCallback((userHash: string, feedId: number, imageId: string) => {
    setAiSummaryParams({ userHash, feedId, imageId });
    setAiSummaryModalVisible(true);
  }, []);

  // ai 요약 뮤테이션 옵션
  const aiSummaryMutationOptions = (prompt: string) => ({
    onSuccess: (data: any) => {
      setAiSummaryModalVisible(false);
      setAiAnswerData({ question: prompt, answer: data });
      setAiAnswerModalVisible(true);
    },
    onError: (error: unknown) => {
      setAiSummaryModalVisible(false);
      setAiSummaryParams(null);
      setUserPrompt('');
      toastError('AI 요약 중 오류가 발생했습니다.');
    },
  });

  // ai 요약 질문 제출
  const handleAiSummarySubmit = useCallback((prompt: string) => {
    if (!aiSummaryParams) return;

    const { feedId, imageId } = aiSummaryParams;
    setUserPrompt(prompt); // 사용자 질문 저장

    summaryFeedImageMutation.mutate(
      { feedId, imageId: parseInt(imageId), prompt},
      aiSummaryMutationOptions(prompt)
    );
  }, [aiSummaryParams, summaryFeedImageMutation]);

  // ai 답변 모달 닫기
  const onHandleAiAnswerModalClose = () => {
    setAiAnswerModalVisible(false);
    setAiAnswerData(null);
    setAiSummaryParams(null);
    setUserPrompt('');
  }

  // ai 모달닫기
  const onHandleAiModalClose = () => {
    setAiSummaryModalVisible(false);
    setAiSummaryParams(null);
    setUserPrompt('');
  }

  const keyExtractor = useCallback((item: Feed) => item.id.toString(), []);

  const renderFeed = useCallback(({ item }: { item: Feed }) => {
    // 낙관적 업데이트가 있으면 그것을 우선 사용
    const optimisticState = optimisticLikes[item.id];
    const feedItem = optimisticState ? {
      ...item,
      is_liked: optimisticState.is_liked,
      like_count: optimisticState.like_count,
    } : item;

    return (
      <FeedItem
        item={feedItem}
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
        onAddToMealCalendar={handleAddToMealCalendar}
        userHash={user?.view_hash}
      />
    );
  }, [menuVisible, currentImageIndex, likingFeedId, optimisticLikes, handleMenuToggle, handleImageScroll, handleViewProfile, handleBlock, handleLike, handleCommentPress, handleAiSummary, user?.view_hash]);

  const renderListHeader = () => (
    <View>
      <UserHeader user={user} />
      <BannerCarousel />
      <View style={styles.feedDivider} />
    </View>
  );


  // 에러 상태
  if (isError) {
    return (
      <ErrorPage
        message="피드를 불러올 수 없습니다"
        subMessage={error?.message}
        refetch={refetch}
      />
    );
  }

  return (
    <Layout>
      <Header title={appName} showMenu={true} />
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

      {/* AI 요약 질문 모달 */}
      <AiSummaryModal
        visible={aiSummaryModalVisible}
        onClose={onHandleAiModalClose}
        onSubmit={handleAiSummarySubmit}
        isLoading={summaryFeedImageMutation.isPending}
        userPrompt={userPrompt}
      />

      {/* AI 요약 답변 모달 */}
      <AiSummaryAnswerModal
        visible={aiAnswerModalVisible}
        onClose={onHandleAiAnswerModalClose}
        question={aiAnswerData?.question || ''}
        answer={aiAnswerData?.answer || ''}
        title="AI 요약 결과"
      />

      {/* 사용자 차단 확인 Dialog */}
      <ConfirmPortal
        visible={blockDialogVisible}
        title="사용자 차단"
        message={userToBlock ? `${userToBlock.nickname}님을 차단하시겠습니까?` : ''}
        onConfirm={confirmBlock}
        onCancel={cancelBlock}
        confirmText="차단"
        cancelText="취소"
        confirmColor="#FF6B6B"
      />

    </Layout>
  );
}