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
  getCalendarMonthImage,
  getUserMeals,
  getLikedList,
  toggleLike,
  getAnalyzeMeal,
  getMealDetail
} from '../api/mealsApi';

import { MealCalendarParams } from '../types/MealType';
import { PaginationResponse } from '../types/ApiTypes';

/* =========================================================
   Query Keys
========================================================= */

export const mealKeys = {
  all: ['meals'] as const,
  lists: () => [...mealKeys.all, 'list'] as const,
  list: (month?: string, childId?: number | null) => [...mealKeys.lists(), month || '', childId ?? null] as const,
  monthImage: (month: string) => ['meals','month-image',month] as const,
  daily: (feedId: number, inputDate: string) =>
    [...mealKeys.all, 'daily', feedId, inputDate] as const,
  detail: (targetHash: string, mealHash: string) =>
    [...mealKeys.all, 'detail', targetHash, mealHash] as const,
  likedFeeds: (limit: number, offset: number) =>
    [...mealKeys.all, 'liked', limit, offset] as const,
};

/* =========================================================
   월 캘린더 조회 (⭐ 핵심 수정됨)
========================================================= */
export const useMeals = (params?: MealCalendarParams) => {
  const month = params?.month || '';
  const child_id = params?.child_id ?? null;

  return useQuery<PaginationResponse<MealCalendar>, Error>({
    queryKey: mealKeys.list(month, child_id),
    queryFn: () => getMealsCalendar({ month, child_id }),
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
  식단 등록 전 ai 영양분석 요청
========================================================= */
export const useAnalyzeMeal = () => {
  return useMutation({
    mutationFn: async (payload: {
      userHash: string;
      categoryCode: string;
      input_date: string;
      childId: number;
      mealStage: number;
      mealStageDetail: string;
      contents: string;
      ingredients: Array<{ ingredient_id: number; score: number }>;
    }) => getAnalyzeMeal(
      payload.userHash,
      payload.categoryCode,
      payload.input_date,
      payload.childId,
      payload.mealStage,
      payload.mealStageDetail,
      payload.contents,
      payload.ingredients,
    ),
  });
}

/* =========================================================
  월 메인 이미지 조회
========================================================= */
export const useMonthImage = (month: string) => {

  return useQuery({
    queryKey: ['monthImage'],
    queryFn: () => getCalendarMonthImage(''),
    enabled: !!month,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
    refetchOnMount: 'always',
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/* =========================================================
   날짜별 식단 조회
========================================================= */
export const useMealsByDate = (
  feedId: string,
  inputDate: string
): UseQueryResult<MealCalendar[], Error> => {
  return useQuery<MealCalendar[], Error>({
    queryKey: mealKeys.daily(feedId, inputDate),
    queryFn: () =>
      getDailyMeals({ feed_id: feedId, date: inputDate }).then(res => res.data),
    enabled: !!feedId && !!inputDate,
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
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
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
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
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
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
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
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
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
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
    },
  });
};

/* =========================================================
 * 특정 사용자의 프로필 -> 식단 목록 조회 Hook
========================================================= */
export const useUserMeals = (userHash: string, params?: FeedListParams) => {
  return useQuery<PaginationResponse<Feed>, Error>({
    queryKey: ['meals', 'user', userHash],
    queryFn: () => getUserMeals(userHash, params),
    enabled: !!userHash,
  });
};


/* =========================================================
 * 나의 피드 상세 조회 Hook
========================================================= */
export const useMyMealDetail = (userHash: string, mealHash: string) => {
  const { data, isLoading, error, refetch } = useQuery<Feed, Error>({
    queryKey: mealKeys.detail(userHash, mealHash),
    queryFn: () => getMealDetail(userHash, mealHash),
    enabled: !!userHash && !!mealHash,
  });

  return {
    data,
    isLoading,
    error,
    refetch,
  };
};

/* =========================================================
 * 다른사람의 피드 상세 조회 Hook
========================================================= */
export const useUserMealDetail = (targetHash: string, mealHash: string) => {
    console.log('useUserMealDetail 호출 - targetHash:', targetHash, 'mealHash:', mealHash);
  const { data, isLoading, error, refetch } = useQuery<Feed, Error>({
    queryKey: mealKeys.detail(targetHash, mealHash),
    queryFn: () => getMealDetail(targetHash, mealHash),
    enabled: !!targetHash && !!mealHash,
  });

  return {
    data,
    isLoading,
    error,
    refetch,
  };
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


/* =========================================================
  좋아요 토글 Mutation
 ========================================================= */
export const useToggleLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mealHash: string) => toggleLike(mealHash),
    onSuccess: () => {
      // 무한 스크롤 쿼리 갱신
      queryClient.invalidateQueries({ queryKey: ['meals', 'infinite'] });
      queryClient.invalidateQueries({ queryKey: mealKeys.lists() });
    },
  });
};


/* =========================================================
 * 좋아요 목록 조회 Hook
 =========================================================*/
export const useLikedFeeds = (limit: number = 30, offset: number = 0) => {
  return useQuery<any[], Error>({
    queryKey: mealKeys.likedFeeds(limit, offset),
    queryFn: () => getLikedList(limit, offset),
    staleTime: 1000 * 60 * 5, // 5분
    keepPreviousData: true, // 페이징 시 이전 데이터 유지하여 깜빡임 방지
  });
};
