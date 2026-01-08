// @/libs/interface/categories.ts
// 카테고리 관련 인터페이스

export interface Category {
  id: number
  type: string // "AGE_GROUP" | "NOTICES_GROUP"
  code: string
  value: string
  sort: number
  is_active: string // "Y" | "N"
}

export interface NoticeCategoryItem {
    id: number
    value: string
    code: string
}

export interface CategorySearchParams {
  type?: string
  value?: string
  is_active?: string
}

export interface CategoryFormData {
  id?: number
  type: string
  value: string
  sort: number
  is_active?: string
}

export interface CategoryResponse {
  age_group: Category[]
  notices_group: Category[]
  meals_group: Category[]
}
