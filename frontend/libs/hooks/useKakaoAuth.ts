import { useState } from 'react';
import KakaoLoginModule, { login as kakaoLogin, KakaoOAuthToken } from '@react-native-seoul/kakao-login';

interface UseKakaoAuthReturn {
  promptAsync: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useKakaoAuth = (
  onSuccess?: (accessToken: string, refreshToken: string) => Promise<{ success: boolean; message?: string }>
): UseKakaoAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const promptAsync = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token: KakaoOAuthToken = await kakaoLogin();

      if (!token.accessToken) {
        throw new Error('카카오 액세스 토큰을 받지 못했습니다.');
      }

      if (onSuccess) {
        const res = await onSuccess(token.accessToken, token.refreshToken);
        if (!res.success) {
          throw new Error(res.message || '로그인 처리에 실패했습니다.');
        }
      }
    } catch (err: any) {
      // 사용자 취소는 무시
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
