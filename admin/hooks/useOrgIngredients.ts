import { useState } from "react"
import { apiCall } from "@/libs/utils/apiHelper"
import { FRONTEND_ROUTES } from "@/libs/utils/apiRouter"
import { OrgIngredient } from "@/libs/interface/org_ingredients"
import { CommonResponse } from "@/libs/interface/common"

interface IngredientSaveBody {
  name: string;
  category: string;
  nutrients: Record<string, number>;
}

export function useOrgIngredients() {
  const [ingredients, setIngredients] = useState<OrgIngredient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchIngredients = async () => {
    setLoading(true)
    setError(null)

    try {
      const resultData = await apiCall(FRONTEND_ROUTES.ORG_INGREDIENTS(), 'GET') as CommonResponse<OrgIngredient[]>

      if (!resultData.success) {
        throw new Error(resultData.error || '원재료 조회에 실패했습니다.')
      }

      setIngredients(resultData.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "원재료를 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  const createIngredient = async (body: IngredientSaveBody) => {
    try {
      const resultData = await apiCall(
        FRONTEND_ROUTES.ORG_INGREDIENTS(),
        'POST',
        null,
        body
      ) as CommonResponse<null>

      if (!resultData.success) {
        throw new Error(resultData.error || '등록에 실패했습니다.')
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다")
      return false
    }
  }

  const updateIngredient = async (id: number, body: IngredientSaveBody) => {
    try {
      const resultData = await apiCall(
        FRONTEND_ROUTES.ORG_INGREDIENTS() + `?id=${id}`,
        'PUT',
        null,
        body
      ) as CommonResponse<null>

      if (!resultData.success) {
        throw new Error(resultData.error || '수정에 실패했습니다.')
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정에 실패했습니다")
      return false
    }
  }

  return { ingredients, loading, error, fetchIngredients, createIngredient, updateIngredient }
}
