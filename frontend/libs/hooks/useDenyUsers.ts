import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDenyUsers } from '../api/deny_userApi'
import { blockUser } from '../api/feedsApi';
import { PaginationResponse } from '../types/ApiTypes';
export const denyUserKeys = {
  lists: (user_hash: string) => ['denyUsers', user_hash] as const,
}

/**
 * 차단 목록 조회 HOOK
 */
export const useDenyUsers = (user_hash: string | null) => {
  return useQuery({
    queryKey: denyUserKeys.lists(user_hash || ''),
    queryFn: () => getDenyUsers(user_hash!),
    enabled: !!user_hash,
    select: (response) => {
      return response || [];
    }
  });
};

// TODO: 차단 해제 API 연동 필요
export const useUnblockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ user_hash, deny_user_hash }: { user_hash: string; deny_user_hash: string }) => {
      return blockUser(user_hash, deny_user_hash);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: denyUserKeys.lists(variables.user_hash) });
    }
  });
};