import { apiCall, createErrorResponse, createSuccessResponse } from "@/libs/utils/apiHelper";
import { BACKEND_ROUTES } from "@/libs/utils/apiRouter";
import { NextRequest } from "next/server";

export async function GET() {
  const callURL = BACKEND_ROUTES.ORG_INGREDIENTS();
  try {
    const data = await apiCall(callURL, 'GET');
    return createSuccessResponse("원재료 조회 성공", data.data);
  } catch (error) {
    return createErrorResponse(error, "원재료 조회 중 오류가 발생했습니다.");
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const callURL = BACKEND_ROUTES.ORG_INGREDIENTS();

  try {
    const data = await apiCall(callURL, 'POST', null, body);
    return createSuccessResponse("원재료 등록 성공", data.data);
  } catch (error) {
    return createErrorResponse(error, "원재료 등록 중 오류가 발생했습니다.");
  }
}

export async function PUT(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get('id');
  if (!id) {
    return createErrorResponse(null, "재료 ID가 제공되지 않았습니다.");
  }

  const body = await request.json();
  const callURL = BACKEND_ROUTES.ORG_INGREDIENTS() + `/${id}`;

  try {
    const data = await apiCall(callURL, 'PUT', null, body);
    return createSuccessResponse("원재료 수정 성공", data.data);
  } catch (error) {
    return createErrorResponse(error, "원재료 수정 중 오류가 발생했습니다.");
  }
}
