"use client"
import React, { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { useIngredients } from "@/hooks/useIngredients"
import { IngredientRequest } from "@/libs/interface/ingredients"
import IngredientForm, { NUTRIENT_FIELDS } from "@/components/manage/IngredientForm"

export default function IngredientsPage() {
  const { ingredients, loading, fetchIngredients, updateStatus, approveIngredient } = useIngredients()
  const [filterStatus, setFilterStatus] = useState<string>("")

  // 승인 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<IngredientRequest | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [approveCategory, setApproveCategory] = useState("")
  const [nutrients, setNutrients] = useState<Record<string, number>>({
    protein: 0, fat: 0, carbohydrate: 0,
    vitamin_a: 0, vitamin_c: 0, potassium: 0, calcium: 0, iron: 0,
  })

  useEffect(() => {
    fetchIngredients()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openApproveModal = (item: IngredientRequest) => {
    setSelectedItem(item)
    setApproveCategory("")
    setNutrients({
      protein: 0, fat: 0, carbohydrate: 0,
      vitamin_a: 0, vitamin_c: 0, potassium: 0, calcium: 0, iron: 0,
    })
    setIsModalOpen(true)
  }

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return
    if (!approveCategory) {
      toast.error("카테고리를 선택해주세요")
      return
    }

    const result = await approveIngredient(selectedItem.id, approveCategory, nutrients)
    if (result) {
      toast.success("승인되었습니다")
      setIsModalOpen(false)
      fetchIngredients()
    } else {
      toast.error("승인에 실패했습니다")
    }
  }

  const handleApprove = async (id: number) => {
    const item = ingredients.find(i => i.id === id)
    if (item) openApproveModal(item)
  }

  const handleReject = async (id: number) => {
    if (!confirm("해당 재료 요청을 거절하시겠습니까?")) return
    const result = await updateStatus(id, "R")
    if (result) {
      toast.success("거절되었습니다")
      fetchIngredients()
    } else {
      toast.error("거절에 실패했습니다")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Y":
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">승인</span>
      case "D":
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400">거절</span>
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400">대기</span>
    }
  }

  const filteredIngredients = filterStatus
    ? ingredients.filter(item => item.status === filterStatus)
    : ingredients

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">재료 요청 관리</h2>
          <p className="text-sm md:text-base text-gray-400">사용자가 요청한 재료를 확인하고 승인/거절합니다</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">총 {filteredIngredients.length}건</span>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-400">상태 필터</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">전체</option>
            <option value="N">대기</option>
            <option value="Y">승인</option>
            <option value="R">거절</option>
          </select>
        </div>
      </div>

      {/* 리스트 테이블 */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredIngredients.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            재료 요청이 없습니다
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/50">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">ID</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">요청자</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">재료명</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">상태</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">요청일</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-gray-400">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredIngredients.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr
                      className={`border-b border-gray-800 hover:bg-gray-800/30 transition-colors ${item.status === "Y" ? "cursor-pointer" : ""}`}
                      onClick={() => item.status === "Y" && item.ingredient_nutrition && toggleExpand(item.id)}
                    >
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {item.status === "Y" && item.ingredient_nutrition && (
                          <span className="mr-2">{expandedIds.has(item.id) ? "▼" : "▶"}</span>
                        )}
                        {item.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{item.user_nickname}</td>
                      <td className="px-6 py-4 text-sm text-white font-medium">{item.name}</td>
                      <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(item.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.status === "N" && (
                          <div className="flex items-center justify-center space-x-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleApprove(item.id)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                            >
                              승인
                            </button>
                            <button
                              onClick={() => handleReject(item.id)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                            >
                              거절
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {expandedIds.has(item.id) && item.ingredient_nutrition && (
                      <tr className="bg-gray-800/40">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {item.ingredient_nutrition.map((n, idx) => {
                              const field = NUTRIENT_FIELDS.find(f => f.key === n.nutrient_name)
                              return (
                                <div key={idx} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                                  <span className="text-xs text-gray-400">{field ? field.label : n.nutrient_name}</span>
                                  <span className="text-xs text-white font-medium">{parseFloat(n.amount)} {n.nutrient_unit}</span>
                                </div>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 승인 모달 */}
      {isModalOpen && selectedItem && (
        <IngredientForm
          title="재료 승인"
          name={selectedItem.name}
          nameDisabled={true}
          category={approveCategory}
          nutrients={nutrients}
          onCategoryChange={setApproveCategory}
          onNutrientsChange={setNutrients}
          onSubmit={handleApproveSubmit}
          onCancel={() => setIsModalOpen(false)}
          submitLabel="승인"
        />
      )}
    </div>
  )
}