"use client"
import React, { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { useAllergies } from "@/hooks/useAllergies"
import { AllergyItem } from "@/libs/interface/allergies"

const FOOD_TYPES = [
  { value: "ALLERGY", label: "알레르기" },
  { value: "DISLIKE", label: "비선호" },
]

export default function AllergiesPage() {
  const { allergies, loading, fetchAllergies, createAllergy, updateAllergy } = useAllergies()

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<AllergyItem | null>(null)
  const [formData, setFormData] = useState({
    food_name: "",
    food_type: "ALLERGY",
    icon: "",
  })

  useEffect(() => {
    fetchAllergies()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreateModal = () => {
    setEditItem(null)
    setFormData({ food_name: "", food_type: "ALLERGY", icon: "" })
    setIsModalOpen(true)
  }

  const openEditModal = (item: AllergyItem) => {
    setEditItem(item)
    setFormData({
      food_name: item.food_name,
      food_type: item.food_type,
      icon: item.icon || "",
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.food_name.trim()) {
      toast.error("음식 이름을 입력해주세요")
      return
    }

    if (editItem) {
      // 수정
      const result = await updateAllergy(editItem.food_code, {
        food_name: formData.food_name,
        food_type: formData.food_type,
        food_code: editItem.food_code,
        icon: formData.icon,
      })
      if (result) {
        toast.success("수정되었습니다")
        setIsModalOpen(false)
        fetchAllergies()
      } else {
        toast.error("수정에 실패했습니다")
      }
    } else {
      // 등록
      const result = await createAllergy({
        food_name: formData.food_name,
        food_type: formData.food_type,
        icon: formData.icon,
      })
      if (result) {
        toast.success("등록되었습니다")
        setIsModalOpen(false)
        fetchAllergies()
      } else {
        toast.error("등록에 실패했습니다")
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">알레르기 관리</h2>
          <p className="text-sm md:text-base text-gray-400">알레르기/비선호 음식 정보를 관리합니다</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
        >
          <span>➕</span>
          <span>새로 등록</span>
        </button>
      </div>

      {/* 리스트 테이블 */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : allergies.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            등록된 알레르기 정보가 없습니다
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/50">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">ID</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">아이콘</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">음식명</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">코드</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">타입</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-gray-400">관리</th>
                </tr>
              </thead>
              <tbody>
                {allergies.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-300">{item.id}</td>
                    <td className="px-6 py-4 text-sm">{item.icon || "-"}</td>
                    <td className="px-6 py-4 text-sm text-white font-medium">{item.food_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{item.food_code}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.food_type === "ALLERGY"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-orange-500/20 text-orange-400"
                      }`}>
                        {item.food_type === "ALLERGY" ? "알레르기" : "비선호"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openEditModal(item)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 등록/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              {editItem ? "알레르기 수정" : "알레르기 등록"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 아이콘 */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">아이콘 (이모지)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="🥜"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 음식명 */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">음식명</label>
                <input
                  type="text"
                  value={formData.food_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, food_name: e.target.value }))}
                  placeholder="음식 이름 입력"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 타입 */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">타입</label>
                <select
                  value={formData.food_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, food_type: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  {FOOD_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* food_code (수정 시 표시) */}
              {editItem && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">코드</label>
                  <input
                    type="text"
                    value={editItem.food_code}
                    disabled
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white opacity-70"
                  />
                </div>
              )}

              {/* 버튼 */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                  {editItem ? "수정" : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}