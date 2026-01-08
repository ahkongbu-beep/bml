// @/app/api/feeds/bookmark/route.ts
import { apiCall, createErrorResponse, createSuccessResponse } from "@/libs/utils/apiHelper";
import { BACKEND_ROUTES } from "@/libs/utils/apiRouter";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const callURL = `${BACKEND_ROUTES.FEEDS()}/bookmark`;

    const data = await apiCall(callURL, 'POST', null, body);

    if (!data.success) {
      throw new Error(data.error || '찜하기 처리에 실패했습니다.');
    }

    return createSuccessResponse("찜하기 처리 성공", data.data);
  } catch (error) {
    return createErrorResponse(error, "찜하기 처리 중 오류가 발생했습니다.");
  }
}
