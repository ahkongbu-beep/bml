import { apiCall, createErrorResponse, createSuccessResponse } from "@/libs/utils/apiHelper";
import { BACKEND_ROUTES } from "@/libs/utils/apiRouter";
import { NextRequest } from "next/server";

export async function GET() {
  const callURL = BACKEND_ROUTES.INGREDIENTS();
  try {
    const data = await apiCall(callURL, 'GET');
    return createSuccessResponse("사용자 재료 요청 조회 성공", data.data);
  } catch (error) {
    return createErrorResponse(error, "재료 요청 조회 중 오류가 발생했습니다.");
  }
}

export async function POST(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get('id');
  if (!id) {
    return createErrorResponse(null, "재료 요청 ID가 제공되지 않았습니다.");
  }

  const body = await request.json();
  const callURL = BACKEND_ROUTES.INGREDIENTS() + `/${id}/approve`;

  try {
    const data = await apiCall(callURL, 'POST', null, body);
    return createSuccessResponse("재료 요청 승인 성공", data.data);
  } catch (error) {
    return createErrorResponse(error, "재료 요청 승인 중 오류가 발생했습니다.");
  }
}

export async function PUT(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get('id');
  if (!id) {
    return createErrorResponse(null, "재료 요청 ID가 제공되지 않았습니다.");
  }

  const body = await request.json();
  const callURL = BACKEND_ROUTES.INGREDIENTS() + `/${id}/status`;

  try {
    const data = await apiCall(callURL, 'PUT', null, body);
    return createSuccessResponse("재료 요청 상태 변경 성공", data.data);
  } catch (error) {
    return createErrorResponse(error, "재료 요청 상태 변경 중 오류가 발생했습니다.");
  }
}
