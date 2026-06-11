export interface Notice {
  id: number
  title: string
  content: string
  categoryText: string
  createdAt: string
  updatedAt: string
  author: string
  isImportant: boolean
  ip:string
  isActive: boolean
  viewHash:string
}

export interface NoticeItem {
  id: number
  title: string
  content: string
  category_text: string
  created_at: string
  updated_at: string
  admin_name: string
  is_important?: string
  status:string
  ip:string
  is_active: boolean
  view_hash:string
}

export interface NoticeCreateRequest {
  title: string
  content: string
  category: string
  author: string
  isActive: boolean
  isImportant?: boolean
}

export interface NoticeUpdateRequest {
  viewHash: string
  title: string
  content: string
  category: string
  isActive: boolean
  isImportant: boolean
}

export interface NoticeSearchParams {
  title?: string
  category?: string
  startDate?: string
  endDate?: string
}
