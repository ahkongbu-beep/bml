import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import {
  getFeeds,
  getFeedById,
  createFeed,
  updateFeed,
  deleteFeed,
  toggleLike,
  toggleBookmark,
  blockUser,
  getMyFeeds,
  getUserFeeds,
  searchTags,
} from '../api/feedsApi';
import { Feed } from '../types/FeedType';
import {
  FeedListParams,
  CreateFeedRequest,
  UpdateFeedRequest,
  PaginationResponse,
} from '../types/ApiTypes';

// Query Keys
export const feedKeys = {
  all: ['feeds'] as const,
  lists: () => [...feedKeys.all, 'list'] as const,
  list: (params?: FeedListParams) => [...feedKeys.lists(), params] as const,
  details: () => [...feedKeys.all, 'detail'] as const,
  detail: (id: number, user_hash?: string) => [...feedKeys.details(), id, user_hash] as const,
  myFeeds: () => [...feedKeys.all, 'my'] as const,
  userFeeds: (userId: number) => [...feedKeys.all, 'user', userId] as const,
  tags: (query: string) => [...feedKeys.all, 'tags', query] as const,
};

/**
 * 피드 목록 조회 Hook
 */
export const useFeeds = (params?: FeedListParams) => {
  return useQuery<PaginationResponse<Feed>, Error>({
    queryKey: feedKeys.list(params),
    queryFn: () => getFeeds(params),
    staleTime: 1000 * 60 * 5, // 5분
  });
};

/**
 * 특정 피드 상세 조회 Hook
 */
export const useFeed = (id: number) => {
  return useQuery<Feed, Error>({
    queryKey: feedKeys.detail(id),
    queryFn: () => getFeedById(id),
    enabled: !!id,
  });
};

/**
 * 내 피드 목록 조회 Hook
 */
export const useMyFeeds = (userHash?: string, params?: FeedListParams) => {
  return useQuery<PaginationResponse<Feed>, Error>({
    queryKey: feedKeys.myFeeds(),
    queryFn: () => getMyFeeds({ ...params, user_hash: userHash }),
    enabled: !!userHash,
  });
};

/**
 * 특정 사용자의 피드 목록 조회 Hook
 */
export const useUserFeeds = (userId: number, params?: FeedListParams) => {
  return useQuery<PaginationResponse<Feed>, Error>({
    queryKey: feedKeys.userFeeds(userId),
    queryFn: () => getUserFeeds(userId, params),
    enabled: !!userId,
  });
};

/**
 * 피드 생성 Mutation
 */
export const useCreateFeed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFeedRequest) => createFeed(data),
    onSuccess: () => {
      // 피드 목록 다시 불러오기
      queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
      queryClient.invalidateQueries({ queryKey: feedKeys.myFeeds() });
    },
  });
};

/**
 * 피드 수정 Mutation
 */
export const useUpdateFeed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFeedRequest }) => updateFeed(id, data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: feedKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
        queryClient.invalidateQueries({ queryKey: feedKeys.myFeeds() });
      },
  });
};

/**
 * 피드 삭제 Mutation
 */
export const useDeleteFeed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteFeed(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
      queryClient.invalidateQueries({ queryKey: feedKeys.myFeeds() });
    },
  });
};

/**
 * 좋아요 토글 Mutation
 */
export const useToggleLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ feedId, userHash }: { feedId: number; userHash: string }) =>
      toggleLike(feedId, userHash),
    onMutate: async ({ feedId }) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: feedKeys.lists() });

      // 이전 데이터 백업
      const previousFeeds = queryClient.getQueryData(feedKeys.lists());

      // 낙관적 업데이트: UI를 즉시 업데이트
      queryClient.setQueriesData({ queryKey: feedKeys.lists() }, (old: any) => {
        if (!old?.data) return old;

        return {
          ...old,
          data: old.data.map((feed: Feed) =>
            feed.id === feedId
              ? {
                  ...feed,
                  isLiked: !feed.isLiked,
                  like_count: feed.isLiked ? feed.like_count - 1 : feed.like_count + 1,
                }
              : feed
          ),
        };
      });

      return { previousFeeds };
    },
    onError: (err, variables, context) => {
      // 에러 발생 시 이전 데이터로 복구
      if (context?.previousFeeds) {
        queryClient.setQueryData(feedKeys.lists(), context.previousFeeds);
      }
    },
    onSuccess: (response, variables) => {
      // 서버 응답으로 최종 업데이트
      queryClient.setQueriesData({ queryKey: feedKeys.lists() }, (old: any) => {
        if (!old?.data) return old;

        return {
          ...old,
          data: old.data.map((feed: Feed) =>
            feed.id === response.data.feed_id
              ? {
                  ...feed,
                  isLiked: response.data.liked,
                  like_count: response.data.like_count,
                }
              : feed
          ),
        };
      });
    },
  });
};

/**
 * 찜하기 토글 Mutation
 */
export const useToggleBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (feedId: number) => toggleBookmark(feedId),
    onSuccess: (_, feedId) => {
      queryClient.invalidateQueries({ queryKey: feedKeys.detail(feedId) });
      queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
    },
  });
};

/**
 * 사용자 차단 Mutation
 */
export const useBlockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => blockUser(userId),
    onSuccess: () => {
      // 차단 후 피드 목록 갱신
      queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
    },
  });
};

/**
 * 태그 검색 Hook (자동완성용)
 */
export const useSearchTags = (query: string) => {
  return useQuery({
    queryKey: feedKeys.tags(query),
    queryFn: () => searchTags(query),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 5, // 5분
  });
};
