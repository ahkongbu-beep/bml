const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? process.env.BACKEND_URL || 'https://oncare-backend.onrender.com'
    : 'http://localhost:8000'); // 개발 모드 API 주소

export const FRONTEND_ROUTES = {
  NOTICES : () => `/api/notices`,
  CATEGORY_CODE: () => `/api/category-codes`,
  USERS: () => `/api/users`,
  ADVERTISERS: () => `/api/advertisers`,
  ADS: () => `/api/ads`,
  FEEDS: () => `/api/feeds`,
  SUMMARY: () => `/api/summaries`,
  DASHBOARD: () => `/api/dashboard`,
}

export const BACKEND_ROUTES = {
  NOTICES: () => `${API_BASE}/admin/notices`,
  CATEGORY_CODE: () => `${API_BASE}/categories_codes`,
  USERS: () => `${API_BASE}/admin/users`,
  ADVERTISERS: () => `${API_BASE}/advertisers`,
  ADS: () => `${API_BASE}/ads`,
  FEEDS: () => `${API_BASE}/feeds`,
  SUMMARY: () => `${API_BASE}/summaries`,
  DASHBOARD: () => `${API_BASE}/admin/dashboard`,
}