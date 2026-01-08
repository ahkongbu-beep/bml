// @/libs/interface/feeds.ts
// 피드 관련 인터페이스

export interface FeedUser {
  nickname: string;
  profile_image: string;
  user_hash: string | null;
}

export interface FeedComment {
  feed_id: number;
  parent_id: number | null;
  comment: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_owner: boolean;
  view_hash: string;
  parent_hash: string;
  user: FeedUser;
  children: FeedComment[];
}

export interface FeedDetail extends Feed {
  comments?: FeedComment[];
}

export interface Feed {
  id: number;
  user_id: number;
  user_name?: string;
  user_profile?: string;
  title: string;
  content: string;
  image_url?: string;
  is_published: 'Y' | 'N';
  is_public?: 'Y' | 'N';
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  tags?: string[];
  images?: string[];
  is_liked?: boolean;
  is_bookmarked?: boolean;
  user_hash?: string | null;
  user?: FeedUser;
}

export interface FeedCreateRequest {
  title: string;
  content: string;
  is_public: 'Y' | 'N';
  tags?: string;
  image?: File | null;
}

export interface FeedUpdateRequest {
  id: number;
  title?: string;
  content?: string;
  is_public?: 'Y' | 'N';
  tags?: string;
  image?: File | null;
}

export interface FeedSearchParams {
  user_id?: number;
  is_public?: 'Y' | 'N';
  title?: string;
  nickname?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: 'like_count_asc' | 'like_count_desc';
  limit?: number;
  offset?: number;
}
