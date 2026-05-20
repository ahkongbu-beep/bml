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
  return fetchGet<PaginationResponse<Feed>>('/meals/feed/list', params);
};

/**
 * 특정 피드 상세 조회
 */
export const getFeedById = async (mealHash: string, userHash: string): Promise<Feed> => {
  const response = await fetchGet<ApiResponse<Feed>>(`/meals/users/${userHash}/detail/${mealHash}`);

  if (!response.success) {
    throw new Error(response.error || '식단 정보를 불러올 수 없습니다.');
  }

  if (!response.data) {
    throw new Error('식단 데이터가 없습니다.');
  }

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

export const getIngredientsList = async (query: string): Promise<string[]> => {
  const response = await fetchGet<ApiResponse<string[]>>('/feeds/ingredients/list', { query_text: query });
  return response.data || [];
}


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

  const finalParams = { ...params, type: "owner", view_type: "mine", page: params?.page || 1, limit: params?.limit || 30 };
  return fetchGet<PaginationResponse<Feed>>('/meals/feed/list', finalParams);
};

/**
 * 특정 사용자 피드 목록
 */
export const getUserFeeds = async (userHash: string, params?: Omit<FeedListParams, 'user_hash'>): Promise<PaginationResponse<Feed>> => {
  const finalParams = { ...params, user_hash: userHash };
  return fetchGet<PaginationResponse<Feed>>(`/meals/users/${userHash}`, finalParams);
};

/**
 * 피드 생성
 */
export const createFeed = async (data: CreateFeedRequest): Promise<ApiResponse<any>> => {
  const formData = new FormData();
  const fallbackTitle = (data.content || '').trim().slice(0, 20) || '식단';

  formData.append('title', data.title?.trim() || fallbackTitle);
  formData.append('content', data.content || '');
  formData.append('is_public', data.is_public || 'Y');
  formData.append('is_share_meal_plan', data.is_share_meal_plan || 'N');
  formData.append('category_id', String(data.category_code || 0));

  if (Array.isArray(data.tags) && data.tags.length > 0) {
    formData.append('tags', data.tags.join(','));
  }

  if (Array.isArray(data.images)) {
    data.images
      .filter((image) => image.startsWith('file://'))
      .forEach((image, index) => {
        formData.append('files', {
          uri: image,
          name: `feed_${Date.now()}_${index}.jpg`,
          type: 'image/jpeg',
        } as any);
      });
  }

  return fetchPostFormData<ApiResponse<any>>('/feeds/create', formData);
};

/**
 * 피드 수정 (식단 업데이트 경로 사용)
 */
export const updateFeed = async (
  mealHash: string | number,
  data: UpdateFeedRequest
): Promise<ApiResponse<any>> => {
  const formData = new FormData();

  formData.append('contents', data.content || '');
  formData.append('is_public', data.is_public || 'Y');

  if (data.category_id !== undefined && data.category_id !== null) {
    formData.append('category_id', String(data.category_id));
  }

  if (data.meal_condition !== undefined && data.meal_condition !== null) {
    formData.append('meal_condition', String(data.meal_condition));
  }

  if (Array.isArray(data.images)) {
    const localImage = data.images.find((image) => image.startsWith('file://'));
    if (localImage) {
      formData.append('attaches', {
        uri: localImage,
        name: `meal_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);
    }
  }

  return fetchPutFormData<ApiResponse<any>>(`/meals/update/${mealHash}`, formData);
};

/**
 * 피드 복사 -> 캘린더로
 */
export const copyFeed = async (data: CopyFeedRequest): Promise<null> => {
  const params = {
    category_code: data.categoryCode,
    target_meal_id: data.targetMealId,
    target_user_hash: data.targetUserHash,
    input_date: data.inputDate,
    memo: data.memo,
    title: data.title,
    ingredients: data.ingredients ?? [],
  }

  console.log("params", params);
  const response = await fetchPost<ApiResponse<null>>('/feeds/copy', params);
  return response;
};


/**
 * 댓글 등록
 */
export const createFeedComment = async (data: CreateFeedCommentRequest): Promise<any> => {
  console.log("createFeedComment data:", data);
  const { meal_id, comment, parent_hash } = data;

  const body: any = { meal_id, comment };
  if (parent_hash !== undefined) {
    body.parent_hash = parent_hash;
  }

  const response = await fetchPost<ApiResponse<any>>('/feeds/comment/create', body);
  console.log("createFeedComment response:", response);
  return response.data;
}

/**
 * 댓글 삭제
 */
export const deleteFeedComment = async (comment_hash: string): Promise<void> => {
  console.log("deleteFeedComment commentHash:", comment_hash);
  const response = await fetchDelete<void>(`/feeds/comment/${comment_hash}`);
  console.log("deleteFeedComment response:", response);
  return response;
}

/**
 * 댓글 리스트 조회
 */
export const getFeedComments = async (
  mealId: number,
  limit?: number,
  offset?: number
): Promise<any[]> => {
  const params: any = { meal_id: mealId };
  if (limit !== undefined) params.limit = limit;
  if (offset !== undefined) params.offset = offset;

  const response = await fetchGet<ApiResponse<any[]>>('/feeds/comment/list', params);
  return response.data || [];
 };

/**
 * 재료 검색 (자동완성용)
 */
export const searchIngredients = async (query: string): Promise<string[]> => {
  const response = await fetchGet<ApiResponse<string[]>>('/feeds/ingredients/search', { query_text: query });
  return response.data || [];
};

/**
 * 스크랩한 피드 목록 조회
 */
export const getScraps = async (): Promise<ApiResponse<Feed[]>> => {
  return fetchGet<ApiResponse<Feed[]>>('/meals/scrap');
};

/**
 * 스크랩 토글 (스크랩/해제)
 */
export const toggleScrap = async (mealHash: string): Promise<ApiResponse<any>> => {
  return fetchPost<ApiResponse<any>>(`/meals/scrap/${mealHash}`);
};

/**
 * 스크랩 핀 고정 토글
 */
export const toggleScrapPin = async (mealHash: string): Promise<ApiResponse<any>> => {
  return fetchPost<ApiResponse<any>>(`/meals/scrap/${mealHash}/pin`);
};

