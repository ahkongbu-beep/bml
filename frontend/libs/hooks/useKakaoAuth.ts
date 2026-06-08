import { useState } from 'react';
import KakaoLoginModule, { login as kakaoLogin, KakaoOAuthToken } from '@react-native-seoul/kakao-login';

interface UseKakaoAuthReturn {
  promptAsync: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useKakaoAuth = (
  onSuccess?: (accessToken: string) => Promise<{ success: boolean; message?: string }>
): UseKakaoAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const promptAsync = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[Kakao] NativeModule 상태:', KakaoLoginModule);
      console.log('[Kakao] login 함수 상태:', typeof kakaoLogin);
      console.log('[Kakao] KAKAO_NATIVE_APP_KEY:', process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY);

      const token: KakaoOAuthToken = await kakaoLogin();

      if (!token.accessToken) {
        throw new Error('카카오 액세스 토큰을 받지 못했습니다.');
      }

      if (onSuccess) {
        const res = await onSuccess(token.accessToken);
        if (!res.success) {
          throw new Error(res.message || '로그인 처리에 실패했습니다.');
        }
      }
    } catch (err: any) {
      // 사용자 취소는 무시
        console.log('Kakao login error:', err);
      if (err?.message?.includes('cancelled') || err?.message?.includes('cancel')) {
        return;
      }
      setError(err.message || '카카오 로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return { promptAsync, isLoading, error };
};
