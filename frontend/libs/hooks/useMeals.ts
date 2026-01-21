import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { createMeal, updateMeal, deleteMeal, getMealsCalendar, getDailyMeals } from '../api/mealsApi';
import { MealCalendarParams } from '../types/MealType';
import {
  PaginationResponse,
} from '../types/ApiTypes';

export const mealKeys = {
  all: ['meals'] as const,
  lists: () => [...mealKeys.all, 'list'] as const,
  list: (params?: MealCalendarParams) => [...mealKeys.lists(), params] as const,
  daily: (userHash: string, inputDate: string) => [...mealKeys.all, 'daily', userHash, inputDate] as const,
};

/*
 * 식단 목록 조회
 */
export const useMeals = (params?: MealCalendarParams) => {
  return useQuery<PaginationResponse<MealCalendar>, Error>({
    queryKey: mealKeys.list(params),
    queryFn: () => getMealsCalendar(params),
    staleTime: 1000 * 60 * 5, // 5분
  });
};

/*
 * 당일 등록된 식단 카테고리 조회
 */
 export const useMealsByDate = (userHash: string, inputDate: string): UseQueryResult<MealCalendar[], Error> => {
    return useQuery<MealCalendar[], Error>({
        queryKey: mealKeys.daily(userHash, inputDate),
        queryFn: () => getDailyMeals({ user_hash: userHash, date: inputDate }).then(res => res.data),
        enabled: !!userHash && !!inputDate,
        staleTime: 1000 * 60 * 5, // 5분
    });
 }


/*
 * 식단 등록
 */
export const useCreateMeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mealData: any) => createMeal(mealData),
    onSuccess: () => {
      queryClient.invalidateQueries(mealKeys.all);
    },
  });
};

/*
 * 식단 수정
 */
export const useUpdateMeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ mealHash, mealData }: { mealHash: string; mealData: any }) => updateMeal(mealHash, mealData),
    onSuccess: () => {
      queryClient.invalidateQueries(mealKeys.all);
    },
  });
};

/*
 * 식단 삭제
 */
export const useDeleteMeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mealHash: string) => deleteMeal(mealHash),
    onSuccess: () => {
      queryClient.invalidateQueries(mealKeys.all);
    },
  });
};