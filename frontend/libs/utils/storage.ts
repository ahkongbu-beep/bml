import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: 'user_token',
  USER_INFO: 'user_info',
  IS_LOGGED_IN: 'is_logged_in',
  LAST_LOGIN: 'last_login',
} as const;

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

// Token 저장
export const saveToken = async (token: string) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
  } catch (error) {
    console.error('Failed to save token:', error);
  }
};

// Token 가져오기
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
  } catch (error) {
    console.error('Failed to get token:', error);
    return null;
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
