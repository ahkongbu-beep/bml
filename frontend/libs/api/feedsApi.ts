import { fetchGet, fetchPost, fetchPut, fetchDelete, fetchPostFormData, fetchPutFormData } from './config';
import { Feed, CopyFeedRequest } from '../types/FeedType';
import {
  ApiResponse,
  PaginationResponse,
  FeedListParams,
  CreateFeedRequest,
  UpdateFeedRequest,
  ToggleResponse,
  CreateFeedCommentRequest
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
 * 특정 피드 이미지를 요약
 */
export const summaryFeedImage = async ({ feedId, imageId, prompt }: { feedId: number; imageId: number; prompt: string }): Promise<string> => {
  const data = { feed_id: feedId, image_id: imageId, prompt };
  const response = await fetchPost<ApiResponse<string>>('/summaries/feed/item', data);
  return response.data;
}

/**
 * 피드 생성
 */
export const createFeed = async (data: CreateFeedRequest): Promise<Feed> => {
  const formData = new FormData();

  formData.append('title', data.title);
  formData.append('content', data.content);
  formData.append('is_public', data.is_public || 'Y');
  formData.append('is_share_meal_plan', data.is_share_meal_plan || 'N');
  if (data.category_id !== undefined) {
    formData.append('category_id', data.category_id.toString());
  }

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
  formData.append('category_id', data.category_id ? data.category_id.toString() : '0');
  formData.append('is_share_meal_plan', data.is_share_meal_plan || 'N');

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
export const deleteFeed = async (feedId: number): Promise<void> => {
  console.log("deleteFeed called with id:", feedId);
  return await fetchDelete<void>(`/feeds/delete/${feedId}`);
};

/**
 * 피드 좋아요 토글
 */
export const toggleLike = async (feedId: number): Promise<ToggleResponse> => {
  return fetchPost<ToggleResponse>(`/feeds/like/${feedId}/toggle`);
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
export const blockUser = async (deny_user_hash: string): Promise<ApiResponse<null>> => {
  return fetchPost<ApiResponse<null>>(`/users/denies`, { deny_user_hash });
};

/**
 * 내가 작성한 피드 목록
 */
export const getMyFeeds = async (params?: Omit<FeedListParams, 'user_hash'>): Promise<PaginationResponse<Feed>> => {
  const finalParams = { ...params, type: "owner", page: params?.page || 1, limit: params?.limit || 30 };
  return fetchGet<PaginationResponse<Feed>>('/feeds/list', finalParams);
};

/**
 * 피드 복사 -> 캘린더로
 */
export const copyFeed = async (data: CopyFeedRequest): Promise<null> => {
  const params = {
    category_code: data.categoryCode,
    target_feed_id: data.targetFeedId,
    target_user_hash: data.targetUserHash,
    input_date: data.inputDate,
    memo: data.memo,
    title: data.title
  }

  console.log("params", params);
  const response = await fetchPost<ApiResponse<null>>('/feeds/copy', params);
  return response.data;
};

/**
 * 특정 사용자의 피드 목록
 * userHash를 통해 해당 사용자의 피드 조회
 */
export const getUserFeeds = async (
  userHash: string,
  params?: FeedListParams
): Promise<PaginationResponse<Feed>> => {
  // target_user_hash로 특정 사용자의 피드만 조회
  return fetchGet<PaginationResponse<Feed>>('/feeds/list', { ...params, type: 'list', target_user_hash: userHash });
};
/**
 * 댓글 등록
 */
export const createFeedComment = async (data: CreateFeedCommentRequest): Promise<any> => {
  console.log("createFeedComment data:", data);
  const { feed_id, comment, parent_hash } = data;

  const body: any = { feed_id, comment };
  if (parent_hash !== undefined) {
    body.parent_hash = parent_hash;
  }

  const response = await fetchPost<ApiResponse<any>>('/feeds/comments/create', body);
  console.log("createFeedComment response:", response);
  return response.data;
}

/**
 * 댓글 삭제
 */
export const deleteFeedComment = async (comment_hash: string): Promise<void> => {
  console.log("deleteFeedComment commentHash:", comment_hash);
  const response = await fetchDelete<void>(`/feeds/comments/${comment_hash}`);
  console.log("deleteFeedComment response:", response);
  return response;
}

/**
 * 댓글 리스트 조회
 */
export const getFeedComments = async (
  feedId: number,
  limit?: number,
  offset?: number
): Promise<any[]> => {
  const params: any = { feed_id: feedId };
  if (limit !== undefined) params.limit = limit;
  if (offset !== undefined) params.offset = offset;

  const response = await fetchGet<ApiResponse<any[]>>('/feeds/comments/list', params);
  return response.data || [];
 };

/**
 * 태그 검색 (자동완성용)
 */
export const searchTags = async (query: string): Promise<string[]> => {
  const response = await fetchGet<ApiResponse<string[]>>('/feeds/tags/search', { query_text: query });
  return response.data || [];
};

/**
 * 좋아요한 피드 목록 조회
 */
export const getLikedFeeds = async (
  limit: number = 30,
  offset: number = 0
): Promise<any[]> => {
  const response = await fetchGet<ApiResponse<any[]>>('/feeds/like/list', {
    limit,
    offset
  });
  return response.data || [];
};
