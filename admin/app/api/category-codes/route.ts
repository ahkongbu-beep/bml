// @/api/notices.ts
// 공지사항 관련 API 함수들
// GET : 조회, POST : 생성, PUT : 수정, DELETE : 삭제
import { apiCall, createErrorResponse, createSuccessResponse } from "@/libs/utils/apiHelper";
import { BACKEND_ROUTES } from "@/libs/utils/apiRouter";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const callURL = BACKEND_ROUTES.CATEGORY_CODE() + '/list';
  try {
    const data = await apiCall(callURL, 'GET');
    if (!data.success) {
      throw new Error(data.error || '카테고리 코드 조회에 실패했습니다.');
    }

    return createSuccessResponse("카테고리 코드 조회 성공하였습니다", data.data);

  } catch (error) {
    return createErrorResponse(error, "카테고리 코드 조회 중 오류가 발생했습니다.");
  }
}

export async function POST(request: NextRequest) {
  const callURL = BACKEND_ROUTES.CATEGORY_CODE() + '/create';

  let body;

  try {
    // Body 파싱
    body = await request.json();

    if (!body || Object.keys(body).length === 0) {
      throw new Error('Request body is empty');
    }

    // 백엔드 API 호출
    const data = await apiCall(callURL, 'POST', null, body);

    if (!data.success) {
      throw new Error(data.error || '카테고리 코드 생성에 실패했습니다.');
    }

    return createSuccessResponse("카테고리 코드 생성 성공하였습니다", data.data);

  } catch (error) {
    console.error("POST error:", error);
    return createErrorResponse(error, "카테고리 코드 생성 중 오류가 발생했습니다.");
  }
}

export async function PUT(request: NextRequest) {
  const callURL = BACKEND_ROUTES.CATEGORY_CODE() + '/update';
  try {
    const body = await request.json();
    const data = await apiCall(callURL, 'PUT', null, body);

    if (!data.success) {
      throw new Error(data.error || '카테고리 코드 수정에 실패했습니다.');
    }

    return createSuccessResponse("카테고리 코드 수정 성공하였습니다", data.data);

  } catch (error) {
    return createErrorResponse(error, "카테고리 코드 수정 중 오류가 발생했습니다.");
  }
}

export async function DELETE(request: NextRequest) {
  const callURL = BACKEND_ROUTES.CATEGORY_CODE() + '/delete';
  try {
    const body = await request.json();
    const data = await apiCall(callURL, 'DELETE', null, body);
    if (!data.success) {
      throw new Error(data.error || '카테고리 코드 삭제에 실패했습니다.');
    }
    return createSuccessResponse("카테고리 코드 삭제 성공하였습니다", data.data);

  } catch (error) {
    return createErrorResponse(error, "카테고리 코드 삭제 중 오류가 발생했습니다.");
  }
}