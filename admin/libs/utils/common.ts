// @/libs/common.ts
// 공통 유틸리티 함수 및 타입 정의

// fetcher 함수
export async function fetcher<T, B = undefined>(
  url: string,
  method: string,
  headers?: HeadersInit,
  body?: B
): Promise<T> {
  const options: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const getStaticImage = (type: string, imagePath?: unknown): string => {

  if (typeof imagePath !== 'string') return '';

  const safePath = imagePath.trim();
  if (!safePath) return '';

  if (
    safePath.startsWith('http') ||
    safePath.startsWith('file://') ||
    safePath.startsWith('content://') ||
    safePath.startsWith('data:') ||
    safePath.startsWith('asset://') ||
    safePath.startsWith('ph://')
  ) {
    return safePath;
  }

  const normalizedPath = safePath.startsWith('/') ? safePath : '/' + safePath;
  const IS_DEV = process.env.NEXT_PUBLIC_BACKEND_URL === 'https://dev.bml.co.kr';
  const STATIC_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || (IS_DEV ? 'https://dev.bml.co.kr' : 'https://bml.co.kr');

  return `${STATIC_BASE_URL}${normalizedPath}_${type}.webp`;
};