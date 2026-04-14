export interface UserChilItem {
  id: number;
  child_id: number;
  child_name: string;
  child_birth: string;
  child_gender: 'M' | 'W';
  is_agent: string;
  allergy_codes: string[];
  allergy_names: string[];
}

export interface User {
  id: number;
  email: string;
  nickname: string;
  name: string;
  profile_image: string;
  description?: string;
  marketing_agree: boolean;
  push_agree: boolean;
  created_at: string;
  view_hash?: string;
  feed_count?: number;
  like_count?: number;
  meal_count?: number;
  user_childs?: UserChildItem[];
}

export interface UserProfile{
    nickname: string;
    profile_image: string;
    user_hash: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    token: string;
    refresh_token: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
  name: string;
  child_birth?: string;
  child_gender?: 'M' | 'W';
}
