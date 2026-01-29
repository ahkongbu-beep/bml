import { useQuery, useMutation } from '@tanstack/react-query';
import { register } from '../api/usersApi';
import {
  getCommunityList,
  createCommunity,
  getCommunityDetail,
  updateCommunity,
  deleteCommunity,
  likeToggleCommunity,
  getCommunityComments,
  createCommunityComment,
  updateCommunityComment,
  deleteCommunityComment
} from '../api/communitiesApi';
import { CommunityListRequest } from '../types/CommunitiesType';

// 커뮤니티 목록 조회
export const useGetCommunities = () => {
  return useMutation({
    mutationFn: (data: CommunityListRequest) => getCommunityList(data),
  });
};

// 커뮤니티 상세 조회
export const useGetDetailCommunity = () => {
  return useMutation({
    mutationFn: (view_hash: string) => getCommunityDetail(view_hash),
  });
}

// 커뮤니티 등록
export const useCreateCommunity = () => {
  return useMutation({
    mutationFn: (data: any) => createCommunity(data),
  });
}

// 커뮤니티 수정
export const useUpdateCommunity = () => {
  return useMutation({
    mutationFn: ({ view_hash, data }: { view_hash: string; data: any }) => updateCommunity(view_hash, data),
  });
}

export const useSoftDeleteCommunity = () => {
  return useMutation({
    mutationFn: (view_hash: string) => deleteCommunity(view_hash),
  });
}

export const useLikeToggleCommunity = () => {
  return useMutation({
    mutationFn: (view_hash: string) => likeToggleCommunity(view_hash),
  });
}

/**
 * 커뮤니티 댓글 조회
 */
export const useCommunityComments = (params: { communityHash: string; limit?: number }, options?: any) => {
  return useQuery({
    queryKey: ['communityComments', params.communityHash],
    queryFn: () => getCommunityComments(params.communityHash, params.limit || 100),
    ...options,
  });
};

/**
 * 커뮤니티 댓글 작성
 */
export const useCreateCommunityComment = () => {
  return useMutation({
    mutationFn: ({ community_hash, comment, parent_hash }: {
      community_hash: string;
      comment: string;
      parent_hash?: string;
    }) => createCommunityComment(community_hash, { comment, parent_hash }),
  });
};

/**
 * 커뮤니티 댓글 수정
 */
export const useUpdateCommunityComment = () => {
  return useMutation({
    mutationFn: ({ comment_hash, comment }: { comment_hash: string; comment: string }) =>
      updateCommunityComment(comment_hash, { comment }),
  });
}

/**
 * 커뮤니티 댓글 삭제
 */
export const useDeleteCommunityComment = () => {
  return useMutation({
    mutationFn: (comment_hash: string) => deleteCommunityComment(comment_hash),
  });
};