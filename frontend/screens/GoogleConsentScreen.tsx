import React, { useState } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import StepThree from '../components/UserRegist/StepThree';
import { useAuth } from '../libs/contexts/AuthContext';
import { updateProfile } from '../libs/api/authApi';
import { toastError } from '../libs/utils/toast';

export default function GoogleConsentScreen({ navigation }: any) {
  const [marketingAgree, setMarketingAgree] = useState<number>(0);
  const [pushAgree, setPushAgree] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        marketing_agree: marketingAgree === 1,
        push_agree: pushAgree === 1,
      });
      navigation.navigate('RegistChild');
    } catch (error) {
      toastError('동의 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <Header title="약관 동의" showBack onBackPress={handleBack} />
      <StepThree
        marketingAgree={marketingAgree}
        pushAgree={pushAgree}
        onMarketingAgreeChange={setMarketingAgree}
        onPushAgreeChange={setPushAgree}
        onSubmit={handleSubmit}
        onBack={handleBack}
        isLoading={isLoading}
      />
    </Layout>
  );
}
