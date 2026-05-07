import { fetchGet, fetchPost } from './config';

/**
 * 광고 클릭
 */
 export const setAdClick = async (view_hash: string): Promise<void> => {
  const apiUrl = `/ads/click/${view_hash}`
  const response = await fetchPost(apiUrl);
  return response;
}

/**
 * 차단해제
 */
export const toggleDenyUser = async (user_hash: string, deny_user_hash: string): Promise<void> => {
  return fetchPost<void>('/users/denies/toggle', { user_hash, deny_user_hash });
}