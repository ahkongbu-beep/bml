import { fetchPostFormData, fetchPost, fetchPut, fetchDelete } from './config';
import { RegisterRequest, ApiResponse } from '../types/ApiTypes';
import { User } from '../types/UserType';

/**
 * 회원가입
 */
export const register = async (data: RegisterRequest): Promise<ApiResponse<User>> => {
  const formData = new FormData();

  // JSON 데이터 준비 (이미지 제외)
  const jsonData = {
    sns_login_type: data.sns_login_type,
    nickname: data.nickname,
    email: data.email,
    password: data.password,
    sns_id: data.sns_id,
    marketing_agree: data.marketing_agree || 0,
    push_agree: data.push_agree || 0,
    children: data.children.map((child) => ({
      child_name: child.child_name,
      child_birth: child.child_birth,
      child_gender: child.child_gender,
      allergies: child.allergies,
    })),
  };

  // JSON 데이터를 FormData에 추가
  formData.append('data', JSON.stringify(jsonData));

  // 대표 프로필 이미지 파일 추가
  if (data.profile_image && data.profile_image.startsWith('file://')) {
    const filename = data.profile_image.split('/').pop() || 'profile.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    const imageFile = {
      uri: data.profile_image,
      name: filename,
      type: type,
    } as any;

    formData.append('profile_image', imageFile);
  }

  return fetchPostFormData<ApiResponse<User>>('/users/create', formData);
};

export const setChangePassword = async (current_password: string, new_password: string): Promise<ApiResponse<null>> => {
  return fetchPut<ApiResponse<null>>('/users/password/change', {
    current_password,
    new_password,
  });
}

interface ChildRegistration {
  child_id?: number;
  child_name: string;
  child_birth: string; // YYYY-MM-DD 형식
  child_gender: 'M' | 'F';
  is_agent: string; // 'Y' | 'N'
  child_image?: string;
  allergies?: string[];
}

export const setRegisterChildren = async (children: ChildRegistration[]): Promise<ApiResponse<null>> => {
  const formData = new FormData();

  // JSON 데이터 준비 (이미지 제외)
  const jsonData = children.map((child) => ({
    child_id: child.child_id,
    child_name: child.child_name,
    child_birth: child.child_birth,
    child_gender: child.child_gender,
    is_agent: child.is_agent,
    allergies: child.allergies || [],
  }));

  // JSON 데이터를 FormData에 추가
  formData.append('data', JSON.stringify(jsonData));
  return fetchPostFormData<ApiResponse<null>>('/users/children/create', formData);
}

/*
 * 자녀 정보 삭제
 */
export const setDeleteChildren = async (child_id: number): Promise<ApiResponse<null>> => {
  return fetchDelete<ApiResponse<null>>('/users/children/delete', { child_id });
};