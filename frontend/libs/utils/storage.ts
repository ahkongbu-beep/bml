import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

// Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: 'user_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN_EXPIRES_AT: 'token_expires_at',
  REFRESH_TOKEN_EXPIRES_AT: 'refresh_token_expires_at',
  USER_INFO: 'user_info',
  IS_LOGGED_IN: 'is_logged_in',
  LAST_LOGIN: 'last_login',
  NEED_CHILD_REGISTRATION: 'need_child_registration',
} as const;

interface JWTPayload {
  exp: number;
  [key: string]: any;
}

// User 정보 저장
export const saveUserInfo = async (userInfo: any) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
    await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_LOGIN, new Date().toISOString());
  } catch (error) {
    console.error('Failed to save user info:', error);
  }
};

// User 정보 가져오기
export const getUserInfo = async (): Promise<any | null> => {
  try {
    const userInfoStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
    return userInfoStr ? JSON.parse(userInfoStr) : null;
  } catch (error) {
    console.error('Failed to get user info:', error);
    return null;
  }
};

// Token 저장 (만료 시간도 함께 저장)
export const saveToken = async (token: string, refreshToken?: string) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);

    // JWT 토큰에서 만료 시간 추출
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      if (decoded.exp) {
        const expiresAt = decoded.exp * 1000; // 초를 밀리초로 변환
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt.toString());
        console.log('Access Token expires at:', new Date(expiresAt).toISOString());
      }
    } catch (decodeError) {
      console.error('Failed to decode token:', decodeError);
    }

    // Refresh Token 저장
    if (refreshToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

      try {
        const decoded = jwtDecode<JWTPayload>(refreshToken);
        if (decoded.exp) {
          const expiresAt = decoded.exp * 1000;
          await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRES_AT, expiresAt.toString());
          console.log('Refresh Token expires at:', new Date(expiresAt).toISOString());
        }
      } catch (decodeError) {
        console.error('Failed to decode refresh token:', decodeError);
      }
    }
  } catch (error) {
    console.error('Failed to save token:', error);
  }
};

// Token 가져오기 (만료 체크 포함)
export const getToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    if (!token) return null;

    // 토큰 만료 체크
    const expiresAtStr = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    if (expiresAtStr) {
      const expiresAt = parseInt(expiresAtStr, 10);
      const now = Date.now();

      if (now >= expiresAt) {
        console.log('Token has expired, clearing storage');
        await logout();
        return null;
      }

      // 만료 1시간 전이면 경고 로그
      const oneHourBeforeExpiry = expiresAt - (60 * 60 * 1000);
      if (now >= oneHourBeforeExpiry) {
        console.warn('Token will expire soon:', new Date(expiresAt).toISOString());
      }
    }

    return token;
  } catch (error) {
    console.error('Failed to get token:', error);
    return null;
  }
};

// Refresh Token 가져오기
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return null;

    // Refresh Token 만료 체크
    const expiresAtStr = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRES_AT);
    if (expiresAtStr) {
      const expiresAt = parseInt(expiresAtStr, 10);
      const now = Date.now();

      if (now >= expiresAt) {
        console.log('Refresh Token has expired, clearing storage');
        await logout();
        return null;
      }
    }

    return refreshToken;
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
};

// 토큰 만료 여부 확인
export const isTokenExpired = async (): Promise<boolean> => {
  try {
    const expiresAtStr = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    if (!expiresAtStr) return true;

    const expiresAt = parseInt(expiresAtStr, 10);
    const now = Date.now();

    return now >= expiresAt;
  } catch (error) {
    console.error('Failed to check token expiry:', error);
    return true;
  }
};

// 토큰이 곧 만료될 예정인지 확인 (1시간 이내)
export const isTokenExpiringSoon = async (): Promise<boolean> => {
  try {
    const expiresAtStr = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    if (!expiresAtStr) return true;

    const expiresAt = parseInt(expiresAtStr, 10);
    const now = Date.now();
    const oneHourFromNow = now + (60 * 60 * 1000);

    return oneHourFromNow >= expiresAt;
  } catch (error) {
    console.error('Failed to check token expiry:', error);
    return true;
  }
};

// 자녀 등록 필요 플래그 저장
export const setNeedChildRegistration = async (need: boolean) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.NEED_CHILD_REGISTRATION, JSON.stringify(need));
  } catch (error) {
    console.error('Failed to set need child registration flag:', error);
  }
};

// 자녀 등록 필요 플래그 저장
export const saveNeedChildRegistration = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.NEED_CHILD_REGISTRATION, JSON.stringify(true));
  } catch (error) {
    console.error('Failed to save need child registration flag:', error);
  }
};

// 자녀 등록 필요 플래그 가져오기
export const getNeedChildRegistration = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.NEED_CHILD_REGISTRATION);
    return value ? JSON.parse(value) : false;
  } catch (error) {
    console.error('Failed to get need child registration flag:', error);
    return false;
  }
};

// 자녀 등록 필요 플래그 삭제
export const clearNeedChildRegistration = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.NEED_CHILD_REGISTRATION);
  } catch (error) {
    console.error('Failed to clear need child registration flag:', error);
  }
};

// 로그인 상태 확인
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
    return value === 'true';
  } catch (error) {
    console.error('Failed to check login status:', error);
    return false;
  }
};

// 로그아웃 (모든 데이터 삭제)
export const logout = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.TOKEN_EXPIRES_AT,
      STORAGE_KEYS.REFRESH_TOKEN_EXPIRES_AT,
      STORAGE_KEYS.USER_INFO,
      STORAGE_KEYS.IS_LOGGED_IN,
      STORAGE_KEYS.LAST_LOGIN,
    ]);
  } catch (error) {
    console.error('Failed to logout:', error);
  }
};

// 전체 데이터 삭제
export const clearAllStorage = async () => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
};
