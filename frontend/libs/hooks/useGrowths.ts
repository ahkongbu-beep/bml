import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getGrowths, GrowthListParams } from '../api/growthApi';
import { GrowthResponse } from '../types/GrowthTypes';
import { ApiResponse } from '../types/ApiTypes';

// Query Keys
export const growthKeys = {
  all: ['growths'] as const,
};

/**
 * 건강진단 리스트 조회
 */
export const useGrowth = (params?: GrowthListParams, enabled: boolean = true): UseQueryResult<ApiResponse<GrowthResponse>, Error> => {
  return useQuery<ApiResponse<GrowthResponse>, Error>({
    queryKey: [...growthKeys.all, params],
    queryFn: () => getGrowths(params),
    enabled,
  });
}