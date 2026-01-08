// @/api/notices.ts
// 공지사항 관련 API 함수들
// GET : 조회, POST : 생성, PUT : 수정, DELETE : 삭제
import { apiCall, createErrorResponse, createSuccessResponse } from "@/libs/utils/apiHelper";
import { BACKEND_ROUTES } from "@/libs/utils/apiRouter";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const callURL = BACKEND_ROUTES.NOTICES() + '/list';
  try {
    const data = await apiCall(callURL, 'GET');
    return createSuccessResponse("공지사항 조회 성공하였습니다", data.data);
  } catch (error) {
    return createErrorResponse(error, "공지사항 조회 중 오류가 발생했습니다.");
  }
}

export async function POST(request: NextRequest) {
  const callURL = BACKEND_ROUTES.NOTICES() + '/create';
  const body = await request.json();
  console.log("body", body);
  try {
    const data = await apiCall(callURL, 'POST', null, body);
    return createSuccessResponse("공지사항 생성에 성공하였습니다", data.data);
  } catch (error) {
    return createErrorResponse(error, "공지사항 생성 중 오류가 발생했습니다.");
  }
}

interface RequestPutBody {
  type: string;
  title?: string;
  content?: string;
  is_important?: boolean;
}

export async function PUT(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const viewHash = searchParams.get('view_hash');
  if (!viewHash) {
    return createErrorResponse(null, "공지사항 ID가 제공되지 않았습니다.");
  }

  let callURL = '';
  const body = (await request.json()) as RequestPutBody;

  console.log("body", body);

  if (body.type === 'status_toggle') {
    callURL = `${BACKEND_ROUTES.NOTICES()}/toggle_status/${viewHash}`;
  } else {

    callURL = `${BACKEND_ROUTES.NOTICES()}/update/${viewHash}`;
  }

  try {
    const data = await apiCall(callURL, 'PUT', null, body);
    return createSuccessResponse("공지사항 정보 변경하였습니다", data.data);
  } catch (error) {
    return createErrorResponse(error, "공지사항 정보 변경 중 오류가 발생했습니다.");
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const viewHash = searchParams.get('view_hash');

  if (!viewHash) {
    return createErrorResponse(null, "공지사항 ID가 제공되지 않았습니다.");
  }

  const callURL = `${BACKEND_ROUTES.NOTICES()}/delete/${viewHash}`;

  try {
    const data = await apiCall(callURL, 'DELETE');
    return createSuccessResponse("공지사항 삭제에 성공하였습니다", data.data);
  } catch (error) {
    return createErrorResponse(error, "공지사항 삭제 중 오류가 발생했습니다.");
  }
}