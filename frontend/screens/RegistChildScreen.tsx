// 회원가입페이지 (자녀정보등록)
// frontend/screens/RegistChildScreen.tsx
/*
 * StepTwo 컴포넌트를 사용하여 자녀 정보를 등록합니다.
 * RegistScreen에서 회원가입 성공 후 또는 마이페이지에서 접근 가능합니다.
 */
import React, { useState } from 'react';
import { toastError, toastInfo, toastSuccess } from '@/libs/utils/toast';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
  const initialChildren: ChildData[] = user?.user_childs
    ? user.user_childs.map((child: any) => {
        // YYYY-MM-DD -> Date로 변환
        const birthDate = new Date(child.child_birth);
        return {
          childName: child.child_name,
          childBirth: birthDate,
          childGender: child.child_gender as 'M' | 'W' | '',
          allergies: child.allergy_codes?.map((code: string, index: number) => ({
            allergy_code: code,
            allergy_name: child.allergy_names?.[index] || '',
          })) || [],
        };
      })
    : [
        {
          childName: '',
          childBirth: new Date(),
          childGender: '',
          allergies: [],
        },
      ];

  const [childrenData, setChildrenData] = useState<ChildData[]>(initialChildren);
  const [isLoading, setIsLoading] = useState(false);

  // 나중에 등록하기 (건너뛰기)
  const handleSkip = () => {
    toastInfo('자녀 정보는 마이페이지에서 등록할 수 있습니다.');
    navigation.navigate('Tabs', { screen: 'MyPage' });
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

      // 사용자 정보 갱신하여 user_childs 업데이트
      await refreshUser();

      setIsLoading(false);

      toastSuccess('자녀 정보가 등록되었습니다!');
      navigation.navigate('Tabs', { screen: 'MyPage' });
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100}
      >
        {/* StepTwo 컴포넌트 사용 */}
        <StepTwo
          childrenData={childrenData}
          onChildrenDataChange={setChildrenData}
          onNext={handleSubmit}
          onBack={handleSkip}
          nextButtonText="등록 완료"
          backButtonText="나중에 등록하기"
          isLoading={isLoading}
        />
      </KeyboardAvoidingView>
    </Layout>
  );
}
