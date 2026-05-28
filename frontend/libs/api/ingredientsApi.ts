import { fetchGet, fetchPost, fetchPut, fetchDelete, fetchPostFormData, fetchPutFormData } from './config';

export const setIngredientRequest = async (names: string[]) => {
  const response = await fetchPost('/ingredients/request', { names });
  return response;
}
