import { useState } from 'react';
import NaverLogin, { NaverLoginResponse } from '@react-native-seoul/naver-login';
import { NativeModules } from 'react-native';

interface UseNaverAuthReturn {
  promptAsync: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useNaverAuth = (
  onSuccess?: (accessToken: string) => Promise<{ success: boolean; message?: string }>
): UseNaverAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const promptAsync = async () => {
    const consumerKey = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID || '';
    const consumerSecret = process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET || '';
    const appName = process.env.EXPO_PUBLIC_APP_NAME || 'BML';

    if (!consumerKey || !consumerSecret) {
      setError('Naver Client ID 또는 Secret이 설정되지 않았습니다.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      NaverLogin.initialize({
        appName,
        consumerKey,
        consumerSecret,
        serviceUrlScheme: 'com.bml.app',
      });

      const { failureResponse, successResponse } = await NaverLogin.login();
      if (failureResponse) {
        if (failureResponse.isCancel) {
          return;
        }
        throw new Error(failureResponse.message || '네이버 로그인에 실패했습니다.');
      }

      if (!successResponse?.accessToken) {
        throw new Error('액세스 토큰을 받지 못했습니다.');
      }

      if (onSuccess) {
        const res = await onSuccess(successResponse.accessToken);
        if (!res.success) {
          throw new Error(res.message || '로그인 처리에 실패했습니다.');
        }
      }
    } catch (err: any) {
      console.error('네이버 로그인 오류:', err);
      setError(err.message || '네이버 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return { promptAsync, isLoading, error };
};
