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