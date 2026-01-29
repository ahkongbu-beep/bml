import { fetchGet, fetchPost, fetchPostFormData, fetchPutFormData } from './config';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '../types/UserType';
import { ApiResponse } from '../types/ApiTypes';

/**
 * 로그인
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  return fetchPost<LoginResponse>('/auth/login', data);
};

/**
 * 구글 로그인
 */
export interface GoogleLoginRequest {
  idToken: string;
  accessToken?: string;
}

export const googleLogin = async (data: GoogleLoginRequest): Promise<LoginResponse> => {
  return fetchPost<LoginResponse>('/auth/google', data);
};

/**
 * 회원가입
 */
export const register = async (data: RegisterRequest): Promise<ApiResponse<User>> => {
  const formData = new FormData();

  // 필수 필드
  formData.append('sns_id', data.sns_id);
  formData.append('sns_type', data.sns_type);
  if (data.nickname) formData.append('nickname', data.nickname);
  if (data.user_name) formData.append('user_name', data.user_name);
  if (data.user_phone) formData.append('user_phone', data.user_phone);
  if (data.email) formData.append('email', data.email);

  // 선택 필드
  if (data.description) formData.append('description', data.description);
  if (data.child_birth) formData.append('child_birth', data.child_birth);
  if (data.child_gender) formData.append('child_gender', data.child_gender);
  if (data.child_age_group !== undefined) formData.append('child_age_group', data.child_age_group.toString());
  if (data.meal_group !== undefined) formData.append('meal_group', JSON.stringify(data.meal_group));
  if (data.marketing_agree !== undefined) formData.append('marketing_agree', data.marketing_agree ? '1' : '0');
  if (data.push_agree !== undefined) formData.append('push_agree', data.push_agree ? '1' : '0');

  // 프로필 이미지 처리
  if (data.profile_image && data.profile_image.startsWith('file://')) {
    const filename = data.profile_image.split('/').pop() || 'profile.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri: data.profile_image,
      name: filename,
      type,
    } as any);
  }

  return fetchPostFormData<ApiResponse<User>>('/users/create', formData);
};

/**
 * 로그아웃
 */
export const logout = async (user_hash: string): Promise<ApiResponse<null>> => {
  return fetchPost<ApiResponse<null>>('/auth/logout', { user_hash });
};

/**
 * 내 정보 조회 (sns_id 기반)
 */
export const getMyInfo = async (userHash: string): Promise<User> => {
  const response = await fetchPost<ApiResponse<User>>('/users/me', { user_hash: userHash });
  return response.data;
};

/**
 * sns_id로 프로필 조회
 */
export const getProfileBySnsId = async (sns_id: string): Promise<ApiResponse<User>> => {
  const response = fetchGet<ApiResponse<User>>(`/users/profile`, { user_id: sns_id });
  return response.data;
};

/**
 * user_hash로 사용자 프로필 조회 (타인 프로필)
 */
export const getUserProfile = async (userHash: string): Promise<User> => {
  const response = await fetchGet<ApiResponse<User>>(`/users/profile`, { user_hash: userHash });
  return response.data;
};

/*
 * 사용자 요청에 의한 이메일 계정 검색
 */
export const getUserEmail = async (user_name: string, user_phone: string): Promise<ApiResponse<null>> => {
  const params: Record<string, string> = {
    user_name: user_name,
    user_phone: user_phone,
  };

  return fetchPost<ApiResponse<null>>('/users/confirm/email', params);
};

/*
 * 비밀번호 찾기 (회원조회 email or phone)
 */
export const getConfirmUser = async (type: 'email' | 'phone', value: string): Promise<ApiResponse<null>> => {
  const params: Record<string, string> = {
    search_type: type,
  };

  if (type === 'email') {
    params.user_email = value;
  } else if (type === 'phone') {
    params.user_phone = value;
  } else {
    throw new Error("type은 'email' 또는 'phone'이어야 합니다.");
  }

  return fetchPost<ApiResponse<null>>('/users/confirm/user', params);
};

export const setResetUserPassword = async (type: 'email' | 'phone', user_hash: string): Promise<ApiResponse<null>> => {
  const params: Record<string, string> = {
    search_type: type,
    user_hash: user_hash,
  };

  return fetchPost<ApiResponse<null>>('/users/reset/password', params);
}

/**
 * 프로필 업데이트
 */
export interface UpdateProfileRequest {
  nickname?: string;
  email?: string;
  description?: string;
  child_birth?: string;
  child_gender?: 'M' | 'W';
  marketing_agree?: boolean;
  push_agree?: boolean;
  profile_image?: string; // local URI
}

export const updateProfile = async (data: UpdateProfileRequest): Promise<ApiResponse<User>> => {
  const formData = new FormData();

  // 선택 필드
  if (data.nickname) formData.append('nickname', data.nickname);
  if (data.email) formData.append('email', data.email);
  if (data.description) formData.append('description', data.description);
  if (data.child_birth) formData.append('child_birth', data.child_birth);
  if (data.child_gender) formData.append('child_gender', data.child_gender);
  if (data.child_age_group !== undefined) formData.append('child_age_group', data.child_age_group.toString());
  if (data.meal_group !== undefined) formData.append('meal_group', JSON.stringify(data.meal_group));
  if (data.marketing_agree !== undefined) formData.append('marketing_agree', data.marketing_agree ? '1' : '0');
  if (data.push_agree !== undefined) formData.append('push_agree', data.push_agree ? '1' : '0');

  // 프로필 이미지 처리
  if (data.profile_image && data.profile_image.startsWith('file://')) {
    const filename = data.profile_image.split('/').pop() || 'profile.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri: data.profile_image,
      name: filename,
      type,
    } as any);
  }

  return fetchPutFormData<ApiResponse<User>>('/users/update', formData);
};
