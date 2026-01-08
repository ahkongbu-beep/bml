export interface Feed {
  id: number;
  user_id: number;
  title: string;
  content: string;
  images?: string[];
  is_liked: boolean;
  user: {
    nickname: string;
    profile_image?: string;
  };
  tags: string[];
  like_count: number;
  view_count: number;
  created_at: string;
  isLiked: boolean;
  isSaved: boolean;
}

export interface LikedFeed {
  feed_id: number;
  title: string;
  content: string;
  feed_image_url: string;
  liked_at: string;
}
