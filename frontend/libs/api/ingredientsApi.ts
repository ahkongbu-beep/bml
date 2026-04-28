import { fetchGet, fetchPost, fetchPut, fetchDelete, fetchPostFormData, fetchPutFormData } from './config';

export const setIngredientRequest = async (names: string[]) => {
  console.log("setIngredientRequest called with names:", names);
  const response = await fetchPost('/ingredients/request', { names });
  return response;
}
