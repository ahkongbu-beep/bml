// 백엔드 API 공통 응답 타입

// 페이지네이션 응답
export interface PaginationResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// 기본 API 응답
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// 에러 응답
export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// 피드 목록 조회 파라미터
export interface FeedListParams {
  page?: number;
  limit?: number;
  user_hash?: string;
  tag?: string;
  is_public?: 'Y' | 'N';
}

// 피드 생성 요청
export interface CreateFeedRequest {
  user_hash: string;
  title: string;
  content: string;
  images?: string[];
  tags?: string[];
  is_public?: 'Y' | 'N';
}

// 피드 수정 요청
export interface UpdateFeedRequest {
  title: string;
  content: string;
  images?: string[];
  tags?: string[];
  is_public?: 'Y' | 'N';
}

// 좋아요/찜하기 토글 응답
export interface ToggleResponse {
  success: boolean;
  message?: string;
  error?: string | null;
  data: {
    feed_id: number;
    like_count: number;
    liked: boolean;
  };
}

// 회원가입 요청
export interface RegisterRequest {
  sns_login_type: 'EMAIL' | 'KAKAO' | 'NAVER' | 'GOOGLE';
  sns_id?: string;
  name: string;
  nickname: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
  profile_image?: string;
  description?: string;
  child_birth?: string; // YYYY-MM-DD
  child_gender: 'M' | 'W';
  child_age_group: number;
  marketing_agree?: number;
  push_agree?: number;
}

// 카테고리 코드
export interface CategoryCode {
  id: number;
  type: string;
  code: string;
  value: string;
  sort: number;
  is_active: string;
}
