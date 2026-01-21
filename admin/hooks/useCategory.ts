// @/hooks/useCategory.ts
// 카테고리 관련 훅
// 관리자 페이지에서 사용예정

import { useState } from "react"
import { Category, CategorySearchParams, CategoryFormData, CategoryResponse } from "@/libs/interface/categories"
import { apiCall } from "@/libs/utils/apiHelper"
import { FRONTEND_ROUTES } from "@/libs/utils/apiRouter"
import { CommonResponse } from "@/libs/interface/common";

export function useCategory() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 카테고리 목록 조회
  const fetchCategories = async (params?: CategorySearchParams) => {
    setLoading(true)
    setError(null)

    try {
      const resultData = await apiCall(FRONTEND_ROUTES.CATEGORY_CODE(), 'GET') as CommonResponse<CategoryResponse>
      if (!resultData.success) {
        throw new Error(resultData.message || '카테고리 조회에 실패했습니다.')
      }

      const data = resultData.data

      if (!data) {
        throw new Error('카테고리 데이터가 없습니다.');
      }

      // age_group과 notices_group을 하나의 배열로 합치기
      const allCategories: Category[] = [
        ...(data.age_group || []),
        ...(data.notices_group || []),
        ...(data.meals_group || []),
        ...(data.topic_group || []),
      ]

      // 검색 필터링
      let filteredCategories = [...allCategories]

      if (params?.type) {
        filteredCategories = filteredCategories.filter(cat =>
          cat.type === params.type
        )
      }

      if (params?.value) {
        filteredCategories = filteredCategories.filter(cat =>
          cat.value.toLowerCase().includes(params.value!.toLowerCase())
        )
      }

      if (params?.is_active) {
        filteredCategories = filteredCategories.filter(cat =>
          cat.is_active === params.is_active
        )
      }

      setCategories(filteredCategories)
    } catch (err) {
      setError(err instanceof Error ? err.message : "카테고리를 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  // 카테고리 생성
  const createCategory = async (category: CategoryFormData) => {
    setLoading(true)
    setError(null)

    try {
      const resultData = await apiCall(FRONTEND_ROUTES.CATEGORY_CODE(), 'POST', null, category)
      if (!resultData.success) {
        throw new Error(resultData.message || '카테고리 생성에 실패했습니다.')
      }

      return resultData.data
    } catch (err) {
      setError(err instanceof Error ? err.message : "카테고리 생성에 실패했습니다")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 카테고리 수정
  const updateCategory = async (id: number, category: Partial<CategoryFormData>) => {
    setLoading(true)
    setError(null)

    try {
      const resultData = await apiCall(FRONTEND_ROUTES.CATEGORY_CODE(), 'PUT', null, { ...category, id })
      if (!resultData.success) {
        throw new Error(resultData.message || '카테고리 수정에 실패했습니다.')
      }

      return resultData.data
    } catch (err) {
      setError(err instanceof Error ? err.message : "카테고리 수정에 실패했습니다")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 카테고리 삭제
  const deleteCategory = async (id: number) => {
    setLoading(true)
    setError(null)

    try {
      const resultData = await apiCall(FRONTEND_ROUTES.CATEGORY_CODE(), 'DELETE', null, { category_id: id })
      if (!resultData.success) {
        throw new Error(resultData.message || '카테고리 삭제에 실패했습니다.')
      }

      return resultData.data
    } catch (err) {
      setError(err instanceof Error ? err.message : "카테고리 삭제에 실패했습니다")
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  }
}
