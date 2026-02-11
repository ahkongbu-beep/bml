import { useQuery } from '@tanstack/react-query';
import { getCategoryCodes, getAgeGroups, getAllergyCategories } from '../api/categoriesApi';

// Query Keys
export const categoryKeys = {
  all: ['categories'] as const,
  codes: (type: string) => [...categoryKeys.all, 'codes', type] as const,
  ageGroups: () => [...categoryKeys.all, 'ageGroups'] as const,
};

/**
 * 카테고리 코드 조회 Hook
 */
export const useCategoryCodes = (type: string) => {
  return useQuery({
    queryKey: categoryKeys.codes(type),
    queryFn: () => getCategoryCodes(type),
    staleTime: 1000 * 60 * 30, // 30분
  });
};

/**
 * 연령대 그룹 조회 Hook
 */
export const useAgeGroups = () => {
  return useQuery({
    queryKey: categoryKeys.ageGroups(),
    queryFn: () => getAgeGroups(),
    staleTime: 1000 * 60 * 30, // 30분
  });
};

export const useAllergyCategories = () => {
  return useQuery({
    queryKey: categoryKeys.codes('ALLERGY'),
    queryFn: () => getAllergyCategories('ALLERGY'),
    staleTime: 1000 * 60 * 30, // 30분
  });
};