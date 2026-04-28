import { useMutation, useQuery } from '@tanstack/react-query';
import { setIngredientRequest } from '../api/ingredientsApi';

/**
 * 추가 재료 요청 Hook
 */
export const useIngredientRequest = () => {
  return useMutation({
    mutationFn: (words: string[]) => setIngredientRequest(words),
  });
};
