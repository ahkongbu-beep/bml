// @/hooks/useSummaries.ts
// 요약관련 훅
// 관리자 페이지에서 사용

import { useState } from "react"
import { apiCall } from "@/libs/utils/apiHelper"
import { FRONTEND_ROUTES } from "@/libs/utils/apiRouter"
import { SummaryRequest, SummaryResponse, SummaryItem } from "@/libs/interface/summaries"
import { CommonResponse } from "@/libs/interface/common"

export function useSummary() {
  const [summaries, setSummaries] = useState<SummaryResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 공지사항 목록 조회
  const fetchSummary = async (params?: SummaryRequest) => {
    setLoading(true)
    setError(null)

    try {
      // Build query string from params
      const queryParams = new URLSearchParams()
      if (params?.startDate) queryParams.append('startDate', params.startDate)
      if (params?.endDate) queryParams.append('endDate', params.endDate)
      if (params?.nickname) queryParams.append('nickname', params.nickname)
      if (params?.searchType) queryParams.append('search_type', params.searchType)
      if (params?.searchValue) queryParams.append('search_value', params.searchValue)
      if (params?.model) queryParams.append('model', params.model)
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.offset) queryParams.append('offset', params.offset.toString())

      const url = queryParams.toString()
        ? `${FRONTEND_ROUTES.SUMMARY()}?${queryParams.toString()}`
        : FRONTEND_ROUTES.SUMMARY()

      const resultData = await apiCall(url, 'GET') as CommonResponse<SummaryItem[]>

      if (!resultData.success) {
        throw new Error(resultData.error || '공지사항 조회에 실패했습니다.')
      }

      if (!resultData.data) {
        throw new Error('요약 데이터가 없습니다.')
      }

      const summaryList = resultData.data.map((v: SummaryItem) => ({
        model: v.model,
        model_id: v.model_id,
        question: v.question,
        answer: v.answer,
        created_at: v.created_at,
        view_hash: v.view_hash,
        user: {
            profile_image: v.user.profile_image,
            nickname: v.user.nickname,
            user_hash: v.user.user_hash,
          }
      }));

      setSummaries(summaryList)
    } catch (err) {
      setError(err instanceof Error ? err.message : "공지사항을 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  return {
    summaries,
    loading,
    error,
    fetchSummary
  }
}
