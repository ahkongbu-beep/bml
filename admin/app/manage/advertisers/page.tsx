// @/app/manage/advertisers/page.tsx
/* eslint-disable @next/next/no-img-element */
"use client"
import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdvertisers } from "@/hooks/useAdvertisers"
import { AdvertiserCreateParams, AdvertiserEditParams, AdvertiserSearchParams } from "@/libs/interface/advertisers"
import Pager from "@/components/pager"

export default function AdvertisersPage() {
  const router = useRouter()
  const { advertisers, loading, error, fetchAdvertisers, fetchAdvertiserDetail, createAdvertiser, editAdvertiser } = useAdvertisers()

  const [searchParams, setSearchParams] = useState<AdvertiserSearchParams>({
    account_id: "",
    company: "",
    company_number: "",
    page: 1,
    page_size: 20,
  })

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState<AdvertiserEditParams>({
    view_hash: "",
    account_id: "",
    account_name: "",
    company: "",
    account_tel: "",
    company_number: "",
    description: "",
    company_biz: "",
    company_item: "",
    account_image: null,
  })
  const [editPreviewUrl, setEditPreviewUrl] = useState("")

  const [formData, setFormData] = useState<AdvertiserCreateParams>({
    account_id: "",
    account_name: "",
    company: "",
    account_tel: "",
    company_number: "",
    description: "",
    company_biz: "",
    company_item: "",
    account_image: null,
  })

  const [previewUrl, setPreviewUrl] = useState("")

  const currentPage = searchParams.page || 1
  const pageSize = searchParams.page_size || 20
  const totalPages = useMemo(() => {
    const hasNext = advertisers.length >= pageSize
    return hasNext ? currentPage + 1 : currentPage
  }, [advertisers.length, currentPage, pageSize])

  const imageBase = process.env.NEXT_PUBLIC_API_BASE_URL || "https://dev.bml.co.kr";

  const resolveImageUrl = (imagePath?: string | null) => {
    if (!imagePath) return ""
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath

    const normalized = imagePath.startsWith("/") ? imagePath : `/${imagePath}`
    const hasExtension = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(normalized)

    if (hasExtension) {
      return `${imageBase}${normalized}`
    }

    if (normalized.startsWith("/attaches/")) {
      return `${imageBase}${normalized}_medium.webp`
    }

    return `${imageBase}${normalized}`
  }

  const loadAdvertisers = async (params?: AdvertiserSearchParams) => {
    const target = params || searchParams
    try {
      await fetchAdvertisers(target)
    } catch (err) {
      const message = err instanceof Error ? err.message : "광고주 조회에 실패했습니다."
      toast.error(message)
    }
  }

  useEffect(() => {
    loadAdvertisers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const params = { ...searchParams, page: 1 }
    setSearchParams(params)
    await loadAdvertisers(params)
  }

  const handleReset = async () => {
    const resetParams: AdvertiserSearchParams = {
      account_id: "",
      company: "",
      company_number: "",
      page: 1,
      page_size: 20,
    }
    setSearchParams(resetParams)
    await loadAdvertisers(resetParams)
  }

  const handlePageChange = async (page: number) => {
    if (page < 1) return
    const params = { ...searchParams, page }
    setSearchParams(params)
    await loadAdvertisers(params)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.account_id || !formData.account_name || !formData.company || !formData.company_number || !formData.description) {
      toast.error("필수 값을 모두 입력해주세요.")
      return
    }

    try {
      await createAdvertiser(formData)
      toast.success("광고주가 등록되었습니다.")
      setIsCreateModalOpen(false)
      setFormData({
        account_id: "",
        account_name: "",
        company: "",
        account_tel: "",
        company_number: "",
        description: "",
        company_biz: "",
        company_item: "",
        account_image: null,
      })
      setPreviewUrl("")
      await loadAdvertisers({ ...searchParams, page: 1 })
    } catch (err) {
      const message = err instanceof Error ? err.message : "광고주 등록에 실패했습니다."
      toast.error(message)
    }
  }

  const handleOpenEdit = async (viewHash: string) => {
    try {
      const detail = await fetchAdvertiserDetail(viewHash)
      setEditForm({
        view_hash: detail.view_hash,
        account_id: detail.account_id,
        account_name: detail.account_name,
        company: detail.company,
        account_tel: detail.account_tel || "",
        company_number: detail.company_number || "",
        description: detail.description || "",
        company_biz: detail.company_biz || "",
        company_item: detail.company_item || "",
        account_image: null,
      })
      setEditPreviewUrl(detail.account_image ? resolveImageUrl(detail.account_image) : "")
      setIsEditModalOpen(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "광고주 조회에 실패했습니다."
      toast.error(message)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm.account_id || !editForm.account_name || !editForm.company || !editForm.company_number || !editForm.description) {
      toast.error("필수 값을 모두 입력해주세요.")
      return
    }
    try {
      await editAdvertiser(editForm)
      toast.success("광고주 정보가 수정되었습니다.")
      setIsEditModalOpen(false)
      setEditPreviewUrl("")
      await loadAdvertisers()
    } catch (err) {
      const message = err instanceof Error ? err.message : "광고주 수정에 실패했습니다."
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">광고주 관리</h2>
          <p className="text-sm md:text-base text-gray-400">광고주 등록, 검색, 상세 조회를 관리합니다</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
        >
          광고주 등록
        </button>
      </div>

      <div className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4">검색 필터</h3>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">광고주 ID</label>
              <input
                type="text"
                value={searchParams.account_id || ""}
                onChange={(e) => setSearchParams({ ...searchParams, account_id: e.target.value })}
                placeholder="account_id"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">회사명</label>
              <input
                type="text"
                value={searchParams.company || ""}
                onChange={(e) => setSearchParams({ ...searchParams, company: e.target.value })}
                placeholder="company"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">사업자 등록번호</label>
              <input
                type="text"
                value={searchParams.company_number || ""}
                onChange={(e) => setSearchParams({ ...searchParams, company_number: e.target.value })}
                placeholder="11-111111-1111"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? "검색 중..." : "검색"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              초기화
            </button>
          </div>
        </form>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">이미지</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">광고주 ID</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">담당자</th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">회사명</th>
                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">사업자번호</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">전화번호</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">이메일</th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">광고비 합계</th>
                <th className="px-4 md:px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading && advertisers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-400">로딩 중...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-red-400">{error}</td>
                </tr>
              ) : advertisers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-400">등록된 광고주가 없습니다</td>
                </tr>
              ) : (
                advertisers.map((advertiser) => {
                  const imageUrl = resolveImageUrl(advertiser.account_image)
                  return (
                    <tr key={advertiser.view_hash} className="hover:bg-gray-800 transition-colors">
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        {imageUrl ? (
                          <img src={imageUrl} alt={advertiser.account_name} className="w-12 h-12 rounded-lg object-cover bg-gray-700" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-700" />
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-white font-medium">{advertiser.account_id}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-300">{advertiser.account_name}</td>
                      <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-300">{advertiser.company}</td>
                      <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-300">{advertiser.company_number}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-300">{advertiser.account_tel}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-300">{advertiser.account_email}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-indigo-300 font-semibold">
                        {advertiser.total_ad_amount.toLocaleString("ko-KR")}원
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => router.push(`/manage/advertisers/${advertiser.view_hash}`)}
                            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                          >
                            상세보기
                          </button>
                          <button
                            onClick={() => handleOpenEdit(advertiser.view_hash)}
                            className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
                          >
                            수정
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-4 border-t border-gray-800">
          <Pager
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">광고주 등록</h3>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">광고주 ID *</label>
                  <input
                    type="text"
                    value={formData.account_id}
                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">광고 담당자 *</label>
                  <input
                    type="text"
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">회사명 *</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">회사 전화번호</label>
                  <input
                    type="text"
                    value={formData.account_tel}
                    onChange={(e) => setFormData({ ...formData, account_tel: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">사업자 등록 번호 *</label>
                  <input
                    type="text"
                    value={formData.company_number}
                    onChange={(e) => setFormData({ ...formData, company_number: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">회사 업종</label>
                  <input
                    type="text"
                    value={formData.company_biz || ""}
                    onChange={(e) => setFormData({ ...formData, company_biz: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">회사 종목</label>
                  <input
                    type="text"
                    value={formData.company_item || ""}
                    onChange={(e) => setFormData({ ...formData, company_item: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">광고주 이미지</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setFormData({ ...formData, account_image: file })
                      if (file) {
                        const localPreview = URL.createObjectURL(file)
                        setPreviewUrl(localPreview)
                      } else {
                        setPreviewUrl("")
                      }
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-600 file:px-3 file:py-1 file:text-sm file:text-white"
                  />
                </div>
              </div>

              {previewUrl && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">미리보기</p>
                  <img src={previewUrl} alt="preview" className="w-24 h-24 object-cover rounded-lg border border-gray-700" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">광고주 설명 *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    setPreviewUrl("")
                  }}
                  className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
                >
                  {loading ? "등록 중..." : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">광고주 수정</h3>
            </div>

            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">광고주 ID *</label>
                  <input
                    type="text"
                    value={editForm.account_id}
                    onChange={(e) => setEditForm({ ...editForm, account_id: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">광고 담당자 *</label>
                  <input
                    type="text"
                    value={editForm.account_name}
                    onChange={(e) => setEditForm({ ...editForm, account_name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">회사명 *</label>
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">회사 전화번호</label>
                  <input
                    type="text"
                    value={editForm.account_tel}
                    onChange={(e) => setEditForm({ ...editForm, account_tel: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">사업자 등록 번호 *</label>
                  <input
                    type="text"
                    value={editForm.company_number}
                    onChange={(e) => setEditForm({ ...editForm, company_number: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">회사 업종</label>
                  <input
                    type="text"
                    value={editForm.company_biz || ""}
                    onChange={(e) => setEditForm({ ...editForm, company_biz: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">회사 종목</label>
                  <input
                    type="text"
                    value={editForm.company_item || ""}
                    onChange={(e) => setEditForm({ ...editForm, company_item: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">광고주 이미지 변경</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setEditForm({ ...editForm, account_image: file })
                      if (file) {
                        setEditPreviewUrl(URL.createObjectURL(file))
                      }
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 file:mr-4 file:rounded-md file:border-0 file:bg-amber-600 file:px-3 file:py-1 file:text-sm file:text-white"
                  />
                </div>
              </div>

              {editPreviewUrl && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">이미지 미리보기</p>
                  <img src={editPreviewUrl} alt="preview" className="w-24 h-24 object-cover rounded-lg border border-gray-700" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">광고주 설명 *</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditPreviewUrl("")
                  }}
                  className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-50"
                >
                  {loading ? "수정 중..." : "수정"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

  )
}