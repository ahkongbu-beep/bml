import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // /client 직접 접근 막기
  if (url.pathname.startsWith('/client')) {
    url.pathname = '/'; // 루트로 redirect
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// middleware 적용 경로
export const config = {
  matcher: ['/client/:path*'], // /client로 시작하는 URL만 검사
};
