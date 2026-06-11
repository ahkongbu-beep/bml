"use client"
import React, { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { useAds } from "@/hooks/useAds"
import { useAdvertisers } from "@/hooks/useAdvertisers"
import { AdvsCreateParams, AdvsEditParams, AdvsListItem, AdvsSearchParams } from "@/libs/interface/ads"
import { AdvertiserListItem } from "@/libs/interface/advertisers"

const INITIAL_FORM: Omit<AdvsCreateParams, "image_files"> = {
  advertiser_hash: "",
  amount: 0,
  start_date: "",
  end_date: "",
  target_link: "",
  contents: "",
  is_active: "Y",
}

const toDateInputValue = (value: string) => {
  if (!value) return ""
  return new Date(value).toISOString().slice(0, 10)
}

const toNumberText = (value: number) => value.toLocaleString("ko-KR")
const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://dev.bml.co.kr"

const resolveAdImageUrl = (imagePath: string) => {
  if (!imagePath) return ""
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath

  const normalized = imagePath.startsWith("/") ? imagePath : `/${imagePath}`
  const hasExtension = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(normalized)

  if (hasExtension) {
    return `${backendBaseUrl}${normalized}`
  }

  if (normalized.startsWith("/attaches/")) {
    return `${backendBaseUrl}${normalized}_medium.webp`
  }

  return `${backendBaseUrl}${normalized}`
}

type AdvertiserSearchValue = number | string | ""

interface AdvertiserLiveSearchSelectProps {
  advertisers: AdvertiserListItem[]
  mode: "id" | "hash"
  value: AdvertiserSearchValue
  onChange: (value: AdvertiserSearchValue) => void
  placeholder?: string
  includeAllOption?: boolean
  allOptionLabel?: string
}

const getAdvertiserLabel = (advertiser: AdvertiserListItem) => `${advertiser.company} (${advertiser.account_id})`

function AdvertiserLiveSearchSelect({
  advertisers,
  mode,
  value,
  onChange,
  placeholder = "광고주 검색",
  includeAllOption = false,
  allOptionLabel = "전체",
}: AdvertiserLiveSearchSelectProps) {
  const [keyword, setKeyword] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const selectedAdvertiser = useMemo(() => {
    return advertisers.find((advertiser) => {
      if (mode === "id") {
        return advertiser.account_id === value
      }
      return advertiser.view_hash === value
    })
  }, [advertisers, mode, value])

  useEffect(() => {
    if (!value) {
      setKeyword("")
      return
    }

    if (selectedAdvertiser) {
      setKeyword(getAdvertiserLabel(selectedAdvertiser))
    }
  }, [selectedAdvertiser, value])

  const filteredAdvertisers = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return advertisers

    return advertisers.filter((advertiser) => {
      return (
        advertiser.company.toLowerCase().includes(normalized) ||
        advertiser.account_id.toLowerCase().includes(normalized) ||
        advertiser.account_name.toLowerCase().includes(normalized)
      )
    })
  }, [advertisers, keyword])

  const selectAdvertiser = (advertiser: AdvertiserListItem) => {
    const nextValue = mode === "id" ? advertiser.account_id : advertiser.view_hash
    setKeyword(getAdvertiserLabel(advertiser))
    onChange(nextValue)
    setIsOpen(false)
  }

  const clearSelection = () => {
    setKeyword("")
    onChange("")
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={keyword}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setKeyword(e.target.value)
          setIsOpen(true)
          onChange("")
        }}
        placeholder={placeholder}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
      />

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-gray-700 bg-gray-900 shadow-xl">
          {includeAllOption && (
            <button
              type="button"
              className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
              onMouseDown={(e) => {
                e.preventDefault()
                clearSelection()
              }}
            >
              {allOptionLabel}
            </button>
          )}

          {filteredAdvertisers.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-400">검색 결과가 없습니다</div>
          ) : (
            filteredAdvertisers.map((advertiser) => (
              <button
                key={advertiser.view_hash}
                type="button"
                className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
                onMouseDown={(e) => {
                  e.preventDefault()
                  selectAdvertiser(advertiser)
                }}
              >
                {getAdvertiserLabel(advertiser)}
              </button>
            ))
          )}
        </div>
      )}

      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-10"
          onClick={() => setIsOpen(false)}
          aria-label="광고주 검색 닫기"
        />
      )}
    </div>
  )
}

export default function AdsPage() {
  const { ads, totalCount, loading, error, fetchAds, createAd, editAd } = useAds()
  const { advertisers, fetchAdvertisers } = useAdvertisers()

  const [searchParams, setSearchParams] = useState<AdvsSearchParams>({
    advertiser_id: undefined,
    start_date: "",
    end_date: "",
    page: 1,
    page_size: 20,
  })

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedAd, setSelectedAd] = useState<AdvsListItem | null>(null)
  const [detailImageIndex, setDetailImageIndex] = useState(0)
  const [imageFiles, setImageFiles] = useState<File[]>([])

  const [formData, setFormData] = useState<Omit<AdvsCreateParams, "image_files">>(INITIAL_FORM)
  const [editData, setEditData] = useState<AdvsEditParams>({
    view_hash: "",
    ...INITIAL_FORM,
  })

  const currentPage = searchParams.page || 1
  const pageSize = searchParams.page_size || 20
  const totalPages = useMemo(() => {
    const pages = Math.ceil(totalCount / pageSize)
    return pages > 0 ? pages : 1
  }, [totalCount, pageSize])

  const loadAds = async (params?: AdvsSearchParams) => {
    const target = params || searchParams
    try {
      await fetchAds(target)
    } catch (err) {
      const message = err instanceof Error ? err.message : "광고 조회에 실패했습니다."
      toast.error(message)
    }
  }

  useEffect(() => {
    loadAds()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchAdvertisers({ page: 1, page_size: 200 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const params = { ...searchParams, page: 1 }
    setSearchParams(params)
    await loadAds(params)
  }

  const handleReset = async () => {
    const params: AdvsSearchParams = {
      advertiser_id: undefined,
      start_date: "",
      end_date: "",
      page: 1,
      page_size: 20,
    }
    setSearchParams(params)
    await loadAds(params)
  }

  const handlePageChange = async (page: number) => {
    if (page < 1 || page > totalPages) return
    const params = { ...searchParams, page }
    setSearchParams(params)
    await loadAds(params)
  }

  const handleOpenCreate = () => {
    setFormData(INITIAL_FORM)
    setImageFiles([])
    setIsCreateModalOpen(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.advertiser_hash || !formData.amount || !formData.start_date || !formData.end_date) {
      toast.error("광고주, 금액, 시작일, 종료일은 필수입니다.")
      return
    }

    try {
      await createAd({ ...formData, image_files: imageFiles })
      toast.success("광고가 등록되었습니다.")
      setIsCreateModalOpen(false)
      setFormData(INITIAL_FORM)
      setImageFiles([])
      await loadAds({ ...searchParams, page: 1 })
    } catch (err) {
      const message = err instanceof Error ? err.message : "광고 등록에 실패했습니다."
      toast.error(message)
    }
  }

  const handleOpenDetail = (ad: AdvsListItem) => {
    setSelectedAd(ad)
    setDetailImageIndex(0)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false)
    setDetailImageIndex(0)
  }

  const handleOpenEdit = (ad: AdvsListItem) => {
    setEditData({
      view_hash: ad.view_hash,
      advertiser_hash: ad.advertiser_view_hash,
      amount: ad.amount,
      start_date: toDateInputValue(ad.start_date),
      end_date: toDateInputValue(ad.end_date),
      target_link: ad.target_link || "",
      contents: ad.contents || "",
      is_active: ad.is_active,
    })
    setImageFiles([])
    setIsEditModalOpen(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editData.advertiser_hash || !editData.amount || !editData.start_date || !editData.end_date) {
      toast.error("광고주, 금액, 시작일, 종료일은 필수입니다.")
      return
    }

    try {
      await editAd({ ...editData, image_files: imageFiles })
      toast.success("광고가 수정되었습니다.")
      setIsEditModalOpen(false)
      setImageFiles([])
      await loadAds()
    } catch (err) {
      const message = err instanceof Error ? err.message : "광고 수정에 실패했습니다."
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">광고 관리</h2>
          <p className="text-sm md:text-base text-gray-400">광고 리스트 조회 및 등록/수정을 관리합니다</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4">검색 필터</h3>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">광고주</label>
              <AdvertiserLiveSearchSelect
                advertisers={advertisers}
                mode="id"
                value={searchParams.advertiser_id ?? ""}
                includeAllOption
                allOptionLabel="전체"
                placeholder="회사명/계정ID 검색"
                onChange={(next) => {
                  setSearchParams({
                    ...searchParams,
                    advertiser_id: typeof next === "number" ? next : undefined,
                  })
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">시작일</label>
              <input
                type="date"
                value={searchParams.start_date || ""}
                onChange={(e) => setSearchParams({ ...searchParams, start_date: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">종료일</label>
              <input
                type="date"
                value={searchParams.end_date || ""}
                onChange={(e) => setSearchParams({ ...searchParams, end_date: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
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
        <div className="px-4 md:px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">광고 리스트</h3>
          <button
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            광고 등록
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">광고주</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">기간</th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">금액</th>
                <th className="px-4 md:px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">클릭수</th>
                <th className="px-4 md:px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">상태</th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">로딩 중...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-red-400">{error}</td>
                </tr>
              ) : ads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">등록된 광고가 없습니다</td>
                </tr>
              ) : (
                ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-800 transition-colors">
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-300">{ad.id}</td>
                    <td className="px-4 md:px-6 py-4 text-sm text-white">
                      <div className="font-medium">{ad.company || "-"}</div>
                      <div className="text-xs text-gray-400">{ad.account_id || ad.account_name || "-"}</div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {toDateInputValue(ad.start_date)} ~ {toDateInputValue(ad.end_date)}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-right text-gray-300">
                      {toNumberText(ad.amount)}원
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-center text-sm text-gray-300">{ad.click_count}</td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        ad.is_active === "Y" ? "bg-green-600/20 text-green-400" : "bg-gray-600/20 text-gray-300"
                      }`}>
                        {ad.is_active === "Y" ? "활성" : "비활성"}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenDetail(ad)}
                          className="px-3 py-1.5 text-xs rounded-md bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                        >
                          조회
                        </button>
                        <button
                          onClick={() => handleOpenEdit(ad)}
                          className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                        >
                          수정
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

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1 rounded-md bg-gray-800 text-white disabled:opacity-40"
          >
            이전
          </button>
          <span className="px-3 py-1 text-sm text-gray-300">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 rounded-md bg-gray-800 text-white disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}

      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-white">{isCreateModalOpen ? "광고 등록" : "광고 수정"}</h4>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setIsEditModalOpen(false)
                  setImageFiles([])
                }}
                className="text-gray-400 hover:text-white"
              >
                닫기
              </button>
            </div>

            <form onSubmit={isCreateModalOpen ? handleCreate : handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">광고주</label>
                <AdvertiserLiveSearchSelect
                  advertisers={advertisers}
                  mode="hash"
                  value={isCreateModalOpen ? formData.advertiser_hash : editData.advertiser_hash}
                  placeholder="회사명/계정ID 검색"
                  onChange={(next) => {
                    const selectedHash = typeof next === "string" ? next : ""
                    if (isCreateModalOpen) {
                      setFormData({ ...formData, advertiser_hash: selectedHash })
                    } else {
                      setEditData({ ...editData, advertiser_hash: selectedHash })
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">금액</label>
                  <input
                    type="number"
                    min={0}
                    value={isCreateModalOpen ? formData.amount : editData.amount}
                    onChange={(e) => {
                      const next = Number(e.target.value || 0)
                      if (isCreateModalOpen) {
                        setFormData({ ...formData, amount: next })
                      } else {
                        setEditData({ ...editData, amount: next })
                      }
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">상태</label>
                  <select
                    value={isCreateModalOpen ? formData.is_active : editData.is_active}
                    onChange={(e) => {
                      const value = e.target.value as "Y" | "N"
                      if (isCreateModalOpen) {
                        setFormData({ ...formData, is_active: value })
                      } else {
                        setEditData({ ...editData, is_active: value })
                      }
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Y">활성</option>
                    <option value="N">비활성</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">시작일</label>
                  <input
                    type="date"
                    value={isCreateModalOpen ? formData.start_date : editData.start_date}
                    onChange={(e) => {
                      if (isCreateModalOpen) {
                        setFormData({ ...formData, start_date: e.target.value })
                      } else {
                        setEditData({ ...editData, start_date: e.target.value })
                      }
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">종료일</label>
                  <input
                    type="date"
                    value={isCreateModalOpen ? formData.end_date : editData.end_date}
                    onChange={(e) => {
                      if (isCreateModalOpen) {
                        setFormData({ ...formData, end_date: e.target.value })
                      } else {
                        setEditData({ ...editData, end_date: e.target.value })
                      }
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">타겟 링크</label>
                <input
                  type="text"
                  value={isCreateModalOpen ? formData.target_link || "" : editData.target_link || ""}
                  onChange={(e) => {
                    if (isCreateModalOpen) {
                      setFormData({ ...formData, target_link: e.target.value })
                    } else {
                      setEditData({ ...editData, target_link: e.target.value })
                    }
                  }}
                  placeholder="https://example.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">광고 내용</label>
                <textarea
                  value={isCreateModalOpen ? formData.contents || "" : editData.contents || ""}
                  onChange={(e) => {
                    if (isCreateModalOpen) {
                      setFormData({ ...formData, contents: e.target.value })
                    } else {
                      setEditData({ ...editData, contents: e.target.value })
                    }
                  }}
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">이미지 파일 (최대 10개)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white file:mr-3 file:rounded-md file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-white"
                />
                {imageFiles.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">선택된 파일: {imageFiles.length}개</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    setIsEditModalOpen(false)
                    setImageFiles([])
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                >
                  {loading ? "저장 중..." : isCreateModalOpen ? "등록" : "수정"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailModalOpen && selectedAd && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold text-white">광고 상세 조회</h4>
              <button onClick={handleCloseDetail} className="text-gray-400 hover:text-white">닫기</button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <span className="text-gray-400">광고 ID</span>
                <span className="col-span-2 text-white">{selectedAd.id}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <span className="text-gray-400">광고주</span>
                <span className="col-span-2 text-white">{selectedAd.company || "-"} ({selectedAd.account_id || "-"})</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <span className="text-gray-400">기간</span>
                <span className="col-span-2 text-white">{toDateInputValue(selectedAd.start_date)} ~ {toDateInputValue(selectedAd.end_date)}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <span className="text-gray-400">금액</span>
                <span className="col-span-2 text-white">{toNumberText(selectedAd.amount)}원</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <span className="text-gray-400">클릭 수</span>
                <span className="col-span-2 text-white">{selectedAd.click_count}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <span className="text-gray-400">상태</span>
                <span className="col-span-2 text-white">{selectedAd.is_active === "Y" ? "활성" : "비활성"}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <span className="text-gray-400">링크</span>
                <span className="col-span-2 text-white break-all">{selectedAd.target_link || "-"}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <span className="text-gray-400">내용</span>
                <p className="col-span-2 text-white whitespace-pre-wrap">{selectedAd.contents || "-"}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <span className="text-gray-400">이미지</span>
                <div className="col-span-2">
                  {!selectedAd.ad_images || selectedAd.ad_images.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-700 bg-gray-800/50 py-8 text-center text-gray-400">
                      등록된 이미지가 없습니다
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-2">
                      <div className="group relative block overflow-hidden rounded-lg">
                        <img
                          src={resolveAdImageUrl(selectedAd.ad_images[detailImageIndex] || selectedAd.ad_images[0])}
                          alt="대표 광고 이미지"
                          className="w-full h-44 md:h-52 object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                        <div className="absolute left-3 bottom-3 inline-flex items-center gap-2">
                          <span className="rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">대표 이미지</span>
                          <span className="rounded-md bg-indigo-600/90 px-2 py-1 text-xs font-medium text-white">
                            총 {selectedAd.ad_images.length}장
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {selectedAd.ad_images.map((imagePath, idx) => {
                          const imageUrl = resolveAdImageUrl(imagePath)
                          const isSelected = idx === detailImageIndex
                          return (
                            <button
                              key={`${imagePath}-${idx}`}
                              type="button"
                              onClick={() => setDetailImageIndex(idx)}
                              className={`group relative block overflow-hidden rounded-md border transition-colors ${
                                isSelected ? "border-indigo-500 ring-2 ring-indigo-500/40" : "border-gray-700 hover:border-indigo-500"
                              }`}
                            >
                              <img
                                src={imageUrl}
                                alt={`광고 이미지 ${idx + 1}`}
                                className="w-full h-20 object-cover transition-transform duration-300 group-hover:scale-110"
                                loading="lazy"
                              />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}