import { fetchGet } from './config';
import { CategoryCode, ApiResponse } from '../types/ApiTypes';

interface CategoryCodesResponse {
  [key: string]: CategoryCode[];
}

/**
 * 카테고리 코드 조회 (type별)
 */
export const getCategoryCodes = async (type: string): Promise<CategoryCode[]> => {
  const response = await fetchGet<ApiResponse<CategoryCodesResponse>>(`/categories_codes/list?cc_type=${type}`);

  // data 객체에서 type에 해당하는 배열 추출
  const typeKey = type.toLowerCase();
  return response.data[typeKey] || [];
};

/**
 * 연령대 그룹 조회 (AGE_GROUP)
 */
export const getAgeGroups = async (): Promise<CategoryCode[]> => {
  return getCategoryCodes('AGE_GROUP');
};

export const getAllergyCategories = async (type: string): Promise<CategoryCode[]> => {

  const response = await fetchGet<ApiResponse<CategoryCodesResponse>>(`/categories_codes/food/list?food_type=${type}`);

  // data 객체에서 type에 해당하는 배열 추출
  return response.data;
}
