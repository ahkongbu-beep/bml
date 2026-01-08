import { useQuery, useMutation } from '@tanstack/react-query';
import { register } from '../api/usersApi';
import { RegisterRequest } from '../types/ApiTypes';
import { getMyInfo } from '../api/authApi';

/**
 * 회원가입 Mutation
 */
export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterRequest) => register(data),
  });
};

export const useGetMyInfo = (userHash: string) => {
  return useQuery({
    queryKey: ['myInfo', userHash],
    queryFn: async () => {
      return getMyInfo(userHash);
    }
  });
};