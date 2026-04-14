import React, { useState, useRef, useCallback } from 'react';
import styles from '../styles/screens/FeedListScreen.styles';
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

import { useAuth } from '../libs/contexts/AuthContext';
import { MealCalendar } from '../libs/types/MealCalendarType';
import { handleViewProfile } from '@/libs/utils/common';

import Layout from '../components/Layout';
import Header from '../components/Header';
import UserHeader from '../components/UserHeader';
import SearchBar from '../components/SearchBar';
import BannerCarousel from '../components/BannerCarousel';
import MealItem from '../components/MealItem';
import AiSummaryMealModal from '../components/AiSummaryMealModal';
import { LoadingPage } from '../components/Loading';
import { ErrorPage } from '../components/ErrorPage';

import {
  useInfiniteFeeds,
  useIngredientList,
  useToggleBookmark,
  useBlockUser,
} from '../libs/hooks/useFeeds';

import {
  useToggleLike,
  useAnalyzeMeal,
} from '../libs/hooks/useMeals';

import { toastError, toastSuccess, toastInfo } from '@/libs/utils/toast';

export default function FeedListScreen() {
  const appName = process.env.EXPO_PUBLIC_APP_NAME || "";
  const navigation = useNavigation();
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({});
  const [likingFeedId, setLikingFeedId] = useState<number | null>(null);
  const [aiSummaryVisible, setAiSummaryVisible] = useState(false);
  const [aiSummaryData, setAiSummaryData] = useState<{
    totalScore: number;
    totalSummary: string;
    suggestions: string[];
    ingredients: { mapper_name: string; mapper_score: number; mapper_id?: string }[];
    imageUrl?: string;
    contents?: string;
  } | null>(null);
  const [viewType, setViewType] = useState<"all" | "mine">('all');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  // SearchBar filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMealStage, setSearchMealStage] = useState<number>(0);
  const [searchMealStageDetail, setSearchMealStageDetail] = useState('');
  const [ingredientName, setIngredientName] = useState<string[]>([]);

  const [blockDialogVisible, setBlockDialogVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [userToBlock, setUserToBlock] = useState<{
    userHash: string;
    nickname: string;
  } | null>(null);
  const { data: ingredientListData } = useIngredientList('');

  // 낙관적 업데이트를 위한 로컬 좋아요 상태
  const [optimisticLikes, setOptimisticLikes] = useState<{
    [key: number]: { is_liked: boolean; like_count: number };
  }>({});

  // React Query로 피드 데이터 조회 (무한 스크롤)
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = useInfiniteFeeds({
    limit: 20,
    type: 'list',
    view_type: viewType,
    ingredient_name: ingredientName,
    user_hash: viewType === 'mine' ? user?.view_hash : undefined,
    meal_stage: searchMealStage,
    meal_stage_detail: searchMealStageDetail,
  });

  // 모든 페이지의 피드를 평탄화 (id 기준 중복 제거)
  const feeds = data?.pages
    .flatMap(page => page.data ?? [])
    .filter(Boolean)
    .filter((item, index, self) => self.findIndex(f => f.id === item.id) === index)
    .filter(item => item.is_public !== 'N' || item.user.user_hash === user?.view_hash) ?? [];

  // Mutations
  const toggleLikeMutation     = useToggleLike();
  const analyzeMealMutation    = useAnalyzeMeal();
  const blockUserMutation      = useBlockUser();
  const toggleBookmarkMutation = useToggleBookmark();

  // 좋아요 처리 (낙관적 업데이트)
  const handleLike = useCallback((mealHash: string) => {
    // 현재 피드 찾기
    const currentFeed = feeds?.find(feed => feed.view_hash === mealHash);
    if (!currentFeed) return;

    // 낙관적으로 UI 먼저 업데이트 (id 기준으로 저장)
    const feedId = currentFeed.id;
    const newIsLiked = !currentFeed.is_liked;
    const newLikeCount = newIsLiked
      ? currentFeed.like_count + 1
      : currentFeed.like_count - 1;

    setOptimisticLikes(prev => ({
      ...prev,
      [feedId]: {
        is_liked: newIsLiked,
        like_count: newLikeCount,
      },
    }));

    // 백그라운드에서 API 호출
    toggleLikeMutation.mutate(mealHash, {
      onSuccess: () => {
        // refetch 완료 후 낙관적 상태 제거 (순서 중요: 먼저 제거하면 깜빡임 발생)
        refetch().finally(() => {
          setOptimisticLikes(prev => {
            const next = { ...prev };
            delete next[feedId];
            return next;
          });
        });
      },
      onError: () => {
        // 실패 시 롤백
        setOptimisticLikes(prev => {
          const next = { ...prev };
          delete next[feedId];
          return next;
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
  const handleAddToMealCalendar = (userHash: string, mealId: number, mealHash: string) => {
    setMenuVisible(null);
    navigation.navigate('MealCopyByFeed', { mealId, mealHash, userHash });
  }

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

  // 사용자 차단 취소
  const cancelBlock = () => {
    setBlockDialogVisible(false);
    setUserToBlock(null);
  };

  // 상세 메뉴열기
  const handleMenuToggle = useCallback((id: number) => {
    setMenuVisible(prev => prev === id ? null : id);
  }, []);

  // 댓글 화면으로 이동
  const handleCommentPress = useCallback((mealId: number) => {
    navigation.navigate('FeedComment', { mealId });
  }, [navigation]);

  const handleEditFeed = useCallback((meal: MealCalendar) => {
    navigation.getParent()?.navigate('MealRegist', { meal, "selectedDate": meal.input_date });
  }, [navigation]);

  const handleAiSummary = useCallback((
    userHashParam: string,
    categoryIdParam: number,
    inputDateParam: string,
    childIdParam: number,
    mealStageParam: number,
    mealStageDetailParam: string,
    contentsParam: string,
    mappedTagsParam: any[],
    imagePathParam?: string,
  ) => {
    const ingredientList = mappedTagsParam.map(tag => ({
      ingredient_id: parseInt(tag.mapper_id, 10),
      score: parseFloat(tag.mapper_score),
    }));

    analyzeMealMutation.mutate(
      {
        userHash: userHashParam,
        categoryCode: categoryIdParam || 0,
        input_date: inputDateParam,
        childId: childIdParam || 0,
        mealStage: mealStageParam || 0,
        mealStageDetail: mealStageDetailParam || '',
        contents: (contentsParam || '').trim(),
        ingredients: ingredientList,
      },
      {
        onSuccess: (response: any) => {
          if (!response.success) {
            toastError(response.error || response.message || '영양 분석에 실패했습니다.');
            return;
          }

          const analysisResult = response.data;
          const totalScore = Number(analysisResult?.total_score ?? 0);
          const totalSummary = analysisResult?.total_summary ?? '';
          const suggestions = typeof analysisResult?.suggestion === 'string'
            ? analysisResult.suggestion.split('_AND_').filter((item: string) => item.trim().length > 0)
            : [];

          setAiSummaryData({
            totalScore,
            totalSummary,
            suggestions,
            ingredients: mappedTagsParam.map(tag => ({
              mapper_name: tag.mapper_name,
              mapper_score: tag.mapper_score,
              mapper_id: tag.mapper_id,
            })),
            imageUrl: imagePathParam, // 이미지 URL도 전달
            contents: contentsParam,
          });
          setAiSummaryVisible(true);
        },
        onError: () => {
          toastError('영양 분석에 실패했습니다.');
        },
      },
    );
  }, [ingredientListData, analyzeMealMutation, user?.view_hash]);

  const handleProfileView = useCallback((userHash: string) => {
    setMenuVisible(null); // 해쉬정보가 같은 경우 내 프로필로 이동
    handleViewProfile(navigation, user?.view_hash || '', userHash);
  }, [navigation, user?.view_hash]);

  const keyExtractor = useCallback((item: MealCalendar) => item.id.toString(), []);

  // 리스트 끝에 도달했을 때 다음 페이지 로드
  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleViewTypeChange = (newType: "all" | "mine") => {
    setViewType(newType);
  }

  const handleTagPress = useCallback((tag: string) => {
    setIngredientName(prev => {
      const next = prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag];
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      return next;
    });
    setIsFilterExpanded(false);
  }, []);

  const renderFeed = useCallback(({ item }: { item: MealCalendar }) => {
    // 낙관적 업데이트가 있으면 그것을 우선 사용
    const optimisticState = optimisticLikes[item.id];
    const feedItem = optimisticState ? {
      ...item,
      is_liked: optimisticState.is_liked,
      like_count: optimisticState.like_count,
    } : item;

    const isMine = user?.view_hash === item.user.user_hash;

    return (
      <MealItem
        item={feedItem}
        menuVisible={menuVisible}
        currentImageIndex={currentImageIndex}
        isLiking={likingFeedId === item.id}
        onMenuToggle={handleMenuToggle}
        onViewProfile={handleProfileView}
        onBlock={handleBlock}
        onLike={handleLike}
        onCommentPress={handleCommentPress}
        onAiSummary={handleAiSummary}
        isAnalyzing={analyzeMealMutation.isPending}
        onAddToMealCalendar={handleAddToMealCalendar}
        userHash={user?.view_hash}
        isMine={isMine}
        onEditFeed={handleEditFeed}
        onTagPress={handleTagPress}
        selectedTags={ingredientName}
      />
    );
  }, [menuVisible, currentImageIndex, likingFeedId, optimisticLikes, handleMenuToggle, handleProfileView, handleBlock, handleLike, handleCommentPress, handleAiSummary, handleTagPress, user?.view_hash]);

  const renderListHeader = () => (
    <View>
      <UserHeader user={user} viewType={viewType} onChangeViewType={handleViewTypeChange} />
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
      {/* 검색 */}
      <SearchBar
        onSearch={(query, mealStage, mealStageDetail) => {
          setSearchQuery(query);
          setSearchMealStage(mealStage);
          setSearchMealStageDetail(mealStageDetail || '');
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }}
      />
      {/* 식재료 필터 배지 */}
      {ingredientName.length > 0 && (() => {
        const VISIBLE_COUNT = 2;
        const hasMore = ingredientName.length > VISIBLE_COUNT;
        const visibleTags = isFilterExpanded ? ingredientName : ingredientName.slice(0, VISIBLE_COUNT);
        const hiddenCount = ingredientName.length - VISIBLE_COUNT;

        const BadgeItem = ({ tag }: { tag: string }) => (
          <View key={tag} style={activeFilterStyles.badge}>
            <Ionicons name="pricetag-outline" size={13} color="#FF9AA2" />
            <Text style={activeFilterStyles.badgeText}>{tag}</Text>
            <TouchableOpacity
              onPress={() => {
                setIngredientName(prev => prev.filter(t => t !== tag));
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={16} color="#FF9AA2" />
            </TouchableOpacity>
          </View>
        );

        return (
          <View style={activeFilterStyles.container}>
            <View style={activeFilterStyles.row}>
              {visibleTags.map(tag => <BadgeItem key={tag} tag={tag} />)}
              {!isFilterExpanded && hasMore && (
                <TouchableOpacity
                  style={activeFilterStyles.moreButton}
                  onPress={() => setIsFilterExpanded(true)}
                >
                  <Text style={activeFilterStyles.moreButtonText}>+{hiddenCount}</Text>
                </TouchableOpacity>
              )}
              {isFilterExpanded && (
                <TouchableOpacity
                  style={activeFilterStyles.moreButton}
                  onPress={() => setIsFilterExpanded(false)}
                >
                  <Ionicons name="chevron-up" size={14} color="#FF9AA2" />
                </TouchableOpacity>
              )}
              {ingredientName.length > 1 && (
                <TouchableOpacity
                  style={activeFilterStyles.clearAll}
                  onPress={() => {
                    setIngredientName([]);
                    setIsFilterExpanded(false);
                    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                  }}
                >
                  <Text style={activeFilterStyles.clearAllText}>전체 해제</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })()}
      <FlatList
        ref={flatListRef}
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
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#FF9AA2" />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={async () => {
              setIsRefreshing(true);
              await refetch();
              setIsRefreshing(false);
            }}
            colors={['#FF9AA2']}
            tintColor="#FF9AA2"
          />
        }
      />

      <AiSummaryMealModal
        visible={aiSummaryVisible}
        onClose={() => setAiSummaryVisible(false)}
        totalScore={aiSummaryData?.totalScore ?? 0}
        totalSummary={aiSummaryData?.totalSummary ?? ''}
        suggestions={aiSummaryData?.suggestions ?? []}
        ingredients={aiSummaryData?.ingredients ?? []}
        imageUrl={aiSummaryData?.imageUrl}
        contents={aiSummaryData?.contents} // 전체 데이터 전달 (필요 시)

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

const activeFilterStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF5F0',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE5E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF9AA2',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  badgeText: {
    fontSize: 13,
    color: '#FF9AA2',
    fontWeight: '600',
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE5E5',
    borderWidth: 1,
    borderColor: '#FF9AA2',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 36,
  },
  moreButtonText: {
    fontSize: 13,
    color: '#FF9AA2',
    fontWeight: '700',
  },
  clearAll: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  clearAllText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});