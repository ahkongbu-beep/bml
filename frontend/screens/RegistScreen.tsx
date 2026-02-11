// 회원가입페이지 - 3단계 스텝
// frontend/screens/RegistScreen.tsx
import React, { useState } from 'react';
import styles from './RegistScreen.styles';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Header from '../components/Header';
import Layout from '../components/Layout';
import { useRegister } from '../libs/hooks/useUsers';
import { RegisterRequest } from '../libs/types/ApiTypes';
import { useAuth } from '../libs/contexts/AuthContext';
import { setNeedChildRegistration } from '../libs/utils/storage';
import StepOne from '../components/UserRegist/StepOne';
import StepTwo from '../components/UserRegist/StepTwo';
import StepThree from '../components/UserRegist/StepThree';
import { toastSuccess, toastError, toastInfo } from '../libs/utils/toast';

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

export default function RegistScreen({ navigation }: any) {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 - 이메일, 비밀번호, 프로필 이미지
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [profileImage, setProfileImage] = useState<string | undefined>(undefined);

  // 프로필 이미지 변경 핸들러 (로깅 포함)
  const handleProfileImageChange = (uri: string | undefined) => {
    setProfileImage(uri);
  };

  // Step 2 - 자녀 정보 (여러 명)
  const [childrenData, setChildrenData] = useState<ChildData[]>([
    {
      childName: '',
      childBirth: new Date(),
      childGender: '',
      allergies: [],
    },
  ]);

  // Step 3 - 약관 동의
  const [marketingAgree, setMarketingAgree] = useState<number>(0);
  const [pushAgree, setPushAgree] = useState<number>(0);

  const registerMutation = useRegister();
  const { login } = useAuth();

  // 단계별 제목
  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return '계정 만들기';
      case 2:
        return '우리아이 정보';
      case 3:
        return '약관 동의';
      default:
        return '회원가입';
    }
  };

  // Step 1 다음
  const handleStepOneNext = () => {
    setCurrentStep(2);
  };

  // Step 2 다음
  const handleStepTwoNext = () => {
    setCurrentStep(3);
  };

  // Step 2, 3 이전
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 최종 회원가입 처리
  const handleSubmit = async () => {
    // 첫 번째 자녀의 이름을 닉네임으로 사용
    let valid = true;
    let errMessage = "";

    if (nickname.trim() === '') {
      toastError('닉네임을 입력해주세요.');
      return;
    }
    if (password.trim() === '') {
      toastError('비밀번호를 입력해주세요.');
      return;
    }

    if (password !== passwordConfirm) {
      toastError('비밀번호가 일치하지 않습니다.');
      return;
    }

    childrenData.forEach((child) => {
      if (child.childName.trim() === '') {
        valid = false;
        errMessage = '자녀의 이름을 입력해주세요.';
        return;
      }

      if (child.childName.trim().length < 2) {
        valid = false;
        errMessage = '자녀의 이름은 최소 2자 이상이어야 합니다.';
        return;
      }
    });

    if (!valid) {
      toastError(errMessage);
      return;
    }

    const registerData: RegisterRequest = {
      sns_login_type: 'EMAIL',
      nickname: nickname.trim(),
      email: email.trim(),
      password: password.trim(),
      marketing_agree: marketingAgree,
      push_agree: pushAgree,
      profile_image: profileImage,
      children: childrenData.map((child) => ({
        child_name: child.childName.trim(),
        child_birth: child.childBirth.toISOString().split('T')[0], // YYYY-MM-DD 형식
        child_gender: child.childGender === 'W' ? 'W' : 'M',
        allergies: child.allergies.map((allergy) => allergy.allergy_code),
      })),
    };

    registerMutation.mutate(registerData, {
      onSuccess: async (response) => {
        if (response.success) {
          try {
            // 로그인
            await login({ email, password });

            // 로그인 성공 후 자녀 등록 페이지로 이동하거나
            // 여기서 바로 자녀 정보를 등록할 수 있습니다
            toastSuccess('회원가입이 완료되었습니다.');
          } catch (error) {
            navigation.navigate('Login');
          }
        } else {
          toastError(response.error || '회원가입에 실패했습니다.');
        }
      },
      onError: (error: any) => {
        toastError(error?.response?.data?.error || '회원가입에 실패했습니다.');
      },
    });
  };

  return (
    <Layout>
      <Header
        title={getStepTitle()}
        showBack={true}
        onBackPress={() => {
          if (currentStep === 1) {
            navigation.goBack();
          } else {
            handleBack();
          }
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100}
      >
        {/* 단계 인디케이터 */}
        <View style={styles.stepIndicator}>
          {[1, 2, 3].map((step) => (
            <View key={step} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep >= step && styles.stepCircleActive,
                  currentStep > step && styles.stepCircleCompleted,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    currentStep >= step && styles.stepNumberActive,
                  ]}
                >
                  {step}
                </Text>
              </View>
              {step < 3 && (
                <View
                  style={[
                    styles.stepLine,
                    currentStep > step && styles.stepLineActive,
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        {/* 단계별 컴포넌트 */}
        {currentStep === 1 && (
          <StepOne
            email={email}
            password={password}
            passwordConfirm={passwordConfirm}
            nickname={nickname}
            profileImage={profileImage}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onPasswordConfirmChange={setPasswordConfirm}
            onNicknameChange={setNickname}
            onProfileImageChange={handleProfileImageChange}
            onNext={handleStepOneNext}
          />
        )}

        {currentStep === 2 && (
          <StepTwo
            childrenData={childrenData}
            onChildrenDataChange={setChildrenData}
            onNext={handleStepTwoNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <StepThree
            marketingAgree={marketingAgree}
            pushAgree={pushAgree}
            onMarketingAgreeChange={setMarketingAgree}
            onPushAgreeChange={setPushAgree}
            onSubmit={handleSubmit}
            onBack={handleBack}
            isLoading={registerMutation.isPending}
          />
        )}
      </KeyboardAvoidingView>
    </Layout>
  );
}