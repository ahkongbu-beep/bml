import { useQuery, useMutation, useQueryClient, UseQueryResult, useInfiniteQuery } from '@tanstack/react-query';
import {
  getFeeds,
  getFeedById,
  createFeed,
  updateFeed,
  toggleBookmark,
  blockUser,
  getMyFeeds,
  getUserFeeds,
  searchIngredients,
  getFeedComments,
  createFeedComment,
  deleteFeedComment,
  summaryFeedImage,
  copyFeed,
  getIngredientsList
} from '../api/feedsApi';
import { Feed, CopyFeedRequest } from '../types/FeedType';
import {
  FeedListParams,
  CreateFeedRequest,
  UpdateFeedRequest,
  PaginationResponse,
  CreateFeedCommentRequest,
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
  ingredients: (query: string) => [...feedKeys.all, 'ingredients', query] as const,
  likedFeeds: (userHash: string, limit: number, offset: number) => [...feedKeys.all, 'liked', userHash, limit, offset] as const,
};

/**
 * 댓글 리스트 조회
 */
export const useFeedComments = ({mealId, limit, offset}: {mealId: number, limit?: number, offset?: number}): UseQueryResult<any[], Error> => {
  return useQuery<any[], Error>({
    queryKey: ['feedComments', mealId, limit, offset],
    queryFn: () => getFeedComments(mealId, limit, offset),
    enabled: !!mealId,
    staleTime: 1000 * 60 * 5, // 5분
  });
}

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
 * 무한 스크롤 피드 목록 조회 Hook (cursor 기반)
 */
export const useInfiniteFeeds = (params?: Omit<FeedListParams, 'cursor'>) => {
  return useInfiniteQuery<PaginationResponse<Feed>, Error>({
    queryKey: ['feeds', 'infinite', params],
    queryFn: ({ pageParam = undefined }) => {
      return getFeeds({ ...params, cursor: pageParam });
    },
    getNextPageParam: (lastPage) => {
      // 마지막 피드의 id를 다음 cursor로 사용
      if (lastPage.data && lastPage.data.length > 0) {
        const lastFeed = lastPage.data[lastPage.data.length - 1];
        return lastFeed.id;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 5, // 5분
    initialPageParam: undefined,
  });
};

/**
 * 특정 피드 상세 조회 Hook
 */
export const useFeed = (mealHash: string, userHash: string) => {
  const { data, isLoading, error, refetch } = useQuery<Feed, Error>({
    queryKey: feedKeys.detail(mealHash, userHash),
    queryFn: () => getFeedById(mealHash, userHash),
    enabled: !!mealHash && !!userHash,
  });

  return {
    data,
    isLoading,
    error,
    refetch,
  };
};
/**
 * 내 피드 목록 조회 Hook
 */
export const useMyFeeds = (params?: FeedListParams) => {
  return useQuery<PaginationResponse<Feed>, Error>({
    queryKey: feedKeys.myFeeds(),
    staleTime: 1000 * 60 * 5, // 5분
    refetchOnWindowFocus: false,
    queryFn: () => getMyFeeds(params),
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
      queryClient.invalidateQueries({ queryKey: ['feeds', 'infinite'] });
      queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
      queryClient.invalidateQueries({ queryKey: feedKeys.myFeeds() });
    },
  });
};


/**
 * 피드 댓글 등록
 */
export const useCreateFeedComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFeedCommentRequest) => createFeedComment(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feedComments', variables.feed_id] });
    },
  })
};

/**
 * 피드 요약
 */
export const useSummaryFeedImage = (feedId: number, imageId: number, prompt: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ feedId, imageId, prompt }:
      {
        feedId: number;
        imageId: number;
        prompt: string;
      }) => summaryFeedImage({ feedId, imageId, prompt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.detail(feedId) });
    }
  });
};

/**
 * 피드 복사 Mutation
 */
export const useCopyFeed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CopyFeedRequest) => copyFeed(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds', 'infinite'] });
      queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
      queryClient.invalidateQueries({ queryKey: feedKeys.myFeeds() });
    },
  });
};

export const useIngredientList = (query: string) => {
  return useQuery({
    queryKey: feedKeys.ingredients(query),
    queryFn: () => getIngredientsList(query),

    staleTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * 피드 댓글 삭제
 */
export const useDeleteFeedComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (comment_hash: string) => deleteFeedComment(comment_hash),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedComments'] });
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
        queryClient.invalidateQueries({ queryKey: ['feeds', 'infinite'] });
        queryClient.invalidateQueries({ queryKey: feedKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
        queryClient.invalidateQueries({ queryKey: feedKeys.myFeeds() });
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
    mutationFn: (deny_user_hash: string) => blockUser(deny_user_hash),
    onSuccess: () => {
      // 차단 후 피드 목록 갱신
      queryClient.invalidateQueries({ queryKey: ['feeds', 'infinite'] });
      queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
    },
  });
};

/**
 * 재료 검색 Hook (자동완성용)
 */
export const useSearchIngredients = (query: string) => {
  return useQuery({
    queryKey: feedKeys.ingredients(query),
    queryFn: () => searchIngredients(query),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 5, // 5분
  });
};

