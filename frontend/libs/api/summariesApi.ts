import { fetchGet } from './config';
import { CategoryCode, ApiResponse } from '../types/ApiTypes';
import { SummaryListRequest, SummaryListResponse } from '../types/SummariesType';

/**
 * 카테고리 코드 조회 (type별)
 */
export const getSummaryList = async ({model}: SummaryListRequest): Promise<CategoryCode[]> => {
  let callURL = `/summaries/search?model=${model}`;
  const response = await fetchGet<ApiResponse<SummaryListResponse>>(callURL);
  return response.data || [];
};