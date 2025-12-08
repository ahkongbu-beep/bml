export interface Feed {
  id: number;
  user_id: number;
  title: string;
  content: string;
  images?: string[];
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
