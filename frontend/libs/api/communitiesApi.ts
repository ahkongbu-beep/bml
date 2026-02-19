import { fetchGet, fetchPost, fetchPut, fetchPostFormData, fetchPutFormData } from './config';
import { ApiResponse, PaginationResponse } from '../types/ApiTypes';
import { CommunityListRequest, CommunityListResponse, CommunityPost } from '../types/CommunitiesType';

/**
 * 커뮤니티 목록 조회
 */
export const getCommunityList = async (params: CommunityListRequest): Promise<ApiResponse<CommunityListResponse>> => {
  const response = await fetchGet<ApiResponse<CommunityListResponse>>(`/communities/list`, {
    category_code: params.categoryCode,
    is_notice: params.isNotice,
    is_secret: params.isSecret,
    keyword: params.keyword,
    user_nickname: params.userNickname,
    month: params.month,
    start_date: params.startDate,
    end_date: params.endDate,
    sort_by: params.sortBy,
    cursor: params.cursor,
    my_only: params.myOnly,
    limit: params.limit,
  });

  return response;
};

export const getCommunityDetail = async (view_hash: string): Promise<ApiResponse<CommunityPost>> => {
  const response = await fetchGet<ApiResponse<CommunityPost>>(`/communities/detail/${view_hash}`);
  return response;
};

interface CreateCommunityRequest {
  category_code: number;
  title: string;
  contents: string;
  is_secret: string;
}

export const createCommunity = async (formData: FormData): Promise<ApiResponse<CommunityPost>> => {
  const response = await fetchPostFormData<ApiResponse<CommunityPost>>(`/communities/create`, formData);
  return response;
};

export const updateCommunityComment = async (comment_hash: string, data: {
  comment: string;
}): Promise<ApiResponse<any>> => {
  const response = await fetchPut<ApiResponse<any>>(`/communities/comments/update/${comment_hash}`, data, 'PUT');
  return response;
};

export const updateCommunity = async (view_hash: string, formData: FormData): Promise<ApiResponse<CommunityPost>> => {
  const response = await fetchPutFormData<ApiResponse<CommunityPost>>(`/communities/update/${view_hash}`, formData);
  return response;
};

export const deleteCommunity = async (view_hash: string): Promise<ApiResponse<null>> => {
  const response = await fetchPut<ApiResponse<null>>(`/communities/delete/${view_hash}`, {}, 'PUT');
  return response;
}

export const likeToggleCommunity = async (view_hash: string): Promise<ApiResponse<{ liked: boolean }>> => {
  const response = await fetchPost<ApiResponse<{ liked: boolean }>>(`/communities/like/${view_hash}`, {}, 'POST');
  return response;
}

/**
 * 커뮤니티 댓글 조회
 */
export const getCommunityComments = async (community_hash: string, limit: number = 100): Promise<any> => {
  const response = await fetchGet<any>(`/communities/comments/${community_hash}`, { limit });
  return response;
};

/**
 * 커뮤니티 댓글 작성
 */
export const createCommunityComment = async (community_hash: string, data: {
  comment: string;
  parent_hash?: string;
}): Promise<ApiResponse<any>> => {
  const response = await fetchPost<ApiResponse<any>>(`/communities/comments/create/${community_hash}`, data, 'POST');
  return response;
};

/**
 * 커뮤니티 댓글 삭제
 */
export const deleteCommunityComment = async (comment_hash: string): Promise<ApiResponse<any>> => {
  const response = await fetchPut<ApiResponse<any>>(`/communities/comments/delete/${comment_hash}`, {}, 'PUT');
  return response;
};