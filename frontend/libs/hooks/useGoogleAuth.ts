import { useState, useEffect } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { saveToken, saveUserInfo } from '../utils/storage';
import { User } from '../types/UserType';

interface GoogleAuthConfig {
  androidClientId: string;
  webClientId: string;
}

interface UseGoogleAuthReturn {
  promptAsync: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useGoogleAuth = (
  config: GoogleAuthConfig,
  onSuccess?: (idToken: string, userInfo: any, serverAuthCode?: string | null) => Promise<{ success: boolean; data?: { user: User; token: string }; message?: string }>
): UseGoogleAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google Sign-In 설정
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: config.webClientId, // ID 토큰 발급용
      offlineAccess: true, // refresh token 발급을 위해 필요
      iosClientId: config.webClientId, // iOS용 (선택)
    });
  }, [config.webClientId]);

  const handlePromptAsync = async () => {
    if (!config.webClientId) {
      setError('Google Web Client ID가 설정되지 않았습니다.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      } catch (playServicesError) {
        console.warn('⚠️ Play Services 확인 실패, 계속 진행:', playServicesError);
      }

      // 로그인 실행
      const signInResult = await GoogleSignin.signIn();

      // ID 토큰 가져오기
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken;

      if (!idToken) {
        throw new Error('ID 토큰을 받지 못했습니다.');
      }

      // 사용자 정보 구성 (signInResult.data 또는 signInResult.user)
      const user = signInResult.data?.user || signInResult.user;

      if (!user) {
        throw new Error('사용자 정보를 받지 못했습니다.');
      }

      // serverAuthCode 추출 (refresh token 발급용)
      const serverAuthCode = signInResult.data?.serverAuthCode || signInResult.serverAuthCode || null;

      // 백엔드 로그인 처리
      if (onSuccess) {
        const backendResponse = await onSuccess(idToken, user, serverAuthCode);
        if (!backendResponse.success) {
          throw new Error(backendResponse.message || '백엔드 로그인 처리에 실패했습니다.');
        }
      }

      setError(null);
    } catch (err: any) {
      if (err.code === 'SIGN_IN_CANCELLED') {
        setError('로그인이 취소되었습니다.');
      } else if (err.code === 'IN_PROGRESS') {
        setError('이미 로그인이 진행 중입니다.');
      } else if (err.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        setError('Google Play 서비스를 사용할 수 없습니다.');
      } else {
        setError(err.message || '로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    promptAsync: handlePromptAsync,
    isLoading,
    error,
  };
};