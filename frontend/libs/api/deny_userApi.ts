import { fetchGet, fetchPost } from './config';

/**
 * 차단목록 조회
 */
 export const getDenyUsers = async (): Promise<string[]> => {
  const response = await fetchGet('/users/denies');
  return response.data;
}

/**
 * 차단해제
 */
export const toggleDenyUser = async (user_hash: string, deny_user_hash: string): Promise<void> => {
  return fetchPost<void>('/users/denies/toggle', { user_hash, deny_user_hash });
}