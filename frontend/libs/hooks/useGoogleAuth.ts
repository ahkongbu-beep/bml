import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { saveToken, saveUserInfo } from '../utils/storage';
import { User } from '../types/UserType';

// WebBrowser 설정 (OAuth 리다이렉트 후 브라우저 자동 닫기)
WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthConfig {
  iosClientId?: string;
  androidClientId?: string;
  webClientId?: string;
  expoClientId?: string;
}

interface UseGoogleAuthReturn {
  promptAsync: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  response: Google.GoogleAuthSessionResult | null;
}

/**
 * 구글 OAuth 로그인을 위한 커스텀 훅
 *
 * @param config - 플랫폼별 Google OAuth Client ID 설정
 * @param onSuccess - 로그인 성공 시 백엔드 API를 호출하는 콜백 함수
 * @returns promptAsync, isLoading, error, response
 *
 * @example
 * ```tsx
 * const { promptAsync, isLoading } = useGoogleAuth({
 *   iosClientId: 'YOUR_IOS_CLIENT_ID',
 *   androidClientId: 'YOUR_ANDROID_CLIENT_ID',
 *   webClientId: 'YOUR_WEB_CLIENT_ID',
 * }, async (token, userInfo) => {
 *   // 백엔드 API 호출
 *   const response = await googleLoginApi({ id_token: token, user_info: userInfo });
 *   return response;
 * });
 *
 * <TouchableOpacity onPress={() => promptAsync()}>
 *   <Text>구글 로그인</Text>
 * </TouchableOpacity>
 * ```
 */
export const useGoogleAuth = (
  config: GoogleAuthConfig,
  onSuccess?: (accessToken: string, userInfo: any) => Promise<{ success: boolean; data?: { user: User; token: string }; message?: string }>
): UseGoogleAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authResponse, setAuthResponse] = useState<Google.GoogleAuthSessionResult | null>(null);

  // Google OAuth 요청 설정
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: config.iosClientId,
    androidClientId: config.androidClientId,
    webClientId: config.webClientId,
    expoClientId: config.expoClientId,
    redirectUri: makeRedirectUri({
      scheme: 'your-app-scheme', // app.json의 scheme과 일치시켜야 함
      path: 'redirect',
    }),
    scopes: ['profile', 'email'],
  });

  // 구글 로그인 프롬프트 실행
  const handlePromptAsync = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // OAuth 프롬프트 실행
      const result = await promptAsync();
      setAuthResponse(result);

      // 로그인 성공 시
      if (result.type === 'success' && result.authentication) {
        const { accessToken } = result.authentication;

        // Google UserInfo API로 사용자 정보 가져오기
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!userInfoResponse.ok) {
          throw new Error('사용자 정보를 가져오는데 실패했습니다.');
        }

        const userInfo = await userInfoResponse.json();
        console.log('Google User Info:', userInfo);

        // 백엔드 API 호출 (onSuccess 콜백)
        if (onSuccess) {
          const backendResponse = await onSuccess(accessToken, userInfo);

          if (backendResponse.success && backendResponse.data) {
            const { user, token } = backendResponse.data;

            // 로컬 저장소에 저장
            await saveToken(token);
            await saveUserInfo(user);

            console.log('구글 로그인 성공:', user);
          } else {
            throw new Error(backendResponse.message || '로그인에 실패했습니다.');
          }
        }
      } else if (result.type === 'error') {
        throw new Error(result.error?.message || '구글 로그인 중 오류가 발생했습니다.');
      } else if (result.type === 'dismiss') {
        setError('로그인이 취소되었습니다.');
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    promptAsync: handlePromptAsync,
    isLoading,
    error,
    response: authResponse,
  };
};
