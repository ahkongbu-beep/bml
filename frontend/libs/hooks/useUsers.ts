import { useQuery, useMutation } from '@tanstack/react-query';
import { register } from '../api/usersApi';
import { RegisterRequest } from '../types/ApiTypes';
import { getMyInfo, getUserProfile, getConfirmUser, getUserEmail, setResetUserPassword, setRegisterChildren } from '../api/authApi';

/**
 * 회원가입 Mutation
 */
export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterRequest) => register(data),
  });
};

export const useGetMyInfo = (userHash: string) => {
  return useQuery({
    queryKey: ['myInfo', userHash],
    queryFn: async () => {
      return getMyInfo(userHash);
    }
  });
};

/**
 * 타인의 프로필 조회
 * userHash: 조회할 사용자의 user_hash
 */
export const useGetUserProfile = (userHash: string) => {
  return useQuery({
    queryKey: ['userProfile', userHash],
    queryFn: () => getUserProfile(userHash),
    enabled: !!userHash,
  });
};

/**
 * 비밀번호 찾기(email or phone)
 * email: 사용자의 이메일
 * phone: 사용자의 휴대폰 번호
 */
 export const useConfirmUser = (type: 'email' | 'phone', value: string) => {
  if (type !== 'email' && type !== 'phone') {
    throw new Error("type은 'email' 또는 'phone'이어야 합니다.");
  }

  return useQuery({
    queryKey: ['confirmUser', type, value],
    queryFn: async () => getConfirmUser(type, value),
    enabled: !!value,
  });
};

/*
 * 사용자 요청에 의한 이메일 계정 검색
 * user_name : 사용자 이름
 * user_phone : 사용자 휴대폰 번호
 */
export const useSearchAccount = ({user_name, user_phone}: {user_name: string, user_phone: string}) => {
  return useMutation({
    mutationFn: () => getUserEmail(user_name, user_phone),
  });
}

/*
 * 사용자 요청에 의한 비밀번호 초기화
 * type : 'email' | 'phone'
 * value : email or phone 값
 */
export const useRequestPasswordReset = (type: 'email' | 'phone', user_hash: string) => {
  if (type !== 'email' && type !== 'phone') {
    throw new Error("type은 'email' 또는 'phone'이어야 합니다.");
  }

  return useMutation({
    mutationFn: () => setResetUserPassword(type, user_hash),
  });
}

/*
 * 자녀 정보 등록
 */
interface ChildInfo {
  child_name: string;
  child_birth: string;
  child_gender: 'M' | 'F';
  is_agent: string;
}

export const useRegisterChildren = (children: ChildInfo[]) => {
    return useMutation({
        mutationFn: () => setRegisterChildren(children),
    });
};

/**
 * 자녀 정보 등록 (직접 호출용)
 */
export const registerChildren = async (children: ChildInfo[]) => {
    return setRegisterChildren(children);
};
