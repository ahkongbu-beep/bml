// @/lib/utils/apiHelper.ts
// API 요청 공통 유틸리티

import { NextResponse } from 'next/server';
import { CommonResponse } from '@/libs/interface/common';

/**
 * 요청 헤더에서 인증 토큰 추출
 */
export function getAuthToken(request: Request): string | null {
  const headers = new Headers(request.headers);

  const token = headers.get("Authorization") || headers.get("authorization");

  if (token && token.indexOf("Bearer ") < 0) {
    return "Bearer " + token;
  }

  return token;
}

export function getAccessToken(request: Request): string | null {
  // 쿠키에서 accessToken 가져오기
  const cookieHeader = request.headers.get('cookie');

  if (!cookieHeader) {
    console.log("No cookie header found");
    return null;
  }

  // 쿠키 문자열 파싱
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const token = cookies['accessToken'];
  console.log("token from cookie", token);

  if (!token) {
    return null;
  }

  // Bearer 접두사가 없으면 추가
  if (!token.startsWith('Bearer ')) {
    return `Bearer ${token}`;
  }

  return token;
}

/**
 * 인증 토큰 검증
 */
export function validateAuthToken(token: string | null): void {
  if (!token) {
    throw new Error("인증 토큰이 확인되지 않습니다.");
  }
}

/**
 * 백엔드 API 요청을 위한 헤더 생성
 */
export function createApiHeaders(token?: string | null): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': token })
  };
}

/**
 * 백엔드 API 호출 (공통)
 */
export async function apiCall(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  token?: string | null,
  body?: object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<CommonResponse<any>> {

  const response = await fetch(url, {
    method,
    headers: createApiHeaders(token),
    ...(body && { body: JSON.stringify(body) })
  });
  if (!response.ok) {
    const errorText = await response.json();
    console.log("errorText", errorText);
    throw new Error(`API 요청 실패: ${response.status} - ${JSON.stringify(errorText)}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'API 요청에 실패했습니다.');
  }

  return data;
}

/**
 * 에러 응답 생성
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string,
  status: number = 500
): NextResponse {
  const message = error instanceof Error ? error.message : defaultMessage;
  return NextResponse.json(
    {
      success: false,
      message
    },
    { status }
  );
}

/**
 * 성공 응답 생성
 */
export function createSuccessResponse(
  message: string,
  data?: unknown
): NextResponse {
  const response: { success: boolean; message: string; data?: unknown } = {
    success: true,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }
  console.log("response", response);

  return NextResponse.json(response);
}

