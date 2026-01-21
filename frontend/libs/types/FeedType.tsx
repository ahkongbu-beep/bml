import { UserProfile } from './UserType';

export interface Feed {
  id: number;
  user_id: number;
  title: string;
  content: string;
  images?: string[];
  is_liked: boolean;
  user: UserProfile;
  childs?: {
    child_name: string;
    child_birth: string;
    child_gender: 'M' | 'F';
    is_agent: string;
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

export interface FeedItemProps {
  item: Feed;
  menuVisible: number | null;
  currentImageIndex: { [key: number]: number };
  isLiking: boolean;
  onMenuToggle: (id: number) => void;
  onImageScroll: (id: number, index: number) => void;
  onViewProfile: (userHash: string, nickname: string) => void;
  onBlock: (denyUserHash: string, nickname: string) => void;
  onLike: (id: number) => void;
  onCommentPress: (id: number) => void;
  onAiSummary?: (userHash: string, feedId: number, imageId: string) => void;
  onAddToMealCalendar?: (userHash: string, feedId: number) => void;
  userHash?: string;
}

export interface CopyFeedRequest {
  categoryCode: number;
  targetFeedId: number;
  targetUserHash: string;
  inputDate: string;
  memo: string;
  title: string
}