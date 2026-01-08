import { apiCall, createErrorResponse, createSuccessResponse } from "@/libs/utils/apiHelper";
import { BACKEND_ROUTES } from "@/libs/utils/apiRouter";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const query = searchParams.toString();
  const callURL = BACKEND_ROUTES.USERS() + "/list" + (query ? `?${query}` : '');
  try {
    console.log("callURL:", callURL);
    const data = await apiCall(callURL, 'GET');

    if (!data.success) {
      throw new Error(data.error || '회원 목록 조회에 실패했습니다.');
    }

    return createSuccessResponse("회원 목록 조회 성공하였습니다", data.data);
  } catch (error) {
    return createErrorResponse(error, "회원 목록 조회 중 오류가 발생했습니다.");
  }
}

export async function PUT(request: NextRequest) {
  const callURL = BACKEND_ROUTES.USERS() + "/update";

  try {
    const body = await request.json();
    const data = await apiCall(callURL, 'PUT', null, body);

    if (!data.success) {
      throw new Error(data.error || '상태 변경에 실패했습니다.');
    }

    return createSuccessResponse("회원 상태 변경 성공하였습니다", data.data);
  } catch (error) {
    return createErrorResponse(error, "회원 상태 변경 중 오류가 발생했습니다.");
  }
}
