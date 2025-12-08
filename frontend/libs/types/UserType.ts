export interface User {
  id: number;
  email: string;
  nickname: string;
  name: string;
  profile_image: string;
  description?: string;
  child_birth?: string;
  child_gender?: 'M' | 'W';
  child_age_group?: number;
  marketing_agree: boolean;
  push_agree: boolean;
  created_at: string;
  view_hash?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
  name: string;
  child_birth?: string;
  child_gender?: 'M' | 'W';
}
