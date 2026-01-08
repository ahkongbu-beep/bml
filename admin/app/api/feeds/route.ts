// @/app/api/feeds/route.ts
import { apiCall, createErrorResponse, createSuccessResponse } from "@/libs/utils/apiHelper";
import { BACKEND_ROUTES } from "@/libs/utils/apiRouter";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '15';
  const offset = searchParams.get('offset') || '0';
  const title = searchParams.get('title');
  const nickname = searchParams.get('nickname');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const sortBy = searchParams.get('sort_by');

  let callURL = `${BACKEND_ROUTES.FEEDS()}/list?limit=${limit}&offset=${offset}`;

  // 검색 파라미터 추가
  if (title) callURL += `&title=${encodeURIComponent(title)}`;
  if (nickname) callURL += `&nickname=${encodeURIComponent(nickname)}`;
  if (startDate) callURL += `&start_date=${startDate}`;
  if (endDate) callURL += `&end_date=${endDate}`;
  if (sortBy) callURL += `&sort_by=${sortBy}`;

  try {
    const data = await apiCall(callURL, 'GET');
    console.log("data", data);
    if (!data.success) {
      throw new Error(data.error || '피드 조회에 실패했습니다.');
    }
    return createSuccessResponse("피드 조회 성공", data.data);
  } catch (error) {
    return createErrorResponse(error, "피드 조회 중 오류가 발생했습니다.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const callURL = `${BACKEND_ROUTES.FEEDS()}/create`;

    // FormData를 그대로 백엔드로 전달
    const response = await fetch(callURL, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '피드 생성에 실패했습니다.');
    }

    return createSuccessResponse("피드 생성 성공", data.data);
  } catch (error) {
    return createErrorResponse(error, "피드 생성 중 오류가 발생했습니다.");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();

    const callURL = `${BACKEND_ROUTES.FEEDS()}/update`;

    const response = await fetch(callURL, {
      method: 'PUT',
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '피드 수정에 실패했습니다.');
    }

    return createSuccessResponse("피드 수정 성공", data.data);
  } catch (error) {
    return createErrorResponse(error, "피드 수정 중 오류가 발생했습니다.");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const callURL = `${BACKEND_ROUTES.FEEDS()}/delete`;

    const data = await apiCall(callURL, 'POST', null, body);

    if (!data.success) {
      throw new Error(data.error || '피드 삭제에 실패했습니다.');
    }

    return createSuccessResponse("피드 삭제 성공", data.data);
  } catch (error) {
    return createErrorResponse(error, "피드 삭제 중 오류가 발생했습니다.");
  }
}
