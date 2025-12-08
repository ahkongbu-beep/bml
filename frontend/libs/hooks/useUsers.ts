import { useQuery, useMutation } from '@tanstack/react-query';
import { register } from '../api/usersApi';
import { RegisterRequest } from '../types/ApiTypes';

/**
 * 회원가입 Mutation
 */
export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterRequest) => register(data),
  });
};
