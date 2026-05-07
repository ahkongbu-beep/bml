// @/app/manage/advertisers/[hash]/page.tsx
/* eslint-disable @next/next/no-img-element */
"use client"
import React, { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { FRONTEND_ROUTES } from "@/libs/utils/apiRouter"
import toast from "react-hot-toast"

interface AdRecord {
  id: number
  amount: number
  start_date: string
  end_date: string
  is_active?: "Y" | "N"
  contents: string
  view_hash: string
  ad_images?: string[]
}

interface AdvertiserAccount {
  account_id: string
  account_name: string
  company: string
  view_hash: string
  account_email: string | null
  account_image: string | null
  account_tel: string | null
  company_number: string | null
  company_biz: string | null
  company_item: string | null
  description: string | null
}

interface AdvertiserDetailData {
  account: AdvertiserAccount
  total_amount: string | number
  ads: AdRecord[]
}

interface AdForm {
  amount: string
  start_date: string
  end_date: string
  contents: string
  image_files: File[]
}

interface AdEditForm extends AdForm {
  view_hash: string
  is_active: "Y" | "N"
}

const DEFAULT_AD_FORM: AdForm = {
  amount: "",
  start_date: "",
  end_date: "",
  contents: "",
  image_files: [],
}

const DEFAULT_AD_EDIT_FORM: AdEditForm = {
  view_hash: "",
  amount: "",
  start_date: "",
  end_date: "",
  contents: "",
  is_active: "Y",
  image_files: [],
}

export default function AdvertiserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const hash = params?.hash as string

  const [data, setData] = useState<AdvertiserDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdModalOpen, setIsAdModalOpen] = useState(false)
  const [isAdEditModalOpen, setIsAdEditModalOpen] = useState(false)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [viewerImages, setViewerImages] = useState<string[]>([])
  const [viewerIndex, setViewerIndex] = useState(0)
  const [adForm, setAdForm] = useState<AdForm>(DEFAULT_AD_FORM)
  const [editAdForm, setEditAdForm] = useState<AdEditForm>(DEFAULT_AD_EDIT_FORM)
  const [adSubmitting, setAdSubmitting] = useState(false)
  const [editAdSubmitting, setEditAdSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const touchStartXRef = useRef<number | null>(null)
  const touchEndXRef = useRef<number | null>(null)

  const imageBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

  const resolveImageUrl = (imagePath?: string | null) => {
    if (!imagePath) return ""
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath
    const normalized = imagePath.startsWith("/") ? imagePath : `/${imagePath}`
    if (normalized.startsWith("/attaches/")) return `${imageBase}${normalized}_medium.webp`
    return `${imageBase}${normalized}`
  }

  const formatDate = (isoString: string) => {
    return isoString.split("T")[0]
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${FRONTEND_ROUTES.ADVERTISERS()}?view_hash=${encodeURIComponent(hash)}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.message || "조회 실패")
      setData(json.data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "광고주 상세 조회에 실패했습니다."
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hash) return
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash])

  const handleAdImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const combined = [...adForm.image_files, ...files].slice(0, 10)
    setAdForm({ ...adForm, image_files: combined })
  }

  const removeAdImage = (idx: number) => {
    const updated = adForm.image_files.filter((_, i) => i !== idx)
    setAdForm({ ...adForm, image_files: updated })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleEditAdImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const combined = [...editAdForm.image_files, ...files].slice(0, 10)
    setEditAdForm({ ...editAdForm, image_files: combined })
  }

  const removeEditAdImage = (idx: number) => {
    const updated = editAdForm.image_files.filter((_, i) => i !== idx)
    setEditAdForm({ ...editAdForm, image_files: updated })
    if (editFileInputRef.current) editFileInputRef.current.value = ""
  }

  const openEditAdModal = (ad: AdRecord) => {
    setEditAdForm({
      view_hash: ad.view_hash,
      amount: String(ad.amount),
      start_date: formatDate(ad.start_date),
      end_date: formatDate(ad.end_date),
      contents: ad.contents || "",
      is_active: ad.is_active === "N" ? "N" : "Y",
      image_files: [],
    })
    setIsAdEditModalOpen(true)
  }

  const openImageViewer = (images: string[], index: number) => {
    if (!images || images.length === 0) return
    setViewerImages(images)
    setViewerIndex(index)
    setIsImageViewerOpen(true)
  }

  const closeImageViewer = () => {
    setIsImageViewerOpen(false)
    setViewerImages([])
    setViewerIndex(0)
  }

  const showPrevImage = () => {
    if (viewerImages.length === 0) return
    setViewerIndex((prev) => (prev - 1 + viewerImages.length) % viewerImages.length)
  }

  const showNextImage = () => {
    if (viewerImages.length === 0) return
    setViewerIndex((prev) => (prev + 1) % viewerImages.length)
  }

  const handleViewerTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null
    touchEndXRef.current = null
  }

  const handleViewerTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    touchEndXRef.current = e.touches[0]?.clientX ?? null
  }

  const handleViewerTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return
    const diff = touchStartXRef.current - touchEndXRef.current
    const threshold = 40
    if (Math.abs(diff) < threshold) return

    if (diff > 0) {
      showNextImage()
    } else {
      showPrevImage()
    }
  }

  const handleAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adForm.amount || !adForm.start_date || !adForm.end_date) {
      toast.error("금액, 시작일, 종료일은 필수입니다.")
      return
    }
    if (!data) return

    setAdSubmitting(true)
    try {
      const fd = new FormData()
      fd.append("advertiser_hash", data.account.view_hash)
      fd.append("amount", adForm.amount)
      fd.append("start_date", adForm.start_date)
      fd.append("end_date", adForm.end_date)
      if (adForm.contents) fd.append("contents", adForm.contents)
      for (const file of adForm.image_files) {
        fd.append("image_files", file)
      }

      const res = await fetch(FRONTEND_ROUTES.ADS(), { method: "POST", body: fd })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || "광고 등록 실패")

      toast.success("광고가 등록되었습니다.")
      setIsAdModalOpen(false)
      setAdForm(DEFAULT_AD_FORM)
      if (fileInputRef.current) fileInputRef.current.value = ""
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : "광고 등록에 실패했습니다."
      toast.error(message)
    } finally {
      setAdSubmitting(false)
    }
  }

  const handleEditAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editAdForm.amount || !editAdForm.start_date || !editAdForm.end_date) {
      toast.error("금액, 시작일, 종료일은 필수입니다.")
      return
    }
    if (!data || !editAdForm.view_hash) return

    setEditAdSubmitting(true)
    try {
      const fd = new FormData()
      fd.append("advertiser_hash", data.account.view_hash)
      fd.append("amount", editAdForm.amount)
      fd.append("start_date", editAdForm.start_date)
      fd.append("end_date", editAdForm.end_date)
      fd.append("is_active", editAdForm.is_active)
      if (editAdForm.contents) fd.append("contents", editAdForm.contents)
      for (const file of editAdForm.image_files) {
        fd.append("image_files", file)
      }

      const res = await fetch(`${FRONTEND_ROUTES.ADS()}?view_hash=${encodeURIComponent(editAdForm.view_hash)}`, {
        method: "PUT",
        body: fd,
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || "광고 수정 실패")

      toast.success("광고가 수정되었습니다.")
      setIsAdEditModalOpen(false)
      setEditAdForm(DEFAULT_AD_EDIT_FORM)
      if (editFileInputRef.current) editFileInputRef.current.value = ""
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : "광고 수정에 실패했습니다."
      toast.error(message)
    } finally {
      setEditAdSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-400">데이터를 불러올 수 없습니다.</p>
      </div>
    )
  }

  const { account, total_amount, ads } = data
  const imageUrl = resolveImageUrl(account.account_image)
  const totalAmount = Number(total_amount) || 0

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors text-sm"
        >
          ← 목록으로
        </button>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">광고주 상세</h2>
        </div>
      </div>

      {/* 광고주 정보 */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-6">
        <div className="flex items-center gap-5">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={account.account_name}
              className="w-20 h-20 rounded-xl object-cover bg-gray-700 flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gray-700 flex-shrink-0" />
          )}
          <div>
            <p className="text-2xl font-bold text-white">{account.company}</p>
            <p className="text-sm text-gray-400 mt-1">담당자: {account.account_name}</p>
            <p className="text-sm text-gray-400">ID: {account.account_id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-800/60 rounded-lg p-4">
            <p className="text-gray-400 mb-1">회사 전화번호</p>
            <p className="text-white">{account.account_tel || "-"}</p>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-4">
            <p className="text-gray-400 mb-1">사업자 등록번호</p>
            <p className="text-white">{account.company_number || "-"}</p>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-4">
            <p className="text-gray-400 mb-1">광고비 합계</p>
            <p className="text-indigo-300 font-semibold">{totalAmount.toLocaleString("ko-KR")}원</p>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-4">
            <p className="text-gray-400 mb-1">회사 업종</p>
            <p className="text-white">{account.company_biz || "-"}</p>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-4">
            <p className="text-gray-400 mb-1">회사 종목</p>
            <p className="text-white">{account.company_item || "-"}</p>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-4">
            <p className="text-gray-400 mb-1">이메일</p>
            <p className="text-white">{account.account_email || "-"}</p>
          </div>
        </div>

        {account.description && (
          <div className="bg-gray-800/60 rounded-lg p-4 text-sm">
            <p className="text-gray-400 mb-2">비고</p>
            <p className="text-white whitespace-pre-wrap">{account.description}</p>
          </div>
        )}
      </div>

      {/* 광고 내역 */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-white">광고 내역</h3>
            <span className="text-sm text-gray-400">총 {ads.length}건</span>
          </div>
          <button
            onClick={() => setIsAdModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            광고 등록
          </button>
        </div>

        {ads.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">등록된 광고가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">광고 금액</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">시작일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">종료일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">활성</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">광고 내용</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">이미지</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {ads.map((ad, idx) => (
                  (() => {
                    const adImages = ad.ad_images || []
                    return (
                  <tr key={ad.view_hash} className="hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-400">{idx + 1}</td>
                    <td className="px-6 py-4 text-sm text-indigo-300 font-semibold whitespace-nowrap">
                      {ad.amount.toLocaleString("ko-KR")}원
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">{formatDate(ad.start_date)}</td>
                    <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">{formatDate(ad.end_date)}</td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${ad.is_active === "N" ? "bg-red-900/40 text-red-300" : "bg-emerald-900/40 text-emerald-300"}`}>
                        {ad.is_active === "N" ? "비활성" : "활성"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 max-w-xs">
                      <p className="whitespace-pre-wrap line-clamp-2">{ad.contents}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {adImages.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openImageViewer(adImages, 0)}
                            className="w-10 h-10 rounded-md overflow-hidden border border-gray-700 hover:border-indigo-400 transition-colors"
                          >
                            <img
                              src={resolveImageUrl(adImages[0])}
                              alt={`ad-${ad.id}-0`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                          {adImages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => openImageViewer(adImages, 1)}
                              className="text-xs text-gray-300 hover:text-white underline underline-offset-2"
                            >
                              외 {adImages.length - 1}개
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditAdModal(ad)}
                        className="text-amber-300 hover:text-amber-200 underline underline-offset-2"
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                    )
                  })()
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isImageViewerOpen && viewerImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
          onClick={closeImageViewer}
        >
          <div
            className="w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-300">
                {viewerIndex + 1} / {viewerImages.length}
              </p>
              <button
                type="button"
                onClick={closeImageViewer}
                className="text-gray-300 hover:text-white text-sm"
              >
                닫기
              </button>
            </div>

            <div
              className="relative bg-black rounded-xl border border-gray-800 overflow-hidden"
              onTouchStart={handleViewerTouchStart}
              onTouchMove={handleViewerTouchMove}
              onTouchEnd={handleViewerTouchEnd}
            >
              <img
                src={resolveImageUrl(viewerImages[viewerIndex])}
                alt={`viewer-${viewerIndex}`}
                className="w-full max-h-[70vh] object-contain mx-auto"
              />

              {viewerImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={showNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {viewerImages.length > 1 && (
              <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                {viewerImages.map((imgPath, idx) => (
                  <button
                    key={`${imgPath}-${idx}`}
                    type="button"
                    onClick={() => setViewerIndex(idx)}
                    className={`w-12 h-12 rounded-md overflow-hidden border ${idx === viewerIndex ? "border-indigo-400" : "border-gray-700"}`}
                  >
                    <img
                      src={resolveImageUrl(imgPath)}
                      alt={`thumb-${idx}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 광고 수정 모달 */}
      {isAdEditModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">광고 수정</h3>
            </div>

            <form onSubmit={handleEditAdSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">광고 금액 (원) *</label>
                <input
                  type="number"
                  min={0}
                  value={editAdForm.amount}
                  onChange={(e) => setEditAdForm({ ...editAdForm, amount: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">시작일 *</label>
                  <input
                    type="date"
                    value={editAdForm.start_date}
                    onChange={(e) => setEditAdForm({ ...editAdForm, start_date: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">종료일 *</label>
                  <input
                    type="date"
                    value={editAdForm.end_date}
                    onChange={(e) => setEditAdForm({ ...editAdForm, end_date: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">활성 여부 *</label>
                <select
                  value={editAdForm.is_active}
                  onChange={(e) => setEditAdForm({ ...editAdForm, is_active: e.target.value as "Y" | "N" })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="Y">Y (활성)</option>
                  <option value="N">N (비활성)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">광고 내용</label>
                <textarea
                  value={editAdForm.contents}
                  onChange={(e) => setEditAdForm({ ...editAdForm, contents: e.target.value })}
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">이미지 추가 업로드 (최대 10개)</label>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleEditAdImageChange}
                  disabled={editAdForm.image_files.length >= 10}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 file:mr-4 file:rounded-md file:border-0 file:bg-amber-600 file:px-3 file:py-1 file:text-sm file:text-white disabled:opacity-50"
                />
                {editAdForm.image_files.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {editAdForm.image_files.map((file, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-700"
                        />
                        <button
                          type="button"
                          onClick={() => removeEditAdImage(idx)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdEditModalOpen(false)
                    setEditAdForm(DEFAULT_AD_EDIT_FORM)
                    if (editFileInputRef.current) editFileInputRef.current.value = ""
                  }}
                  className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={editAdSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  {editAdSubmitting ? "수정 중..." : "수정"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 광고 등록 모달 */}
      {isAdModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">광고 등록</h3>
              <p className="text-sm text-gray-400 mt-1">{account.company}</p>
            </div>

            <form onSubmit={handleAdSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">광고 금액 (원) *</label>
                <input
                  type="number"
                  min={0}
                  value={adForm.amount}
                  onChange={(e) => setAdForm({ ...adForm, amount: e.target.value })}
                  placeholder="예: 500000"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">시작일 *</label>
                  <input
                    type="date"
                    value={adForm.start_date}
                    onChange={(e) => setAdForm({ ...adForm, start_date: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">종료일 *</label>
                  <input
                    type="date"
                    value={adForm.end_date}
                    onChange={(e) => setAdForm({ ...adForm, end_date: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">광고 내용</label>
                <textarea
                  value={adForm.contents}
                  onChange={(e) => setAdForm({ ...adForm, contents: e.target.value })}
                  rows={4}
                  placeholder="광고 내용을 입력하세요"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  광고 이미지 <span className="text-gray-500">(최대 10개)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAdImageChange}
                  disabled={adForm.image_files.length >= 10}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-600 file:px-3 file:py-1 file:text-sm file:text-white disabled:opacity-50"
                />
                {adForm.image_files.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {adForm.image_files.map((file, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-700"
                        />
                        <button
                          type="button"
                          onClick={() => removeAdImage(idx)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdModalOpen(false)
                    setAdForm(DEFAULT_AD_FORM)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                  className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={adSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  {adSubmitting ? "등록 중..." : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}