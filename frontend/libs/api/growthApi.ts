import { fetchGet, fetchPost } from './config';
import { GrowthResponse } from '../types/GrowthTypes';
import { ApiResponse } from '../types/ApiTypes';

export interface GrowthListParams {
  gender?: 'M' | 'W';
  months?: number;
}

export interface GrowthReportItem {
  type: 'height' | 'weight' | 'head';
  months: number;
  value: number;
  percent: number;
}

export interface GrowthReportSaveRequest {
  reports: GrowthReportItem[];
}

/**
 * 성장 지표 리스트
 */
export const getGrowths = async (params?: GrowthListParams): Promise<ApiResponse<GrowthResponse>> => {
  return fetchGet<ApiResponse<GrowthResponse>>('/growths/list', params);
};

/**
 * 성장 리포트 저장
 */
export const createGrowthReports = async (
  childId: number,
  payload: GrowthReportSaveRequest,
): Promise<ApiResponse<{ created_count: number }>> => {
  return fetchPost<ApiResponse<{ created_count: number }>>(`/growths/reports/${childId}`, payload);
};

export interface GrowthReportRecord {
  id: number;
  type: 'height' | 'weight' | 'head';
  months: number;
  value: number;
  percent: string;
  created_at: string;
}

/**
 * 성장 리포트 조회
 */
export const getGrowthReports = async (childId: number): Promise<ApiResponse<GrowthReportRecord[]>> => {
  return fetchGet<ApiResponse<GrowthReportRecord[]>>(`/growths/reports/${childId}`);
};
