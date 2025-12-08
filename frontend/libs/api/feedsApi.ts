import { fetchGet, fetchPost, fetchPut, fetchDelete, fetchPostFormData, fetchPutFormData } from './config';
import { Feed } from '../types/FeedType';
import {
  ApiResponse,
  PaginationResponse,
  FeedListParams,
  CreateFeedRequest,
  UpdateFeedRequest,
  ToggleResponse,
} from '../types/ApiTypes';

/**
 * 피드 목록 조회
 */
export const getFeeds = async (params?: FeedListParams): Promise<PaginationResponse<Feed>> => {
  return fetchGet<PaginationResponse<Feed>>('/feeds/list', params);
};

/**
 * 특정 피드 상세 조회
 */
export const getFeedById = async (id: number): Promise<Feed> => {
  const response = await fetchGet<ApiResponse<Feed>>(`/feeds/detail/${id}`);
  return response.data;
};

/**
 * 피드 생성
 */
export const createFeed = async (data: CreateFeedRequest): Promise<Feed> => {
  const formData = new FormData();

  formData.append('user_hash', data.user_hash || '');
  formData.append('title', data.title);
  formData.append('content', data.content);
  formData.append('is_public', data.is_public || 'Y');

  // 태그는 #으로 구분하여 전송
  if (data.tags && data.tags.length > 0) {
    formData.append('tags', '#' + data.tags.join('#'));
  }

  // 이미지 파일 추가 (여러 개)
  if (data.images && data.images.length > 0) {
    data.images.forEach((imageUri, index) => {
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('files', {
        uri: imageUri,
        name: `image_${index}.${fileType}`,
        type: `image/${fileType}`,
      } as any);
    });
  }

  const response = await fetchPostFormData<ApiResponse<Feed>>('/feeds/create', formData);
  return response.data;
};

/**
 * 피드 수정
 */
export const updateFeed = async (id: number, data: UpdateFeedRequest): Promise<Feed> => {
  const formData = new FormData();

  formData.append('title', data.title);
  formData.append('content', data.content);
  formData.append('is_public', data.is_public || 'Y');

  // 태그는 #으로 구분하여 전송
  if (data.tags && data.tags.length > 0) {
    formData.append('tags', '#' + data.tags.join('#'));
  }

  // 이미지 파일 추가 (여러 개)
  if (data.images && data.images.length > 0) {
    data.images.forEach((imageUri, index) => {
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('files', {
        uri: imageUri,
        name: `image_${index}.${fileType}`,
        type: `image/${fileType}`,
      } as any);
    });
  }

  const response = await fetchPutFormData<ApiResponse<Feed>>(`/feeds/update/${id}`, formData);
  return response.data;
};

/**
 * 피드 삭제
 */
export const deleteFeed = async (id: number): Promise<void> => {
  await fetchDelete<void>(`/feeds/delete/${id}`);
};

/**
 * 피드 좋아요 토글
 */
export const toggleLike = async (feedId: number, userHash: string): Promise<ToggleResponse> => {
  return fetchPost<ToggleResponse>(`/feeds/like/${feedId}/toggle`, { user_hash: userHash });
};

/**
 * 피드 찜하기 토글
 */
export const toggleBookmark = async (feedId: number): Promise<ToggleResponse> => {
  return fetchPost<ToggleResponse>(`/feeds/${feedId}/bookmark`);
};

/**
 * 사용자 차단
 */
export const blockUser = async (userId: number): Promise<ApiResponse<null>> => {
  return fetchPost<ApiResponse<null>>(`/users/${userId}/block`);
};

/**
 * 내가 작성한 피드 목록
 */
export const getMyFeeds = async (params?: FeedListParams): Promise<PaginationResponse<Feed>> => {
  params = { ...params, page: params?.page || 1, limit: params?.limit || 30 };
  console.log("params", params);
  return fetchGet<PaginationResponse<Feed>>('/feeds/list', params);
};

/**
 * 특정 사용자의 피드 목록
 */
export const getUserFeeds = async (
  userId: number,
  params?: FeedListParams
): Promise<PaginationResponse<Feed>> => {
  return fetchGet<PaginationResponse<Feed>>(`/users/${userId}/feeds`, params);
};

/**
 * 태그 검색 (자동완성용)
 */
export const searchTags = async (query: string): Promise<string[]> => {
  const response = await fetchGet<ApiResponse<string[]>>('/feeds/tags/search', { query_text: query });
  return response.data || [];
};
