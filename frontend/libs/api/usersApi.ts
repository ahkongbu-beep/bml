import { fetchPostFormData, fetchPost, fetchDelete } from './config';
import { RegisterRequest, ApiResponse } from '../types/ApiTypes';
import { User } from '../types/UserType';

/**
 * 회원가입
 */
export const register = async (data: RegisterRequest): Promise<ApiResponse<User>> => {
  const formData = new FormData();

  formData.append('sns_login_type', data.sns_login_type);
  if (data.sns_id) formData.append('sns_id', data.sns_id);
  formData.append('name', data.name);
  formData.append('nickname', data.nickname);
  if (data.email) formData.append('email', data.email);
  if (data.password) formData.append('password', data.password);
  if (data.phone) formData.append('phone', data.phone);
  if (data.address) formData.append('address', data.address);
  if (data.description) formData.append('description', data.description);
  formData.append('meal_group', JSON.stringify(data.meal_group));
  formData.append('marketing_agree', data.marketing_agree?.toString() || '0');
  formData.append('push_agree', data.push_agree?.toString() || '0');

  // 프로필 이미지 추가
  if (data.profile_image) {
    const filename = data.profile_image.split('/').pop() || 'profile.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri: data.profile_image,
      name: filename,
      type: type,
    } as any);
  }

  return fetchPostFormData<ApiResponse<User>>('/users/create', formData);
};

interface ChildRegistration {
  child_name: string;
  child_birth: string; // YYYY-MM-DD 형식
  child_gender: 'M' | 'F';
  is_agent: string; // 'Y' | 'N'
}

export const setRegisterChildren = async (children: ChildRegistration[]): Promise<ApiResponse<null>> => {
  console.log("setRegisterChildren called with:", children);
  return fetchPost<ApiResponse<null>>('/users/children/create', children);
}

/*
 * 자녀 정보 삭제
 */
export const setDeleteChildren = async (child_id: number): Promise<ApiResponse<null>> => {
  return fetchDelete<ApiResponse<null>>('/users/children/delete', { child_id });
};