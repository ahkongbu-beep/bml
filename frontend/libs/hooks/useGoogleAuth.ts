import { useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import { saveToken, saveUserInfo } from '../utils/storage';
import { User } from '../types/UserType';

// 웹 브라우저를 통한 인증 세션 종료를 위해 필요합니다.
WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthConfig {
  androidClientId: string; // 안드로이드 네이티브 앱용 ID
  webClientId?: string;    // ID 토큰 발급 및 백엔드 검증용 ID
}

interface UseGoogleAuthReturn {
  promptAsync: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  response: Google.GoogleAuthSessionResult | null;
}

/**
 * 안드로이드 전용 구글 OAuth 로그인 커스텀 훅
 */
export const useGoogleAuth = (
  config: GoogleAuthConfig,
  onSuccess?: (idToken: string, userInfo: any) => Promise<{ success: boolean; data?: { user: User; token: string }; message?: string }>
): UseGoogleAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authResponse, setAuthResponse] = useState<Google.GoogleAuthSessionResult | null>(null);

  // Google OAuth 요청 설정 (SDK 50+ 표준 방식)
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: config.androidClientId,
    webClientId: config.webClientId,
    // 스코프 설정 (필요시 추가)
    scopes: ['profile', 'email'],
  });

  // response 상태 변경 감지
  useEffect(() => {
    if (response) {
      setAuthResponse(response);
      handleAuthResult(response);
    }
  }, [response]);

  // 인증 결과 처리 로직 분리
  const handleAuthResult = async (result: Google.GoogleAuthSessionResult) => {
    if (result.type === 'success' && result.authentication) {
      try {
        setIsLoading(true);
        const { accessToken, idToken } = result.authentication;

        if (!idToken) {
          throw new Error('ID 토큰을 받지 못했습니다. Google 콘솔의 Web Client ID 설정을 확인하세요.');
        }

        // 1. Google UserInfo API로 사용자 정보 가져오기
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!userInfoResponse.ok) throw new Error('사용자 정보를 가져오는데 실패했습니다.');
        const userInfo = await userInfoResponse.json();

        // 2. 백엔드 성공 콜백 실행
        if (onSuccess) {
          const backendResponse = await onSuccess(idToken, userInfo);
          if (backendResponse.success && backendResponse.data) {
            await saveToken(backendResponse.data.token);
            await saveUserInfo(backendResponse.data.user);
          } else {
            throw new Error(backendResponse.message || '로그인 처리에 실패했습니다.');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    } else if (result.type === 'error') {
      setError(result.error?.message || '구글 로그인 중 오류가 발생했습니다.');
    }
  };

  const handlePromptAsync = async () => {
    if (!config.androidClientId) {
      setError('Android Client ID가 설정되지 않았습니다.');
      return;
    }
    setError(null);
    // 개발 빌드(dev-client) 환경에서는 자동으로 네이티브 흐름을 탑니다.
    await promptAsync();
  };

  return {
    promptAsync: handlePromptAsync,
    isLoading,
    error,
    response: authResponse,
  };
};