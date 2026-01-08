import { fetchGet } from './config';
import { CategoryCode, ApiResponse } from '../types/ApiTypes';
import { SummaryListRequest, SummaryListResponse } from '../types/SummariesType';

/**
 * 카테고리 코드 조회 (type별)
 */
export const getSummaryList = async ({userHash, model}: SummaryListRequest): Promise<CategoryCode[]> => {

  let callURL = `/summaries/search?user_hash=${userHash}&model=${model}`;
  const response = await fetchGet<ApiResponse<SummaryListResponse>>(callURL);
  console.log("getSummaryList response", response);
  return response.data || [];
};