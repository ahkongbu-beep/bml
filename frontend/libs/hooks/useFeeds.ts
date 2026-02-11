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
  getFeedComments,
  createFeedComment,
  deleteFeedComment,
  getLikedFeeds,
  summaryFeedImage,
  copyFeed
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
  tags: (query: string) => [...feedKeys.all, 'tags', query] as const,
  likedFeeds: (userHash: string, limit: number, offset: number) => [...feedKeys.all, 'liked', userHash, limit, offset] as const,
};

/**
 * 댓글 리스트 조회
 */
export const useFeedComments = ({feedId, limit, offset}: {feedId: number, limit?: number, offset?: number}): UseQueryResult<any[], Error> => {
  return useQuery<any[], Error>({
    queryKey: ['feedComments', feedId, limit, offset],
    queryFn: () => getFeedComments(feedId, limit, offset),
    enabled: !!feedId,
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
export const useMyFeeds = (params?: FeedListParams) => {
  return useQuery<PaginationResponse<Feed>, Error>({
    queryKey: feedKeys.myFeeds(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    queryFn: () => getMyFeeds(params),
  });
};

/**
 * 특정 사용자의 피드 목록 조회 Hook
 */
export const useUserFeeds = (userHash: string, params?: FeedListParams) => {
  return useQuery<PaginationResponse<Feed>, Error>({
    queryKey: ['feeds', 'user', userHash],
    queryFn: () => getUserFeeds(userHash, params),
    enabled: !!userHash,
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
      queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
      queryClient.invalidateQueries({ queryKey: feedKeys.myFeeds() });
    },
  });
};


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
    // ✅ mutate(id) 로 받음
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
    mutationFn: (feedId: number) => toggleLike(feedId),
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
    mutationFn: (deny_user_hash: string) => blockUser(deny_user_hash),
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

/**
 * 좋아요한 피드 목록 조회 Hook
 */
export const useLikedFeeds = (limit: number = 30, offset: number = 0) => {
  return useQuery<any[], Error>({
    queryKey: feedKeys.likedFeeds('current-user', limit, offset),
    queryFn: () => getLikedFeeds(limit, offset),
    staleTime: 1000 * 60 * 5, // 5분
    keepPreviousData: true, // 페이징 시 이전 데이터 유지하여 깜빡임 방지
  });
};

