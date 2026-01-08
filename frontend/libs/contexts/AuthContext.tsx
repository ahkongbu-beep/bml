    import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { login as loginApi, logout as logoutApi, updateProfile as updateProfileApi, UpdateProfileRequest, getProfileBySnsId } from '../api/authApi';
import { LoginRequest, User } from '../types/UserType';
import {
  isLoggedIn as checkIsLoggedIn,
  getUserInfo,
  saveUserInfo,
  saveToken,
  logout as clearStorage,
} from '../utils/storage';

interface AuthContextType {
  user: User | null;
  view_hash: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => void;
  logout: () => void;
  logoutLocal: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => void;
  loginLoading: boolean;
  loginError: any;
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
          const savedUser = await getUserInfo();
          if (savedUser) {
            // 1. 먼저 저장된 정보로 빠르게 로드
            setUser(savedUser);
            setIsAuthenticated(true);

            // 2. 백그라운드에서 최신 프로필 정보 가져오기
            try {
              console.log('Fetching latest profile from backend...');
              const response = await getProfileBySnsId(savedUser.sns_id);
              if (response.success && response.data) {
                console.log('Latest profile fetched, updating user info');
                await saveUserInfo(response.data);
                setUser(response.data);
              }
            } catch (profileError) {
              console.error('Failed to fetch latest profile:', profileError);
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
      console.log('Login onSuccess called', data);
      if (data.success && data.data) {
        const { user, token } = data.data;
        console.log('User and token found:', { user: !!user, token: !!token });
        if (token && user) {
          await saveToken(token);
          await saveUserInfo(user);
          setUser(user);
          setIsAuthenticated(true);
          console.log('isAuthenticated set to true in context');
        }
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

  const value = {
    user,
    view_hash: user?.view_hash || null,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    logoutLocal,
    updateProfile: updateProfileMutation.mutate,
    loginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
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
