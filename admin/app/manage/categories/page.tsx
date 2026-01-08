// @/app/manage/categories/page.tsx
"use client"
import React, { useState, useEffect, useMemo } from "react"
import toast from "react-hot-toast"
import Cookies from "js-cookie"
import { useCategory } from "@/hooks/useCategory"
import { CategoryFormData } from "@/libs/interface/categories"
import Pager from "@/components/pager"

export default function CategoriesPage() {
  const { categories, loading, error, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategory()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [noticeCurrentPage, setNoticeCurrentPage] = useState(1)
  const [ageCurrentPage, setAgeCurrentPage] = useState(1)
  const [mealCurrentPage, setMealCurrentPage] = useState(1)

  const [isNoticeExpanded, setIsNoticeExpanded] = useState(() => {
    const saved = Cookies.get("noticeExpanded")
    return saved !== undefined ? saved === "true" : true
  })

  const [isAgeExpanded, setIsAgeExpanded] = useState(() => {
    const saved = Cookies.get("ageExpanded")
    return saved !== undefined ? saved === "true" : true
  })

  const [isDesktop, setIsDesktop] = useState(false)
  const [formData, setFormData] = useState<CategoryFormData>({
    type: "NOTICES_GROUP",
    value: "",
    sort: 1,
    is_active: "Y",
  })

  const ITEMS_PER_PAGE = 5

  // 화면 크기 감지
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  // 쿠키에 확장 상태 저장
  const toggleNoticeExpanded = () => {
    const newState = !isNoticeExpanded
    setIsNoticeExpanded(newState)
    Cookies.set("noticeExpanded", String(newState), { expires: 365 })
  }

  const toggleAgeExpanded = () => {
    const newState = !isAgeExpanded
    setIsAgeExpanded(newState)
    Cookies.set("ageExpanded", String(newState), { expires: 365 })
  }

  // 초기 데이터 로드
  useEffect(() => {
    fetchCategories()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 카테고리 타입별 필터링 및 페이징
  const mealCategories = useMemo(() => {
    return categories.filter(cat => cat.type === "MEALS_GROUP")
  }, [categories])

  const paginatedMealCategories = useMemo(() => {
    const startIndex = (mealCurrentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return mealCategories.slice(startIndex, endIndex)
  }, [mealCategories, mealCurrentPage])


  const noticeCategories = useMemo(() => {
    return categories.filter(cat => cat.type === "NOTICES_GROUP")
  }, [categories])

  const paginatedNoticeCategories = useMemo(() => {
    const startIndex = (noticeCurrentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return noticeCategories.slice(startIndex, endIndex)
  }, [noticeCategories, noticeCurrentPage])

  const ageCategories = useMemo(() => {
    return categories.filter(cat => cat.type === "AGE_GROUP")
  }, [categories])

  const paginatedAgeCategories = useMemo(() => {
    const startIndex = (ageCurrentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return ageCategories.slice(startIndex, endIndex)
  }, [ageCategories, ageCurrentPage])

  const noticeTotalPages = Math.ceil(noticeCategories.length / ITEMS_PER_PAGE)
  const ageTotalPages = Math.ceil(ageCategories.length / ITEMS_PER_PAGE)
  const mealTotalPages = Math.ceil(mealCategories.length / ITEMS_PER_PAGE)

  // 모달 열기 (신규 등록)
  const handleOpenModal = (type: "NOTICES_GROUP" | "AGE_GROUP" | "MEALS_GROUP") => {
    setEditingId(null)

    // 해당 타입의 카테고리 중 가장 큰 sort 값 찾기
    const typedCategories = categories.filter(cat => cat.type === type)
    const maxSort = typedCategories.length > 0
      ? Math.max(...typedCategories.map(cat => cat.sort))
      : 0

    setFormData({
      type: type,
      value: "",
      sort: maxSort + 1,
      is_active: "Y",
    })
    setIsModalOpen(true)
  }

  // 모달 열기 (수정)
  const handleEditModal = (id: number) => {
    const category = categories.find(cat => cat.id === id)
    if (!category) return

    setEditingId(id)
    setFormData({
      type: category.type,
      value: category.value,
      sort: category.sort,
      is_active: category.is_active,
    })
    setIsModalOpen(true)
  }

  // 카테고리 저장 (등록/수정)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.value.trim()) {
      toast.error("카테고리명을 입력해주세요")
      return
    }

    try {
      if (editingId) {
        await updateCategory(editingId, formData)
        toast.success("카테고리가 수정되었습니다")
      } else {
        await createCategory(formData)
        toast.success("카테고리가 등록되었습니다")
      }
      setIsModalOpen(false)
      fetchCategories()
      setNoticeCurrentPage(1)
      setAgeCurrentPage(1)
      setMealCurrentPage(1)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : (editingId ? "카테고리 수정에 실패했습니다" : "카테고리 등록에 실패했습니다")
      toast.error(errorMessage)
    }
  }

  // 카테고리 삭제
  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return

    try {
      await deleteCategory(id)
      toast.success("삭제되었습니다")
      fetchCategories()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "삭제에 실패했습니다"
      toast.error(errorMessage)
    }
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">카테고리 관리</h2>
        <p className="text-sm md:text-base text-gray-400">
          공지사항 및 연령구간 카테고리를 관리합니다 (총 {categories.length}개)
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">로딩 중...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-400">{error}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 공지 카테고리 섹션 */}
          <div className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={toggleNoticeExpanded}
                className="flex items-center gap-2 lg:cursor-default lg:pointer-events-none"
              >
                <span className="text-2xl">📢</span>
                <h3 className="text-lg font-bold text-white">공지 카테고리</h3>
                <span className="text-sm text-gray-500">({noticeCategories.length}개)</span>
                <span className="lg:hidden text-gray-400 ml-2 transition-transform duration-200" style={{ transform: isNoticeExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              <button
                onClick={() => handleOpenModal("NOTICES_GROUP")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-xl transition-colors flex items-center space-x-1 text-sm"
              >
                <span>➕</span>
                <span className="hidden sm:inline">추가</span>
              </button>
            </div>

            {(isNoticeExpanded || isDesktop) && (noticeCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                등록된 공지 카테고리가 없습니다
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedNoticeCategories.map((category) => (
                    <div
                      key={category.id}
                      className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-lg mb-1">{category.value}</h4>
                          <p className="text-gray-500 text-xs">코드: {category.code}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          category.is_active === "Y"
                            ? "bg-green-600/20 text-green-400"
                            : "bg-gray-600/20 text-gray-400"
                        }`}>
                          {category.is_active === "Y" ? "활성" : "비활성"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                        <span className="text-xs text-gray-500">순서: {category.sort}</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditModal(category.id)}
                            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {noticeTotalPages > 1 && (
                  <Pager
                    currentPage={noticeCurrentPage}
                    totalPages={noticeTotalPages}
                    onPageChange={setNoticeCurrentPage}
                    className="mt-8"
                  />
                )}
              </>
            ))}
          </div>

          {/* 연령구간 카테고리 섹션 */}
          <div className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={toggleAgeExpanded}
                className="flex items-center gap-2 lg:cursor-default lg:pointer-events-none"
              >
                <span className="text-2xl">👶</span>
                <h3 className="text-lg font-bold text-white">연령구간 카테고리</h3>
                <span className="text-sm text-gray-500">({ageCategories.length}개)</span>
                <span className="lg:hidden text-gray-400 ml-2 transition-transform duration-200" style={{ transform: isAgeExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              <button
                onClick={() => handleOpenModal("AGE_GROUP")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-xl transition-colors flex items-center space-x-1 text-sm"
              >
                <span>➕</span>
                <span className="hidden sm:inline">추가</span>
              </button>
            </div>

            {(isAgeExpanded || isDesktop) && (ageCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                등록된 연령구간 카테고리가 없습니다
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedAgeCategories.map((category) => (
                    <div
                      key={category.id}
                      className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-lg mb-1">{category.value}</h4>
                          <p className="text-gray-500 text-xs">코드: {category.code}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          category.is_active === "Y"
                            ? "bg-green-600/20 text-green-400"
                            : "bg-gray-600/20 text-gray-400"
                        }`}>
                          {category.is_active === "Y" ? "활성" : "비활성"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                        <span className="text-xs text-gray-500">순서: {category.sort}</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditModal(category.id)}
                            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {ageTotalPages > 1 && (
                  <Pager
                    className="mt-4"
                    currentPage={ageCurrentPage}
                    totalPages={ageTotalPages}
                    onPageChange={setAgeCurrentPage}
                  />
                )}
              </>
            ))}
          </div>

          {/* 식단 카테고리 섹션 */}
          <div className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={toggleAgeExpanded}
                className="flex items-center gap-2 lg:cursor-default lg:pointer-events-none"
              >
                <span className="text-2xl">👶</span>
                <h3 className="text-lg font-bold text-white">식단 카테고리</h3>
                <span className="text-sm text-gray-500">({mealCategories.length}개)</span>
                <span className="lg:hidden text-gray-400 ml-2 transition-transform duration-200" style={{ transform: isAgeExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              <button
                onClick={() => handleOpenModal("MEALS_GROUP")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-xl transition-colors flex items-center space-x-1 text-sm"
              >
                <span>➕</span>
                <span className="hidden sm:inline">추가</span>
              </button>
            </div>

            {(isAgeExpanded || isDesktop) && (ageCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                등록된 연령구간 카테고리가 없습니다
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedMealCategories.map((category) => (
                    <div
                      key={category.id}
                      className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-lg mb-1">{category.value}</h4>
                          <p className="text-gray-500 text-xs">코드: {category.code}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          category.is_active === "Y"
                            ? "bg-green-600/20 text-green-400"
                            : "bg-gray-600/20 text-gray-400"
                        }`}>
                          {category.is_active === "Y" ? "활성" : "비활성"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                        <span className="text-xs text-gray-500">순서: {category.sort}</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditModal(category.id)}
                            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {mealTotalPages > 1 && (
                  <Pager
                    className="mt-4"
                    currentPage={mealCurrentPage}
                    totalPages={mealTotalPages}
                    onPageChange={setMealCurrentPage}
                  />
                )}
              </>
            ))}
          </div>
        </div>
      )}

      {/* 등록/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">
                {editingId ? "카테고리 수정" : "카테고리 등록"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* 카테고리명 */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">카테고리명 *</label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="카테고리명을 입력하세요"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              {/* 카테고리 타입 */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">카테고리 타입 *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                  disabled={!!editingId}
                >
                  <option value="NOTICES_GROUP">📢 공지 카테고리</option>
                  <option value="AGE_GROUP">👶 연령구간 카테고리</option>
                  <option value="MEALS_GROUP">🍽️ 식단 카테고리</option>
                </select>
              </div>

              {/* 순서 */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">순서 *</label>
                <input
                  type="number"
                  value={formData.sort}
                  onChange={(e) => setFormData({ ...formData, sort: parseInt(e.target.value) || 1 })}
                  min={1}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              {/* 활성화 여부 */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active === "Y"}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? "Y" : "N" })}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-400">활성화</label>
              </div>

              {/* 버튼 */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
                >
                  {editingId ? "수정" : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


