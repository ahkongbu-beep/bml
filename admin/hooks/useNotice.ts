// @/hooks/useNotice.ts
// 공지사항 관련 훅
// 클라이언트, 관리자 페이지에서 사용예정

import { useState } from "react"
import { apiCall } from "@/libs/utils/apiHelper"
import { FRONTEND_ROUTES } from "@/libs/utils/apiRouter"
import { Notice, NoticeSearchParams, NoticeCreateRequest, NoticeUpdateRequest, NoticeItem } from "@/libs/interface/notices"
import { CommonResponse } from "@/libs/interface/common"

export function useNotice() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 공지사항 목록 조회
  const fetchNotices = async (params?: NoticeSearchParams) => {
    setLoading(true)
    setError(null)

    try {
      const resultData = await apiCall(FRONTEND_ROUTES.NOTICES(), 'GET') as CommonResponse<NoticeItem[]>

      if (!resultData.success) {
        throw new Error(resultData.error || '공지사항 조회에 실패했습니다.')
      }

      if (!resultData.data) {
        throw new Error('공지사항 데이터가 없습니다.')
      }

      const noticeList = resultData.data.map((notice: NoticeItem) => ({
        id: notice.id,
        title: notice.title,
        content: notice.content,
        categoryText: notice.category_text,
        createdAt: notice.created_at,
        updatedAt: notice.updated_at,
        author: notice.admin_name,
        isImportant: notice.is_important == "Y" ? true : false,
        ip: notice.ip,
        isActive: notice.status === 'active',
        viewHash: notice.view_hash,
      }));

      // 검색 필터링
      let filteredNotices = [...noticeList]

      if (params?.title && params.title.length >= 2) {
        filteredNotices = filteredNotices.filter(notice =>
          notice.title.toLowerCase().includes(params.title!.toLowerCase())
        )
      }

      if (params?.category) {
        filteredNotices = filteredNotices.filter(notice =>
          notice.categoryText === params.category
        )
      }

      if (params?.startDate) {
        filteredNotices = filteredNotices.filter(notice =>
          notice.createdAt >= params.startDate!
        )
      }

      if (params?.endDate) {
        filteredNotices = filteredNotices.filter(notice =>
          notice.createdAt <= params.endDate!
        )
      }

      setNotices(filteredNotices)
    } catch (err) {
      setError(err instanceof Error ? err.message : "공지사항을 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  // 공지사항 생성
  const createNotice = async (notice: NoticeCreateRequest) => {
    setLoading(true)
    setError(null)

    try {
      const params = {
        category_id: notice.category,
        title: notice.title,
        content: notice.content,
        status: 'active',
        is_important: notice.isImportant ? 'Y' : 'N',
      }

      const resultData = await apiCall(FRONTEND_ROUTES.NOTICES(), 'POST', "", params) as CommonResponse<NoticeItem>
      if (!resultData.success) {
        throw new Error(resultData.error || '공지사항 생성에 실패했습니다.')
      }

      if (!resultData.data) {
        throw new Error('공지사항 데이터가 없습니다.')
      }

      // 목록 새로고침
      await fetchNotices()

    } catch (err) {
      setError(err instanceof Error ? err.message : "공지사항 생성에 실패했습니다")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 공지사항 수정
  const updateNotice = async (params: NoticeUpdateRequest) => {
    setLoading(true)
    setError(null)

    try {
      const requestParams = {
        title: params.title,
        content: params.content,
        category_id: params.category,
        is_important: params.isImportant ? 'Y' : 'N',
      }

      const apiURL = `${FRONTEND_ROUTES.NOTICES()}`;
      const resultData = await apiCall(`${apiURL}?view_hash=${params.viewHash}`, 'PUT', "", requestParams) as CommonResponse<NoticeItem>

      if (!resultData.success) {
        throw new Error(resultData.error || '공지사항 수정에 실패했습니다.')
      }

      if (!resultData.data) {
        throw new Error('공지사항 데이터가 없습니다.')
      }

      // 목록 새로고침
      await fetchNotices()
    } catch (err) {
      setError(err instanceof Error ? err.message : "공지사항 수정에 실패했습니다")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 공지사항 삭제
  const toggleNotice = async (viewHash: string) => {
    setLoading(true)
    setError(null)

    const params = {
      type : 'status_toggle'
    }
    try {
      const apiURL = `${FRONTEND_ROUTES.NOTICES()}`;
      const resultData = await apiCall(`${apiURL}?view_hash=${viewHash}`, 'PUT', "", params) as CommonResponse<NoticeItem>

      if (!resultData.success) {
        throw new Error(resultData.error || '공지사항 삭제에 실패했습니다.')
      }

      // 목록 새로고침
      await fetchNotices()

    } catch (err) {
      setError(err instanceof Error ? err.message : "공지사항 삭제에 실패했습니다")
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    notices,
    loading,
    error,
    fetchNotices,
    createNotice,
    updateNotice,
    toggleNotice,
  }
}
