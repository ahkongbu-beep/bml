import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { login as loginApi, logout as logoutApi, updateProfile as updateProfileApi, UpdateProfileRequest } from '../api/authApi';
import { LoginRequest, User } from '../types/UserType';
import {
  isLoggedIn as checkIsLoggedIn,
  getUserInfo,
  saveUserInfo,
  saveToken,
  logout as clearStorage,
} from '../utils/storage';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로드 시 저장된 사용자 정보 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const loggedIn = await checkIsLoggedIn();
        if (loggedIn) {
          const savedUser = await getUserInfo();
          if (savedUser) {
            setUser(savedUser);
            setIsAuthenticated(true);
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
          console.log('isAuthenticated set to true');
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

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    logoutLocal, // 백엔드 호출 없이 즉시 로그아웃
    updateProfile: updateProfileMutation.mutate,
    loginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
    updateProfileLoading: updateProfileMutation.isPending,
    updateProfileError: updateProfileMutation.error,
  };
};
