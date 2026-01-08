import { fetchGet, fetchPost } from './config';

/**
 * 차단목록 조회
 */
 export const getDenyUsers = async (user_hash: string): Promise<string[]> => {
  console.log("user_hash", user_hash);
  console.log("Fetching deny users for user_hash:", user_hash);
  const response = await fetchGet<{ deny_users: string[] }>('/users/denies', { user_hash });
  console.log("response", response);
  return response.data;
}

/**
 * 차단해제
 */
export const toggleDenyUser = async (user_hash: string, deny_user_hash: string): Promise<void> => {
  return fetchPost<void>('/users/denies/toggle', { user_hash, deny_user_hash });
}