// 회원가입페이지 (자녀정보등록)
// frontend/screens/RegistChildScreen.tsx
/*
 * StepTwo 컴포넌트를 사용하여 자녀 정보를 등록합니다.
 * RegistScreen에서 회원가입 성공 후 또는 마이페이지에서 접근 가능합니다.
 */
import React, { useState, useEffect } from 'react';
import { toastError, toastInfo, toastSuccess } from '@/libs/utils/toast';
import { useAuth } from '../libs/contexts/AuthContext';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { registerChildren } from '../libs/hooks/useUsers';
import StepTwo from '../components/UserRegist/StepTwo';

interface AllergyItem {
  allergy_code: string;
  allergy_name: string;
}

interface ChildData {
  childName: string;
  childBirth: Date;
  childGender: 'M' | 'W' | '';
  allergies: AllergyItem[];
}

export default function RegistChildScreen({ navigation, route }: any) {
  const { user, isLoading: authLoading, refreshUser } = useAuth();

  // user_childs가 있을 경우 초기값으로 세팅 (ChildData 형식으로 변환)
  const initialChildren: ChildData[] = user?.user_childs?.length
    ? user.user_childs.map((child: any) => ({
        childName: child.child_name,
        childBirth: new Date(child.child_birth),
        childGender: child.child_gender as 'M' | 'W' | '',
        allergies: (child.allergy_codes ?? []).map((code: string, index: number) => ({
          allergy_code: code,
          allergy_name: child.allergy_names?.[index] || '',
        })),
      }))
    : [{ childName: '', childBirth: new Date(), childGender: '', allergies: [] }];

  const [childrenData, setChildrenData] = useState<ChildData[]>(initialChildren);
  const [isLoading, setIsLoading] = useState(false);

  // 화면 진입 시 최신 유저 정보 갱신
  useEffect(() => {
    refreshUser();
  }, []);

  // refreshUser 완료 후 user 데이터가 바뀌면 자녀 목록 초기값 재세팅
  useEffect(() => {
    if (!user?.user_childs?.length) return;
    const updated: ChildData[] = user.user_childs.map((child: any) => ({
      childName: child.child_name,
      childBirth: new Date(child.child_birth),
      childGender: child.child_gender as 'M' | 'W' | '',
      allergies: (child.allergy_codes ?? []).map((code: string, index: number) => ({
        allergy_code: code,
        allergy_name: child.allergy_names?.[index] || '',
      })),
    }));

    console.log('유저 정보 갱신 - 자녀 데이터 초기화:', updated);
    setChildrenData(updated);
  }, [user]);


  // 나중에 등록하기 (건너뛰기)
  const handleSkip = () => {
    toastInfo('자녀 정보는 마이페이지에서 등록할 수 있습니다.');
    navigation.navigate('Tabs', { screen: 'MealPlan' });
  };

  // 등록 완료
  const handleSubmit = async () => {
    if (childrenData.length === 0) {
      toastInfo('최소 1명 이상의 자녀 정보를 등록해주세요.');
      return;
    }

    // 필수 정보 검증
    const isValid = childrenData.every(child =>
      child.childName.trim().length >= 2 && child.childGender !== ''
    );

    if (!isValid) {
      toastInfo('모든 자녀의 이름(2자 이상)과 성별을 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // API 형식에 맞게 데이터 변환
      const childrenDataForApi = childrenData.map((child, index) => {
        // Date -> YYYY-MM-DD 변환
        const formattedBirth = child.childBirth.toISOString().split('T')[0];

        return {
          child_id: user?.user_childs?.[index]?.id,
          child_name: child.childName.trim(),
          child_birth: formattedBirth,
          child_gender: child.childGender,
          is_agent: index === 0 ? 'Y' : 'N', // 첫 번째 자녀를 대표자녀로
          allergies: child.allergies.map((allergy) => allergy.allergy_code),
        };
      });

      const result = await registerChildren(childrenDataForApi);
      if (!result.success) {
        throw new Error(result.error || '자녀 정보 등록에 실패했습니다.');
      }

      await refreshUser();

      setIsLoading(false);

      toastSuccess('자녀 정보가 등록되었습니다!');
      navigation.navigate('Tabs', { screen: 'MenuList' });
    } catch (error: any) {
      setIsLoading(false);
      toastError(error?.message || '자녀 정보 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <Layout>
      <Header
        title="자녀 정보 등록"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />
      {/* StepTwo 내부에 SafeArea/Keyboard 처리가 포함되어 있어 중복 래핑을 제거합니다. */}
      <StepTwo
        childrenData={childrenData}
        onChildrenDataChange={setChildrenData}
        onNext={handleSubmit}
        onBack={handleSkip}
        nextButtonText="등록 완료"
        backButtonText="나중에 등록하기"
        isLoading={isLoading}
      />
    </Layout>
  );
}
