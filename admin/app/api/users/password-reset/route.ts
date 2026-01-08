import { apiCall, createErrorResponse, createSuccessResponse } from "@/libs/utils/apiHelper";
import { BACKEND_ROUTES } from "@/libs/utils/apiRouter";
import { NextRequest } from "next/server";

export async function PUT(request: NextRequest) {
  const callURL = BACKEND_ROUTES.USERS() + "/reset/password";

  try {
    const body = await request.json();
    const data = await apiCall(callURL, 'PUT', null, body);

    if (!data.success) {
      throw new Error(data.error || '상태 변경에 실패했습니다.');
    }

    return createSuccessResponse("비밀번호 초기화 성공하였습니다", data.data);
  } catch (error) {
    return createErrorResponse(error, "비밀번호 초기화 중 오류가 발생했습니다.");
  }
}
