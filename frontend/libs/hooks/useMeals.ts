import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  keepPreviousData
} from '@tanstack/react-query';

import {
  createMeal,
  updateMeal,
  deleteMeal,
  getMealsCalendar,
  getDailyMeals,
  createMealWithImage,
  updateMealWithImage,
  uploadCalendarMonthImage,
  getCalendarMonthImage
} from '../api/mealsApi';

import { MealCalendarParams } from '../types/MealType';
import { PaginationResponse } from '../types/ApiTypes';



/* =========================================================
   Query Keys
========================================================= */

export const mealKeys = {
  all: ['meals'] as const,
  lists: () => [...mealKeys.all, 'list'] as const,
  list: (month?: string) => [...mealKeys.lists(), month || ''] as const,
  monthImage: (month: string) => ['meals','month-image',month] as const,
  daily: (userHash: string, inputDate: string) =>
    [...mealKeys.all, 'daily', userHash, inputDate] as const,
};



/* =========================================================
   월 캘린더 조회 (⭐ 핵심 수정됨)
========================================================= */

export const useMeals = (params?: MealCalendarParams) => {
  const month = params?.month || '';

  return useQuery<PaginationResponse<MealCalendar>, Error>({
    queryKey: mealKeys.list(month),
    queryFn: () => getMealsCalendar({ month }),
    enabled: !!month,

    // 이전 월 데이터 유지 (화면 깜빡임 방지)
    placeholderData: keepPreviousData,

    // 월 이동 후 복귀 시 항상 최신 데이터 로드
    staleTime: 0,
    gcTime: 1000 * 60 * 5,       // 5분간 캐시 유지 (keepPreviousData 용)

    refetchOnMount: true,
    refetchOnWindowFocus: false,

    retry: 1,
  });
};
/* =========================================================
  월 메인 이미지 조회
========================================================= */
export const useMonthImage = (month: string) => {
  return useQuery({
    queryKey: mealKeys.monthImage(month),
    queryFn: () => getCalendarMonthImage(month),
    enabled: !!month,

    // ⭐ 핵심
    staleTime: Infinity,      // 절대 자동 refetch 안함
    gcTime: 1000 * 60 * 60,   // 1시간 캐시
    retry: 1,
  });
};

/* =========================================================
   날짜별 식단 조회
========================================================= */

export const useMealsByDate = (
  userHash: string,
  inputDate: string
): UseQueryResult<MealCalendar[], Error> => {
  return useQuery<MealCalendar[], Error>({
    queryKey: mealKeys.daily(userHash, inputDate),
    queryFn: () =>
      getDailyMeals({ user_hash: userHash, date: inputDate }).then(res => res.data),
    enabled: !!userHash && !!inputDate,
    staleTime: 1000 * 60 * 5,
  });
};



/* =========================================================
   식단 등록
========================================================= */

export const useCreateMeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mealData: any) => createMeal(mealData),
    onSuccess: () => {
      // ⭐ 모든 meals 날리지 않음
      queryClient.invalidateQueries({ queryKey: mealKeys.lists() });
    },
  });
};



/* =========================================================
   식단 등록 (이미지 포함)
========================================================= */

export const useCreateMealWithImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => createMealWithImage(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealKeys.lists() });
    },
  });
};



/* =========================================================
   식단 수정
========================================================= */

export const useUpdateMeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ mealHash, mealData }: { mealHash: string; mealData: any }) =>
      updateMeal(mealHash, mealData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealKeys.lists() });
    },
  });
};



/* =========================================================
   식단 수정 (이미지 포함)
========================================================= */

export const useUpdateMealWithImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ mealHash, formData }: { mealHash: string; formData: FormData }) =>
      updateMealWithImage(mealHash, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealKeys.lists() });
    },
  });
};



/* =========================================================
   식단 삭제
========================================================= */

export const useDeleteMeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mealHash: string) => deleteMeal(mealHash),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealKeys.lists() });
    },
  });
};



/* =========================================================
   월 메인 이미지 업로드
========================================================= */

export const useUploadCalendarMonthImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => uploadCalendarMonthImage(formData),
    onSuccess: () => {
      // ⭐ 현재 월 포함 list 캐시만 갱신
      queryClient.invalidateQueries({ queryKey: mealKeys.lists() });
    },
  });
};