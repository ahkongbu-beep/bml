/**
 * 회원 관리 훅
 */
import { useState } from 'react';
import {
  User,
  UserSearchParams,
  UserListResponse,
  UserActionResponse,
  UserUpdateStatusParams,
  UserResetPasswordParams
} from '@/libs/interface/users';

import { apiCall } from "@/libs/utils/apiHelper"
import { FRONTEND_ROUTES } from "@/libs/utils/apiRouter"

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  // 회원 목록 조회 (검색 포함)
  const fetchUsers = async (params: UserSearchParams = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (params.sns_id) queryParams.append('sns_id', params.sns_id);
      if (params.name) queryParams.append('name', params.name);
      if (params.nickname) queryParams.append('nickname', params.nickname);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const url = FRONTEND_ROUTES.USERS() + (queryParams.toString() ? `?${queryParams.toString()}` : '');
      const result = await apiCall(url, 'GET') as UserListResponse;
      if (result.success && result.data) {
        const listFromUsers = Array.isArray(result.data.users) ? result.data.users : null;
        const listFromUserList = Array.isArray((result.data as unknown as { user_list?: User[] }).user_list)
          ? (result.data as unknown as { user_list: User[] }).user_list
          : null;
        const safeUsers = listFromUsers ?? listFromUserList ?? [];

        const total = Number(result.data.total ?? 0);
        const limit = Number((result.data as unknown as { limit?: number }).limit ?? params.limit ?? 20);
        const page = Number(
          (result.data as unknown as { page?: number }).page
          ?? ((Number((result.data as unknown as { offset?: number }).offset ?? 0) / Math.max(limit, 1)) + 1)
        );
        const totalPages = Number(
          (result.data as unknown as { total_pages?: number }).total_pages
          ?? Math.ceil(total / Math.max(limit, 1))
        );

        setUsers(safeUsers);
        setTotal(total);
        setCurrentPage(page);
        setTotalPages(totalPages);
        return result;
      } else {
        throw new Error(result.error || '회원 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('fetchUsers error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 회원 상태 변경 (활성/비활성)
  const updateUserStatus = async (params: UserUpdateStatusParams) => {
    setLoading(true);

    try {
      const result = await apiCall(FRONTEND_ROUTES.USERS(), 'PUT', null, params) as UserActionResponse;

      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || '상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('updateUserStatus error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 초기화
  const resetPassword = async (params: UserResetPasswordParams) => {
    setLoading(true);
    try {
      const apiURL = FRONTEND_ROUTES.USERS() + "/password-reset";
      const result = await apiCall(apiURL, 'PUT', null, params) as UserActionResponse;

      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || '비밀번호 초기화에 실패했습니다.');
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    total,
    currentPage,
    totalPages,
    loading,
    fetchUsers,
    updateUserStatus,
    resetPassword,
  };
};
