// 백엔드 API 기본 URL
// React Native에서는 localhost 대신 실제 IP를 사용해야 함

import { getToken, getRefreshToken, saveToken } from '../utils/storage';
import { logout as clearStorage } from '../utils/storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_STATIC_BASE_URL || "https://bml-e3uz.onrender.com";

// 토큰 갱신 중인지 확인하는 플래그
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// 토큰 갱신 대기열에 추가
const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// 토큰 갱신 완료 후 대기 중인 요청들에게 알림
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

// Refresh Token으로 Access Token 갱신
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    console.log('No refresh token available');
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      console.log('Refresh token request failed');
      return null;
    }

    const data = await response.json();
    if (data.success && data.data?.token) {
      const newAccessToken = data.data.token;
      await saveToken(newAccessToken, refreshToken);
      console.log('Access token refreshed successfully');
      return newAccessToken;
    }

    return null;
  } catch (error) {
    console.error('Failed to refresh access token:', error);
    return null;
  }
};

// Fetch API 에러 클래스
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, data: any, message?: string, error?: string) {
    super(error || message || 'API Error');
    this.status = status;
    this.data = data;
  }
}

// 기본 헤더 가져오기
const getHeaders = async (): Promise<HeadersInit> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // AsyncStorage에서 JWT 토큰을 가져와서 Authorization 헤더에 추가
  const token = await getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// 쿼리 파라미터를 URL에 추가
const buildUrl = (endpoint: string, params?: Record<string, any>): string => {
  const url = `${API_BASE_URL}${endpoint}`;

  if (!params) return url;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
};

// 응답 에러 처리
const handleResponse = async (response: Response, endpoint: string, retryFn?: () => Promise<any>) => {

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const { status } = response;

    if (status === 401 && retryFn && !endpoint.includes('/auth/refresh')) {
      console.log('401 error detected, attempting token refresh...');

      // 이미 갱신 중이면 대기
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh(async (token: string) => {
            resolve(retryFn());
          });
        });
      }

      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();

        if (newToken) {
          isRefreshing = false;
          onRefreshed(newToken);
          // 새로운 토큰으로 재시도
          return retryFn();
        } else {
          // Refresh token도 만료되었으므로 로그아웃
          console.log('토큰 갱신 실패. 로그아웃 처리합니다.');
          isRefreshing = false;
          await clearStorage();
          throw new ApiError(status, errorData, errorData.message);
        }
      } catch (error) {
        isRefreshing = false;
        await clearStorage();
        throw error;
      }
    }

    switch (status) {
      case 401:
        console.error('인증 실패:', errorData.message);
        break;
      case 403:
        console.error('권한 없음:', errorData.message);
        break;
      case 404:
        console.error('리소스를 찾을 수 없습니다:', errorData.message);
        break;
      case 500:
        console.error('서버 에러:', errorData.message);
        break;
      default:
        console.error('API 에러:', errorData.message);
    }

    throw new ApiError(status, errorData, errorData.message);
  }

  return response.json();
};

// Fetch wrapper - GET
export const fetchGet = async <T>(endpoint: string, params?: Record<string, any>): Promise<T> => {
  const makeRequest = async (): Promise<T> => {
    const headers = await getHeaders();
    const url = buildUrl(endpoint, params);
    console.log("GET Request URL:", url);
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.log("GET Request URL:", url);
    }

    return handleResponse(response, endpoint, makeRequest);
  };

  try {
    return await makeRequest();
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
};

// Fetch wrapper - POST
export const fetchPost = async <T>(endpoint: string, data?: any): Promise<T> => {
  const makeRequest = async (): Promise<T> => {
    const headers = await getHeaders();
    const url = `${API_BASE_URL}${endpoint}`;
    console.log("POST Request URL:", url);
    console.log(JSON.stringify(data, null, 2));
    console.log("headers:", headers);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return handleResponse(response, endpoint, makeRequest);
  };

  try {
    return await makeRequest();
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
};

// Fetch wrapper - PUT
export const fetchPut = async <T>(endpoint: string, data?: any): Promise<T> => {
  const makeRequest = async (): Promise<T> => {
    const headers = await getHeaders();
    const url = `${API_BASE_URL}${endpoint}`;

    console.log("PUT Request URL:", url);
    console.log(JSON.stringify(data, null, 2));
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return handleResponse(response, endpoint, makeRequest);
  };

  return makeRequest();
};

// Fetch wrapper - DELETE
export const fetchDelete = async <T>(endpoint: string, data?:any): Promise<T> => {
  const makeRequest = async (): Promise<T> => {
    const headers = await getHeaders();
    const url = `${API_BASE_URL}${endpoint}`;

    console.log("DELETE Request URL:", url);
    console.log("Headers:", headers);
    console.log(JSON.stringify(data, null, 2));

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return handleResponse(response, endpoint, makeRequest);
  };

  return makeRequest();
};

// Fetch wrapper - POST with FormData (for file uploads)
export const fetchPostFormData = async <T>(endpoint: string, formData: FormData): Promise<T> => {
  const makeRequest = async (): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;

    console.log("POST FormData Request URL:", url);
    console.log("FormData contents:");
    formData.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });

    // FormData 요청에도 JWT 토큰 추가
    const token = await getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // FormData를 사용할 때는 Content-Type을 설정하지 않음 (자동으로 multipart/form-data 설정됨)
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    return handleResponse(response, endpoint, makeRequest);
  };

  try {
    return await makeRequest();
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
};

// Fetch wrapper - PUT with FormData (for file uploads)
export const fetchPutFormData = async <T>(endpoint: string, formData: FormData): Promise<T> => {
  const makeRequest = async (): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;

    // FormData 요청에도 JWT 토큰 추가
    const token = await getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log("PUT FormData Request URL:", url);
    console.log("FormData contents:");
    formData.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: formData,
    });

    console.log("PUT FormData Response Status:", response.status);
    console.log("PUT FormData Response Headers:", response.headers);

    return handleResponse(response, endpoint, makeRequest);
  };

  try {
    return await makeRequest();
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
};
