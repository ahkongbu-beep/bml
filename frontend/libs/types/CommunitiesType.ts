export interface CommunityPost {
  id: number;
  category_code: number;
  user_id: number;
  title: string;
  contents: string;
  user_nickname: string;
  view_count: number;
  is_secret: string;
  is_active: string;
  is_notice: string;
  created_at: string;
  updated_at: string;
  child_name: string;
  child_birth: string;
  child_gender: string;
  pinned_at: string | null;
  nickname: string;
  is_liked: string;
  like_count: number;
  comment_count: number;
  profile_image: string;
  view_hash: string;
}

export interface CommunityListResponse {
  communities: CommunityPost[];
  total_count: number;
  cursor: number;
}

export interface CommunityListRequest {
  categoryCode?: number;
  isNotice?: string;
  isSecret?: string;
  keyword?: string;
  userNickname?: string;
  month?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  cursor?: number;
  myOnly?: string;
  limit?: number;
}