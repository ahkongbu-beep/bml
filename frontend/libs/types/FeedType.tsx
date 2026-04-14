import { UserProfile } from './UserType';

export interface Allergy {
  allergy_code: string;
  allergy_name: string;
}

export interface Feed {
  id: number;
  user_id: number;
  title: string;
  content: string;
  images?: string[];
  is_liked: boolean;
  category_id: number;
  category_name?: string;
  view_hash: string;
  nickname: string;
  profile_image?: string;
  is_public: string;
  is_share_meal_plan: string;
  meal_condition: string;
  user: UserProfile;
  childs?: {
    child_name: string;
    child_birth: string;
    child_gender: 'M' | 'F';
    is_agent: string;
    allergies: Allergy[];
  };
  tags: string[];
  like_count: number;
  view_count: number;
  created_at: string;
  isLiked: boolean;
  isSaved: boolean;
}

export interface LikedFeed {
  meal_id: number;
  title: string;
  contents: string;
  image_url: string;
  liked_at: string;
  meal_hash?: string;
  like_hash: string;
  user_hash: string;
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
  onLike: (mealHash: string) => void;
  onCommentPress: (id: number) => void;
  onAiSummary?: (
    userHash: string,
    categoryId: number,
    inputDate: string,
    childId: number,
    mealStage: number,
    mealStageDetail: string,
    contents: string,
    mappedTags: any[],
    imageUrl?: string,
  ) => void;
  onAddToMealCalendar?: (userHash: string, feedId: number) => void;
  userHash?: string;
  isMine?: boolean;
  onEditFeed?: (feed: Feed) => void;
  onTagPress?: (tag: string) => void;
  selectedTags?: string[];
  isAnalyzing?: boolean;
}

export interface CopyFeedRequest {
  categoryCode: number;
  targetFeedId: number;
  targetUserHash: string;
  inputDate: string;
  memo: string;
  title: string;
  ingredients?: Array<{ id: number | string; name: string; score: number }>;
}