/**
 * 회원 관리 인터페이스
 */

export type SnsLoginType = 'EMAIL' | 'KAKAO' | 'NAVER' | 'GOOGLE';
export type UserRole = 'USER' | 'ADMIN';
export type Gender = 'M' | 'W';

export interface User {
  id: number;
  sns_login_type: SnsLoginType;
  sns_id: string;
  address: string;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  role: UserRole;
  profile_image: string;
  description: string | null;
  is_active: number; // 1=활성, 0=비활성
  child_birth: string | null; // ISO date string
  child_gender: Gender;
  child_age_group: number;
  marketing_agree: number; // 1=동의, 0=미동의
  push_agree: number; // 1=동의, 0=미동의
  created_at: string; // ISO datetime string
  updated_at: string;
  last_login_at: string;
  deleted_at: string | null;
  view_hash: string;
}

export interface UserSearchParams {
  sns_id?: string;
  name?: string;
  nickname?: string;
  page?: number;
  limit?: number;
}

export interface UserUpdateStatusParams {
  view_hash: string;
  is_active: number;
}

export interface UserResetPasswordParams {
  view_hash: string;
}

export interface UserListResponse {
  success: boolean;
  message?: string;
  error?: string;
  data: {
    users: User[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface UserActionResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: User | null;
}
