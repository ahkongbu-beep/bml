import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  login as loginApi,
  logout as logoutApi,
  updateProfile as updateProfileApi,
  UpdateProfileRequest,
  getUserProfile,
  googleLogin as googleLoginApi,
  GoogleLoginRequest,
  withdrawalApi
} from '../api/authApi';
import { LoginRequest, User } from '../types/UserType';
import {
  isLoggedIn as checkIsLoggedIn,
  getUserInfo,
  saveUserInfo,
  saveToken,
  logout as clearStorage,
  saveNeedChildRegistration,
  isTokenExpired,
  isTokenExpiringSoon,
} from '../utils/storage';

interface AuthContextType {
  user: User | null;
  view_hash: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => void;
  googleLogin: (data: GoogleLoginRequest) => void;
  logout: () => void;
  logoutLocal: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => void;
  refreshUser: () => Promise<void>;
  loginLoading: boolean;
  loginError: any;
  googleLoginLoading: boolean;
  googleLoginError: any;
  updateProfileLoading: boolean;
  updateProfileError: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로드 시 저장된 사용자 정보 확인 및 백엔드에서 최신 정보 가져오기
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const loggedIn = await checkIsLoggedIn();
        if (loggedIn) {
          // 토큰 만료 체크
          const tokenExpired = await isTokenExpired();
          if (tokenExpired) {
            console.log('토큰이 만료되었습니다. 로그아웃 처리합니다.');
            await clearStorage();
            setUser(null);
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
          }

          const savedUser = await getUserInfo();
          if (savedUser) {
            // 1. 먼저 저장된 정보로 빠르게 로드
            setUser(savedUser);
            setIsAuthenticated(true);

            // 2. 토큰이 곧 만료될 예정이면 경고 로그
            const expiringSoon = await isTokenExpiringSoon();
            if (expiringSoon) {
              console.warn('토큰이 1시간 이내에 만료됩니다. 다시 로그인하시기 바랍니다.');
            }

            // 3. 백그라운드에서 최신 프로필 정보 가져오기
            try {
              const responseData = await getUserProfile(savedUser.view_hash);
              if (responseData) {
                await saveUserInfo(responseData);
                setUser(responseData);
              }
            } catch (profileError: any) {
              // 401 에러면 토큰 만료로 간주하고 로그아웃
              if (profileError?.status === 401) {
                console.log('인증 실패. 로그아웃 처리합니다.');
                await clearStorage();
                setUser(null);
                setIsAuthenticated(false);
              }
              // 에러가 나도 기존 저장된 정보로 계속 사용
            }
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 로그인 Mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => loginApi(credentials),
    onSuccess: async (data) => {

      if (data.success && data.data) {
        const { user, token } = data.data;

        if (token && user) {
          await saveToken(token);
          await saveUserInfo(user);
          setUser(user);
          setIsAuthenticated(true);
        }
      } else {
        throw new Error(data.message || '로그인에 실패했습니다.');}
    },
  });

  // 구글 로그인 Mutation
  const googleLoginMutation = useMutation({
    mutationFn: (data: GoogleLoginRequest) => googleLoginApi(data),
    onSuccess: async (data) => {
      if (data.success && data.data) {
        const { user, token } = data.data;

        if (token && user) {
          await saveToken(token);
          await saveUserInfo(user);
          setUser(user);
          setIsAuthenticated(true);

          // 구글 로그인 성공 후 user_childs가 비어있으면 자녀 등록 화면으로 이동
          if (!user.user_childs || user.user_childs.length === 0) {
            await saveNeedChildRegistration();
          }
        }
      } else {
        throw new Error(data.message || '구글 로그인에 실패했습니다.');
      }
    },
  });

  // 로그아웃 Mutation
  const logoutMutation = useMutation({
    mutationFn: () => logoutApi(user?.view_hash || ''),
    onSuccess: async () => {
      await clearStorage();
      setUser(null);
      setIsAuthenticated(false);
    },
    onError: async () => {
      // 백엔드 에러가 발생해도 프론트엔드에서 로그아웃 처리
      await clearStorage();
      setUser(null);
      setIsAuthenticated(false);
    },
  });

  // 회원탈퇴
  const withdrawalMutation = useMutation({
    mutationFn: () => withdrawalApi(),
    onSuccess: async () => {
      await clearStorage();
      setUser(null);
      setIsAuthenticated(false);
    },
    onError: async () => {
      // 백엔드 에러가 발생해도 프론트엔드에서 로그아웃 처리
      await clearStorage();
      setUser(null);
      setIsAuthenticated(false);
    }
  });

  // 프로필 업데이트 Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateProfileApi(data),
    onSuccess: async (data) => {
      if (data.success && data.data) {
        await saveUserInfo(data.data);
        setUser(data.data);
      }
    },
  });

  // 로컬 로그아웃 (백엔드 호출 없이)
  const logoutLocal = async () => {
    await clearStorage();
    setUser(null);
    setIsAuthenticated(false);
  };

  // 사용자 정보 갱신
  const refreshUser = async () => {
    try {
      if (user?.view_hash) {
        const responseData = await getUserProfile(user.view_hash);
        if (responseData) {
          await saveUserInfo(responseData);
          setUser(responseData);
        }
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  const value = {
    user,
    view_hash: user?.view_hash || null,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutate,
    googleLogin: googleLoginMutation.mutate,
    logout: logoutMutation.mutate,
    logoutLocal,
    withdrawal: withdrawalMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    refreshUser,
    loginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
    googleLoginLoading: googleLoginMutation.isPending,
    googleLoginError: googleLoginMutation.error,
    updateProfileLoading: updateProfileMutation.isPending,
    updateProfileError: updateProfileMutation.error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
