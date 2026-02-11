// 백엔드 API 기본 URL
// React Native에서는 localhost 대신 실제 IP를 사용해야 함

import { getToken } from '../utils/storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_STATIC_BASE_URL || "https://bml-e3uz.onrender.com";

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
const handleResponse = async (response: Response) => {

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const { status } = response;

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
  try {
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

    return handleResponse(response);
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
};

// Fetch wrapper - POST
export const fetchPost = async <T>(endpoint: string, data?: any): Promise<T> => {
  try {
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

    return handleResponse(response);
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
};

// Fetch wrapper - PUT
export const fetchPut = async <T>(endpoint: string, data?: any): Promise<T> => {
  const headers = await getHeaders();
  const url = `${API_BASE_URL}${endpoint}`;

  console.log("PUT Request URL:", url);
  console.log(JSON.stringify(data, null, 2));
  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  return handleResponse(response);
};

// Fetch wrapper - DELETE
export const fetchDelete = async <T>(endpoint: string, data?:any): Promise<T> => {
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

  return handleResponse(response);
};

// Fetch wrapper - POST with FormData (for file uploads)
export const fetchPostFormData = async <T>(endpoint: string, formData: FormData): Promise<T> => {
  try {
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

    return handleResponse(response);
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
};

// Fetch wrapper - PUT with FormData (for file uploads)
export const fetchPutFormData = async <T>(endpoint: string, formData: FormData): Promise<T> => {
  try {
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

    return handleResponse(response);
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
};
