import { useState } from "react"
import { apiCall } from "@/libs/utils/apiHelper"
import { FRONTEND_ROUTES } from "@/libs/utils/apiRouter"
import { AllergyItem, AllergySaveBody } from "@/libs/interface/allergies"
import { CommonResponse } from "@/libs/interface/common"

export function useAllergies() {
  const [allergies, setAllergies] = useState<AllergyItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAllergies = async () => {
    setLoading(true)
    setError(null)

    try {
      const resultData = await apiCall(FRONTEND_ROUTES.ALLERGIES(), 'GET') as CommonResponse<AllergyItem[]>

      if (!resultData.success) {
        throw new Error(resultData.error || '알레르기 조회에 실패했습니다.')
      }

      setAllergies(resultData.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "알레르기를 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  const createAllergy = async (body: AllergySaveBody) => {
    try {
      const resultData = await apiCall(
        FRONTEND_ROUTES.ALLERGIES(),
        'POST',
        null,
        body
      ) as CommonResponse<AllergyItem>

      if (!resultData.success) {
        throw new Error(resultData.error || '알레르기 등록에 실패했습니다.')
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "알레르기 등록에 실패했습니다")
      return false
    }
  }

  const updateAllergy = async (foodCode: string, body: AllergySaveBody) => {
    try {
      const resultData = await apiCall(
        FRONTEND_ROUTES.ALLERGIES() + `?food_code=${foodCode}`,
        'PUT',
        null,
        body
      ) as CommonResponse<AllergyItem>

      if (!resultData.success) {
        throw new Error(resultData.error || '알레르기 수정에 실패했습니다.')
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "알레르기 수정에 실패했습니다")
      return false
    }
  }

  return { allergies, loading, error, fetchAllergies, createAllergy, updateAllergy }
}
