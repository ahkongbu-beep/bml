import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDenyUsers } from '../api/deny_userApi'
import { blockUser } from '../api/feedsApi';
import { PaginationResponse } from '../types/ApiTypes';
export const denyUserKeys = {
  lists: () => ['denyUsers'] as const,
}

/**
 * 차단 목록 조회 HOOK
 */
export const useDenyUsers = () => {
  return useQuery({
    queryKey: denyUserKeys.lists(),
    queryFn: () => getDenyUsers(),
    enabled: true,
    select: (response) => {
      return response || [];
    }
  });
};

// TODO: 차단 해제 API 연동 필요
export const useUnblockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deny_user_hash }: { deny_user_hash: string }) => {
      return blockUser(deny_user_hash);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: denyUserKeys.lists(variables.user_hash) });
    }
  });
};