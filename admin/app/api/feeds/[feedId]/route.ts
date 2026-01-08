// @/app/api/feeds/[feedId]/route.ts
import { apiCall, createErrorResponse, createSuccessResponse } from "@/libs/utils/apiHelper";
import { BACKEND_ROUTES } from "@/libs/utils/apiRouter";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ feedId: string }> }
) {
  const { feedId } = await params;
  const callURL = `${BACKEND_ROUTES.FEEDS()}/detail/${feedId}`;

  try {
    const data = await apiCall(callURL, 'GET');
    if (!data.success) {
      throw new Error(data.error || '피드 상세 조회에 실패했습니다.');
    }
    return createSuccessResponse("피드 상세 조회 성공", data.data);
  } catch (error) {
    return createErrorResponse(error, "피드 상세 조회 중 오류가 발생했습니다.");
  }
}
