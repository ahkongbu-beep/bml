// @/api/summaries.ts
// 요약기능과 관련된 함수
// GET : 조회, POST : 생성, PUT : 수정, DELETE : 삭제

import { apiCall, createErrorResponse, createSuccessResponse } from "@/libs/utils/apiHelper";
import { BACKEND_ROUTES } from "@/libs/utils/apiRouter";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {

  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '15';
  const offset = searchParams.get('offset') || '0';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const nickname = searchParams.get('nickname');
  const search_type = searchParams.get('search_type');
  const search_value = searchParams.get('search_value');
  const model = searchParams.get('model');

  let callURL = BACKEND_ROUTES.SUMMARY() + '/lists';

  if (offset) callURL += `?offset=${offset}`;
  if (limit) callURL += `&limit=${limit}`;

  if (startDate) callURL += `&startDate=${startDate}`;
  if (endDate) callURL += `&endDate=${endDate}`;
  if (nickname) callURL += `&nickname=${nickname}`;
  if (model) callURL += `&model=${model}`;
  if (search_type) callURL += `&search_type=${search_type}`;
  if (search_value) callURL += `&search_value=${search_value}`;

  try {
    const data = await apiCall(callURL, 'GET');
    return createSuccessResponse("요약정보 조회에 성공하였습니다", data.data);
  } catch (error) {
    return createErrorResponse(error, "요약정보 조회 중 오류가 발생했습니다.");
  }
}