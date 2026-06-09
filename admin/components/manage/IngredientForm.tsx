"use client"
import React from "react"

const CATEGORIES = [
  { value: "vegetable", label: "채소" },
  { value: "protein", label: "단백질" },
  { value: "grain", label: "곡물" },
  { value: "fruit", label: "과일" },
  { value: "seed_nut", label: "씨앗/견과" },
  { value: "dairy", label: "유제품" },
  { value: "seaweed", label: "해조류" },
]

const NUTRIENT_FIELDS = [
  { key: "protein", label: "단백질 (g)" },
  { key: "fat", label: "지방 (g)" },
  { key: "carbohydrate", label: "탄수화물 (g)" },
  { key: "vitamin_a", label: "비타민A" },
  { key: "vitamin_c", label: "비타민C" },
  { key: "potassium", label: "칼륨" },
  { key: "calcium", label: "칼슘" },
  { key: "iron", label: "철분" },
]

interface IngredientFormProps {
  title: string;
  name: string;
  nameDisabled?: boolean;
  category: string;
  nutrients: Record<string, number>;
  onNameChange?: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onNutrientsChange: (nutrients: Record<string, number>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export { CATEGORIES, NUTRIENT_FIELDS }

export default function IngredientForm({
  title,
  name,
  nameDisabled = false,
  category,
  nutrients,
  onNameChange,
  onCategoryChange,
  onNutrientsChange,
  onSubmit,
  onCancel,
  submitLabel = "저장",
}: IngredientFormProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* 재료명 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">재료명</label>
            <input
              type="text"
              value={name}
              disabled={nameDisabled}
              onChange={(e) => onNameChange?.(e.target.value)}
              placeholder="재료 이름 입력"
              className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 ${nameDisabled ? "opacity-70" : ""}`}
            />
          </div>

          {/* 카테고리 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">카테고리</label>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">선택하세요</option>
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* 영양소 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">영양소 정보</label>
            <div className="grid grid-cols-2 gap-3">
              {NUTRIENT_FIELDS.map(field => (
                <div key={field.key}>
                  <label className="block text-xs text-gray-500 mb-1">{field.label}</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={nutrients[field.key]}
                    onChange={(e) => onNutrientsChange({
                      ...nutrients,
                      [field.key]: parseFloat(e.target.value) || 0
                    })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
