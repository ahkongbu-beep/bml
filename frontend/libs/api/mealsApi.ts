import { fetchGet, fetchPost, fetchPut, fetchDelete, fetchPostFormData, fetchPutFormData } from './config';
import { RegisterRequest, ApiResponse } from '../types/ApiTypes';
import { UserProfile } from '../types/UserType';
import { MealCalendar, MealCalendarParams, DailyMealsCategory } from '../types/MealType';

/**
 * 식단조회
 */
export const getMealsCalendar = async (params?: MealCalendarParams): Promise<PaginationResponse<MealCalendar>> => {
  return fetchGet<PaginationResponse<MealCalendar>>('/meals/calendar', params);
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
 * 식단삭제
 */
export const deleteMeal = async (mealHash: string): Promise<ApiResponse> => {
  return fetchDelete<ApiResponse>(`/meals/delete/${mealHash}`);
}

export const getDailyMeals = async (params: { user_hash: string; date: string }): Promise<ApiResponse<DailyMealsCategory>> => {
  return fetchGet<ApiResponse<DailyMealsCategory>>('/meals/check/daily', params);
}