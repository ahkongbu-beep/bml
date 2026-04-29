import { fetchGet } from './config';
import { GrowthResponse } from '../types/GrowthTypes';
import { ApiResponse } from '../types/ApiTypes';

export interface GrowthListParams {
  gender?: 'M' | 'W';
  months?: number;
}

/**
 * 성장 지표 리스트
 */
export const getGrowths = async (params?: GrowthListParams): Promise<ApiResponse<GrowthResponse>> => {
  return fetchGet<ApiResponse<GrowthResponse>>('/growths/list', params);
};
