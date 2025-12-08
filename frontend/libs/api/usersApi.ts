import { fetchPost } from './config';
import { RegisterRequest, ApiResponse } from '../types/ApiTypes';
import { User } from '../types/UserType';

/**
 * 회원가입
 */
export const register = async (data: RegisterRequest): Promise<ApiResponse<User>> => {
  return fetchPost<ApiResponse<User>>('/users/register', data);
};
