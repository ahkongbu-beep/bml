import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { getMessaging, requestPermission, getToken, onTokenRefresh, deleteToken, AuthorizationStatus } from '@react-native-firebase/messaging';
import { registerFcmToken, unregisterFcmToken } from '../api/authApi';

/**
 * FCM 권한 요청 및 토큰 등록
 * 로그인 후 isAuthenticated=true 일 때 호출
 */
export const useFcmRegister = (isAuthenticated: boolean) => {
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const register = async () => {
      try {
        // 권한 요청 (iOS)
        const m = getMessaging();
        const authStatus = await requestPermission(m);
        const enabled =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;

        if (!enabled) return;

        const token = await getToken(m);
        if (!token) return;

        tokenRef.current = token;
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';
        await registerFcmToken(token, platform);
        console.log('[FCM] 토큰 등록 완료');

        // 토큰 갱신 시 재등록
        const unsubscribeRefresh = onTokenRefresh(m, async (newToken) => {
          tokenRef.current = newToken;
          await registerFcmToken(newToken, platform);
        });

        return unsubscribeRefresh;
      } catch (e) {
        console.warn('[FCM] 토큰 등록 실패', e);
      }
    };

    let unsubscribeRefresh: (() => void) | undefined;
    register().then((fn) => { unsubscribeRefresh = fn; });

    return () => {
      unsubscribeRefresh?.();
    };
  }, [isAuthenticated]);

  /**
   * 로그아웃 시 호출
   */
  const unregister = async () => {
    try {
      if (tokenRef.current) {
        await unregisterFcmToken(tokenRef.current);
        await deleteToken(getMessaging());
        tokenRef.current = null;
        console.log('[FCM] 토큰 삭제 완료');
      }
    } catch (e) {
      console.warn('[FCM] 토큰 삭제 실패', e);
    }
  };

  return { unregister };
};
