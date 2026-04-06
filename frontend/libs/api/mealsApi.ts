import { fetchGet, fetchPost, fetchPut, fetchDelete, fetchPostFormData, fetchPutFormData } from './config';
import { RegisterRequest, ApiResponse } from '../types/ApiTypes';
import { UserProfile } from '../types/UserType';
import { MealCalendar, MealCalendarParams, DailyMealsCategory } from '../types/MealType';

/**
 * 식단 등록 전 ai 영양분석 요청
 */
export const getAnalyzeMeal = async (
  userHash: string,
  categoryCode: string,
  input_date: string,
  childId: number,
  mealStage: number,
  mealStageDetail: string,
  contents: string,
  ingredients: Array<{ ingredient_id: number; score: number }>
): Promise<ApiResponse<any>> => {
  return fetchPost<ApiResponse<any>>('/summaries/meal/temp_summary', {
    "user_hash": userHash,
    "category_code": categoryCode,
    "input_date": input_date,
    "child_id": childId,
    "meal_stage": mealStage,
    "meal_stage_detail": mealStageDetail,
    "contents": contents,
    "ingredients": ingredients
  });
};

/**
 * 식단조회
 */
export const getMealsCalendar = async (params?: MealCalendarParams): Promise<PaginationResponse<MealCalendar>> => {
  const finalParams = {
    ...params,
    view_type: 'mine', // 내 식단만 조회
  }
  return fetchGet<PaginationResponse<MealCalendar>>('/meals/calendar', finalParams);
};

/**
 * 특정 사용자의 식단 목록
 * userHash를 통해 해당 사용자의 식단 조회
 */
export const getUserMeals = async (
  userHash: string,
  params?: FeedListParams
): Promise<PaginationResponse<Feed>> => {
  // target_user_hash로 특정 사용자의 식단만 조회
  return fetchGet<PaginationResponse<Feed>>(`/meals/users/${userHash}`, params);
};

/**
 * 특정 사용자의 식단 상세조회
 * userHash를 통해 해당 사용자의 식단 조회
 */
export const getMealDetail = async (
  userHash: string,
  mealHash: string

): Promise<Feed> => {
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
 * 식단등록
 */
export const createMeal = async (mealData: any): Promise<ApiResponse> => {
  return fetchPost<ApiResponse>('/meals/create', mealData);
}

/**
 * 식단등록 (이미지 포함)
 */
export const createMealWithImage = async (formData: FormData): Promise<ApiResponse> => {
  return fetchPostFormData<ApiResponse>('/meals/create', formData);
}

export const getCalendarMonthImage = async (month: string): Promise<ApiResponse<string>> => {
  return fetchGet<ApiResponse<string>>('/meals/calendar/month_image', { month });
}

/**
 * 식단수정
 */
export const updateMeal = async (mealHash: string, mealData: any): Promise<ApiResponse> => {
  return fetchPut<ApiResponse>(`/meals/update/${mealHash}`, mealData);
}

/**
 * 식단수정 (이미지 포함)
 */
export const updateMealWithImage = async (mealHash: string, formData: FormData): Promise<ApiResponse> => {
  return fetchPutFormData<ApiResponse>(`/meals/update/${mealHash}`, formData);
}

/**
 * 월 메인 이미지 등록 (이미지 포함)
 */
export const uploadCalendarMonthImage = async (formData: FormData): Promise<ApiResponse> => {
  return fetchPostFormData<ApiResponse>('/meals/calendar/image/create', formData);
}

/**
 * 식단삭제
 */
export const deleteMeal = async (mealHash: string): Promise<ApiResponse> => {
  return fetchDelete<ApiResponse>(`/meals/delete/${mealHash}`);
}

export const getDailyMeals = async (params: { feed_id: string; date: string }): Promise<ApiResponse<DailyMealsCategory>> => {
  return fetchGet<ApiResponse<DailyMealsCategory>>('/meals/check/daily', params);
}

/**
 * 좋아요한 목록 조회
 */
export const getLikedMeals = async (
  limit: number = 30,
  offset: number = 0
): Promise<any[]> => {
  const response = await fetchGet<ApiResponse<any[]>>('/likes/list', {
    limit,
    offset
  });
  return response.data || [];
};

/**
 * 좋아요 토글
 */
export const toggleLike = async (mealHash: string): Promise<ToggleResponse> => {
  return fetchPost<ToggleResponse>(`/likes/toggle`, {meal_hash: mealHash});
};

/**
 * 좋아요한 피드 목록 조회
 */
export const getLikedList = async (
  limit: number = 30,
  offset: number = 0
): Promise<any[]> => {
  const response = await fetchGet<ApiResponse<any[]>>('/likes/list', {
    limit,
    offset
  });
  return response.data || [];
};
