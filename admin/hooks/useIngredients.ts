import { useState } from "react"
import { apiCall } from "@/libs/utils/apiHelper"
import { FRONTEND_ROUTES } from "@/libs/utils/apiRouter"
import { IngredientRequest } from "@/libs/interface/ingredients"
import { CommonResponse } from "@/libs/interface/common"

export function useIngredients() {
  const [ingredients, setIngredients] = useState<IngredientRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchIngredients = async () => {
    setLoading(true)
    setError(null)

    try {
      const resultData = await apiCall(FRONTEND_ROUTES.INGREDIENTS(), 'GET') as CommonResponse<IngredientRequest[]>

      if (!resultData.success) {
        throw new Error(resultData.error || '재료 요청 조회에 실패했습니다.')
      }

      setIngredients(resultData.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "재료 요청을 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: number, status: string) => {
    try {
      const resultData = await apiCall(
        FRONTEND_ROUTES.INGREDIENTS() + `?id=${id}`,
        'PUT',
        null,
        { status }
      ) as CommonResponse<null>

      if (!resultData.success) {
        throw new Error(resultData.error || '상태 변경에 실패했습니다.')
      }

      // 로컬 상태 업데이트
      setIngredients(prev =>
        prev.map(item => item.id === id ? { ...item, status } : item)
      )

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 변경에 실패했습니다")
      return false
    }
  }

  const approveIngredient = async (id: number, category: string, nutrients: Record<string, number>) => {
    try {
      const resultData = await apiCall(
        FRONTEND_ROUTES.INGREDIENTS() + `?id=${id}`,
        'POST',
        null,
        { category, nutrients }
      ) as CommonResponse<null>

      if (!resultData.success) {
        throw new Error(resultData.error || '승인에 실패했습니다.')
      }

      setIngredients(prev =>
        prev.map(item => item.id === id ? { ...item, status: 'Y' } : item)
      )

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "승인에 실패했습니다")
      return false
    }
  }

  return { ingredients, loading, error, fetchIngredients, updateStatus, approveIngredient }
}
