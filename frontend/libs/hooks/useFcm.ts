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
        // 로그인 직후 토큰 저장이 완료될 때까지 약간 대기
        await new Promise(resolve => setTimeout(resolve, 1000));

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

        // 재시도 로직 (최초 가입 시 백엔드 준비가 안 될 수 있음)
        let retries = 3;
        while (retries > 0) {
          try {
            await registerFcmToken(token, platform);
            console.log('[FCM] 토큰 등록 성공');
            break;
          } catch (e: any) {
            retries--;
            if (retries > 0) {
              console.warn(`[FCM] 토큰 등록 재시도 (${3 - retries}/3)`, e?.message);
              await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
              throw e;
            }
          }
        }

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
