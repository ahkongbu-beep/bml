export interface SummaryRequest {
  startDate?: string
  endDate?: string
  nickname?: string
  searchType?: string
  searchValue?: string
  model?: string
  limit?: number
  offset?: number
}

export interface SummaryResponse {
  model: string
  model_id: number
  question: string
  answer: string
  created_at: string
  view_hash: string
  user?: {
    profile_image: string
    nickname: string
    user_hash: string
  }
}

export interface SummaryUser {
  profile_image: string
  nickname: string
  user_hash: string
}

export interface SummaryItem {
  model: string
  model_id: number
  question: string
  answer: string
  created_at: string
  view_hash: string
  user: SummaryUser
}