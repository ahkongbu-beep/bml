import { useQuery, useMutation, UseQueryResult, useQueryClient } from '@tanstack/react-query';
import {
  createGrowthReports,
  getGrowths,
  getGrowthReports,
  GrowthListParams,
  GrowthReportRecord,
  GrowthReportSaveRequest,
} from '../api/growthApi';
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

/**
 * 성장 리포트 저장
 */
export const useCreateGrowthReports = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ childId, payload }: { childId: number; payload: GrowthReportSaveRequest }) =>
      createGrowthReports(childId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['growthReports', variables.childId] });
      queryClient.invalidateQueries({ queryKey: ['growthReports'] });
    },
  });
};

/**
 * 성장 리포트 조회
 */
export const useGetGrowthReports = (childId: number | null) => {
  return useQuery<{ success: boolean; data: GrowthReportRecord[] | null; error: string | null }, Error>({
    queryKey: ['growthReports', childId],
    queryFn: () => getGrowthReports(childId!),
    enabled: childId !== null,
  });
};