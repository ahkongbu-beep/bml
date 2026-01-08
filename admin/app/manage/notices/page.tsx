// @/app/manage/notices/page.tsx
"use client"
import React, { useState, useEffect, useMemo } from "react"
import toast from "react-hot-toast"
import { useNotice } from "@/hooks/useNotice"
import { useCategoriesByType } from "@/hooks/useCategories"
import { NoticeCategoryItem } from "@/libs/interface/categories"
import { NoticeUpdateRequest } from "@/libs/interface/notices"

export default function NoticesPage() {
  const { notices, loading, error, fetchNotices, createNotice, toggleNotice, updateNotice } = useNotice()

  // React Query로 카테고리 가져오기 (자동 캐싱)
  const { data: noticeCategories, isLoading: categoriesLoading } = useCategoriesByType("NOTICES_GROUP")

  // 검색 상태
  const [searchTitle, setSearchTitle] = useState("")
  const [searchCategory, setSearchCategory] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // 작성/수정 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    viewHash: null as string | null,
    title: "",
    content: "",
    category: "",
    author: "관리자",
    isActive: true,
    isImportant: false,
  })

  // 카테고리 옵션 (React Query에서 가져온 데이터를 변환)
  const categories = useMemo(() => {
    return noticeCategories?.map((cat: NoticeCategoryItem) => ({
      id: cat.id,
      value: cat.value,
      code: cat.code
    })) || []
  }, [noticeCategories])

  // 초기 데이터 로드
  useEffect(() => {
    fetchNotices()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 자동 검색 (2글자 이상)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotices({
        title: searchTitle,
        category: searchCategory,
        startDate,
        endDate,
      })
    }, 300)

    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTitle, searchCategory, startDate, endDate])

  // 공지사항 작성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
      toast.error("모든 필드를 입력해주세요")
      return
    }

    try {
      if (formData.viewHash !== null && formData.viewHash !== undefined) {
        // 수정 모드
        await updateNotice({
          viewHash: formData.viewHash,
          title: formData.title,
          content: formData.content,
          category: formData.category,
          isActive: formData.isActive,
          isImportant: formData.isImportant,
        })
        toast.success("공지사항이 수정되었습니다")
      } else {
        // 등록 모드
        console.log("등록 모드")
        await createNotice(formData)
        toast.success("공지사항이 등록되었습니다")
      }

      setIsModalOpen(false)
      setFormData({
        viewHash: null,
        title: "",
        content: "",
        category: "",
        author: "관리자",
        isActive: true,
        isImportant: false,
      })
    } catch {
      toast.error(formData.id !== null ? "공지사항 수정에 실패했습니다" : "공지사항 등록에 실패했습니다")
    }
  }

  // 공지사항 수정 모달 열기
  const handleEdit = (notice: NoticeUpdateRequest) => {
    console.log("notice", notice);
    // 카테고리 텍스트로 카테고리 id 찾기
    const matchedCategory = categories.find((cat: NoticeCategoryItem) => cat.value === notice.categoryText)

    console.log("handleEdit - notice.viewHash:", notice.viewHash)

    setFormData({
      viewHash: notice.viewHash,
      title: notice.title,
      content: notice.content,
      category: matchedCategory ? String(matchedCategory.id) : "",
      author: notice.author,
      isActive: notice.isActive,
      isImportant: notice.isImportant || false,
    })
    setIsModalOpen(true)
  }

  // 공지사항 삭제
  const handleToggleStatus = async (viewHash: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return

    try {
      await toggleNotice(viewHash)
      toast.success("삭제되었습니다")
    } catch {
      toast.error("삭제에 실패했습니다")
    }
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">공지사항 관리</h2>
          <p className="text-sm md:text-base text-gray-400">공지사항을 작성하고 관리합니다</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              viewHash: null,
              title: "",
              content: "",
              category: "",
              author: "관리자",
              isActive: true,
              isImportant: false,
            })
            setIsModalOpen(true)
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
        >
          <span>➕</span>
          <span>공지사항 작성</span>
        </button>
      </div>

      {/* 검색 영역 */}
      <div className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4">검색 필터</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 제목 검색 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">제목</label>
            <input
              type="text"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              placeholder="2글자 이상 입력"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* 카테고리 검색 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">카테고리</label>
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              disabled={categoriesLoading}
            >
              <option value="">전체</option>
              {categories.map((cat: NoticeCategoryItem) => (
                <option key={cat.id} value={cat.code}>{cat.value}</option>
              ))}
            </select>
          </div>

          {/* 시작 날짜 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">시작 날짜</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* 종료 날짜 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">종료 날짜</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 공지사항 리스트 */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">제목</th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">카테고리</th>
                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">작성자</th>
                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">작성일</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">상태</th>
                <th className="px-4 md:px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    로딩 중...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-red-400">
                    {error}
                  </td>
                </tr>
              ) : notices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    공지사항이 없습니다
                  </td>
                </tr>
              ) : (
                notices.map((notice, key) => (
                  <tr key={notice.viewHash} className="hover:bg-gray-800 transition-colors">
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-300">{(key + 1)}</td>
                    <td className="px-4 md:px-6 py-4 text-sm text-white">
                      <div className="font-medium flex items-center gap-2">
                        {notice.isImportant && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-red-600/20 text-red-400 rounded-full">중요</span>
                        )}
                        <span>{notice.title}</span>
                      </div>
                      <div className="md:hidden text-xs text-gray-400 mt-1">{notice.categoryText}</div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-medium bg-indigo-600/20 text-indigo-400 rounded-full">
                        {notice.categoryText}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-300">{notice.author}</td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(notice.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        notice.isActive
                          ? "bg-green-600/20 text-green-400"
                          : "bg-gray-600/20 text-gray-400"
                      }`}>
                        {notice.isActive ? "활성" : "비활성"}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(notice)}
                          className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleToggleStatus(notice.viewHash)}
                          className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                        >
                          {notice.isActive ? '삭제' : '복원'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 작성 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">
                {formData.viewHash !== null ? "공지사항 수정" : "공지사항 작성"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">제목 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="공지사항 제목을 입력하세요"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">카테고리 *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                  disabled={categoriesLoading}
                >
                  <option value="">선택하세요</option>
                  {categories.map((cat: NoticeCategoryItem) => (
                    <option key={cat.id} value={cat.id}>{cat.value}</option>
                  ))}
                </select>
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">내용 *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="공지사항 내용을 입력하세요"
                  rows={8}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  required
                />
              </div>

              {/* 활성화 여부 */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isImportant"
                  checked={formData.isImportant}
                  onChange={(e) => setFormData({ ...formData, isImportant: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isImportant" className="text-sm text-gray-400">중요</label>
              </div>

              {/* 버튼 */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setFormData({
                      viewHash: null,
                      title: "",
                      content: "",
                      category: "",
                      author: "관리자",
                      isActive: true,
                      isImportant: false,
                    })
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
                >
                  {formData.viewHash !== null ? "수정" : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}