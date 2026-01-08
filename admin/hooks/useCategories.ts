// @/hooks/useCategories.ts
import { useQuery } from "@tanstack/react-query"
import { apiCall } from "@/libs/utils/apiHelper"
import { FRONTEND_ROUTES } from "@/libs/utils/apiRouter"
import { Category, CategoryResponse } from "@/libs/interface/categories"
import { CommonResponse } from "@/libs/interface/common";

// 카테고리 데이터 가져오기
async function fetchCategoriesData(): Promise<Category[]> {
  const resultData = await apiCall(FRONTEND_ROUTES.CATEGORY_CODE(), 'GET') as CommonResponse<CategoryResponse>

  if (!resultData.success) {
    throw new Error(resultData.message || '카테고리 조회에 실패했습니다.');
  }

  const data = resultData.data;

  if (!data) {
    throw new Error('카테고리 데이터가 없습니다.');
  }

  // age_group과 notices_group을 하나의 배열로 합치기
  const allCategories: Category[] = [
    ...(data.age_group || []),
    ...(data.notices_group || [])
  ]

  return allCategories;
}

// React Query Hook
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategoriesData,
    staleTime: 30 * 60 * 1000, // 30분간 fresh 유지
    gcTime: 60 * 60 * 1000  // 1시간 캐시 유지
  })
}

// 타입별로 필터링된 카테고리 가져오기
export function useCategoriesByType(type: "NOTICES_GROUP" | "AGE_GROUP") {
  const { data: categories, ...rest } = useCategories();

  const filteredCategories = categories?.filter(cat => cat.type === type) || [];

  return {
    data: filteredCategories,
    ...rest
  }
}
