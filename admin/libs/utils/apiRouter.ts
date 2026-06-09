const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? process.env.BACKEND_URL || 'https://bml.co.kr'
    : 'https://dev.bml.co.kr'); // 개발 모드 API 주소

export const FRONTEND_ROUTES = {
  NOTICES : () => `/api/notices`,
  CATEGORY_CODE: () => `/api/category-codes`,
  USERS: () => `/api/users`,
  ADVERTISERS: () => `/api/advertisers`,
  ADS: () => `/api/ads`,
  FEEDS: () => `/api/feeds`,
  SUMMARY: () => `/api/summaries`,
  DASHBOARD: () => `/api/dashboard`,
  INGREDIENTS: () => `/api/ingredients`,
  ALLERGIES: () => `/api/allergies`,
  ORG_INGREDIENTS: () => `/api/org-ingredients`,
}

export const BACKEND_ROUTES = {
  NOTICES: () => `${API_BASE}/admin/notices`,
  CATEGORY_CODE: () => `${API_BASE}/categories_codes`,
  USERS: () => `${API_BASE}/admin/users`,
  ADVERTISERS: () => `${API_BASE}/advertisers`,
  ADS: () => `${API_BASE}/ads`,
  FEEDS: () => `${API_BASE}/admin/meals`,
  SUMMARY: () => `${API_BASE}/summaries`,
  DASHBOARD: () => `${API_BASE}/admin/dashboard`,
  INGREDIENTS: () => `${API_BASE}/admin/ingredients`,
  ALLERGIES: () => `${API_BASE}/admin/allergies`,
  ORG_INGREDIENTS: () => `${API_BASE}/admin/org_ingredients`,
}