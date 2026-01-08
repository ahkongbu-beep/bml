import { fetchGet, fetchPost } from './config';
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

export const getDailyMeals = async (params: { user_hash: string; date: string }): Promise<ApiResponse<DailyMealsCategory>> => {
  return fetchGet<ApiResponse<DailyMealsCategory>>('/meals/check/daily', params);
}