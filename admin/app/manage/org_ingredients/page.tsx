"use client"
import React, { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { useOrgIngredients } from "@/hooks/useOrgIngredients"
import { OrgIngredient } from "@/libs/interface/org_ingredients"
import IngredientForm, { CATEGORIES } from "@/components/manage/IngredientForm"

const NUTRIENT_FIELDS: Record<string, string> = {
  protein: "단백질",
  fat: "지방",
  carbohydrate: "탄수화물",
  vitamin_a: "비타민A",
  vitamin_c: "비타민C",
  potassium: "칼륨",
  calcium: "칼슘",
  iron: "철분",
}

const DEFAULT_NUTRIENTS = {
  protein: 0, fat: 0, carbohydrate: 0,
  vitamin_a: 0, vitamin_c: 0, potassium: 0, calcium: 0, iron: 0,
}

export default function OrgIngredientsPage() {
  const { ingredients, loading, fetchIngredients, createIngredient, updateIngredient } = useOrgIngredients()
  const [filterCategory, setFilterCategory] = useState<string>("")
  const [searchName, setSearchName] = useState("")
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<OrgIngredient | null>(null)
  const [formName, setFormName] = useState("")
  const [formCategory, setFormCategory] = useState("")
  const [formNutrients, setFormNutrients] = useState<Record<string, number>>({ ...DEFAULT_NUTRIENTS })

  useEffect(() => {
    fetchIngredients()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreateModal = () => {
    setEditItem(null)
    setFormName("")
    setFormCategory("")
    setFormNutrients({ ...DEFAULT_NUTRIENTS })
    setIsModalOpen(true)
  }

  const openEditModal = (item: OrgIngredient) => {
    setEditItem(item)
    setFormName(item.name)
    setFormCategory(item.category)
    const nutrientValues = { ...DEFAULT_NUTRIENTS }
    if (item.ingredient_nutrition) {
      for (const n of item.ingredient_nutrition) {
        if (n.nutrient_name in nutrientValues) {
          nutrientValues[n.nutrient_name] = parseFloat(n.amount) || 0
        }
      }
    }
    setFormNutrients(nutrientValues)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      toast.error("재료명을 입력해주세요")
      return
    }
    if (!formCategory) {
      toast.error("카테고리를 선택해주세요")
      return
    }

    const body = { name: formName, category: formCategory, nutrients: formNutrients }

    if (editItem) {
      const result = await updateIngredient(editItem.id, body)
      if (result) {
        toast.success("수정되었습니다")
        setIsModalOpen(false)
        fetchIngredients()
      } else {
        toast.error("수정에 실패했습니다")
      }
    } else {
      const result = await createIngredient(body)
      if (result) {
        toast.success("등록되었습니다")
        setIsModalOpen(false)
        fetchIngredients()
      } else {
        toast.error("등록에 실패했습니다")
      }
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getCategoryLabel = (value: string) => {
    const cat = CATEGORIES.find(c => c.value === value)
    return cat ? cat.label : value
  }

  const filteredIngredients = ingredients.filter(item => {
    if (filterCategory && item.category !== filterCategory) return false
    if (searchName && !item.name.includes(searchName)) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">재료 리스트 관리</h2>
          <p className="text-sm md:text-base text-gray-400">등록된 원재료와 영양소 정보를 확인합니다</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">총 {filteredIngredients.length}건</span>
          <button
            onClick={openCreateModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-5 rounded-xl transition-colors flex items-center space-x-2"
          >
            <span>➕</span>
            <span>새로 등록</span>
          </button>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-400">카테고리</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">전체</option>
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-400">재료명</label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="검색..."
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
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
            재료가 없습니다
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/50">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">ID</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">재료명</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">카테고리</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">상태</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">영양소</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-gray-400">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredIngredients.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr
                      className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(item.id)}
                    >
                      <td className="px-6 py-4 text-sm text-gray-300">
                        <span className="mr-2">{expandedIds.has(item.id) ? "▼" : "▶"}</span>
                        {item.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-white font-medium">{item.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-400">
                          {getCategoryLabel(item.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.is_active === "Y"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {item.is_active === "Y" ? "활성" : "비활성"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {item.ingredient_nutrition?.length || 0}개
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditModal(item) }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                        >
                          수정
                        </button>
                      </td>
                    </tr>
                    {expandedIds.has(item.id) && item.ingredient_nutrition && (
                      <tr className="bg-gray-800/40">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {item.ingredient_nutrition.map((n, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                                <span className="text-xs text-gray-400">{NUTRIENT_FIELDS[n.nutrient_name] || n.nutrient_name}</span>
                                <span className="text-xs text-white font-medium">{parseFloat(n.amount)} {n.nutrient_unit}</span>
                              </div>
                            ))}
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

      {/* 등록/수정 모달 */}
      {isModalOpen && (
        <IngredientForm
          title={editItem ? "재료 수정" : "재료 등록"}
          name={formName}
          nameDisabled={!!editItem}
          category={formCategory}
          nutrients={formNutrients}
          onNameChange={setFormName}
          onCategoryChange={setFormCategory}
          onNutrientsChange={setFormNutrients}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          submitLabel={editItem ? "수정" : "등록"}
        />
      )}
    </div>
  )
}