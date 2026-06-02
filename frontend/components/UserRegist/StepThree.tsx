import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { consumeConsentPending } from '../../libs/utils/consentPending';
import { getMessaging, requestPermission, AuthorizationStatus } from '@react-native-firebase/messaging';

interface StepThreeProps {
  marketingAgree: number;
  pushAgree: number;
  onMarketingAgreeChange: (value: number) => void;
  onPushAgreeChange: (value: number) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function StepThree({
  marketingAgree,
  pushAgree,
  onMarketingAgreeChange,
  onPushAgreeChange,
  onSubmit,
  onBack,
  isLoading = false,
}: StepThreeProps) {
  const [privacyAgree, setPrivacyAgree] = useState(false);
  const [termsAgree, setTermsAgree] = useState(false);
  const navigation = useNavigation<any>();

  // 약관 화면에서 확인 누르고 돌아왔을 때 자동 체크
  useFocusEffect(
    useCallback(() => {
      const pending = consumeConsentPending();
      if (pending.privacy) setPrivacyAgree(true);
      if (pending.terms) setTermsAgree(true);
    }, [])
  );

  const canSubmit = () => {
    return privacyAgree && termsAgree;
  };

  const handlePushAgreeChange = async (newValue: number) => {
    if (newValue === 1) {
      // 동의 ON 시 현재 알림 권한 확인
      const authStatus = await requestPermission(getMessaging());
      const granted =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (!granted) {
        Alert.alert(
          '알림 권한 없음',
          '푸시 알림을 받으려면 기기 설정에서 알림을 허용해주세요.',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '설정 열기',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        // 권한 없으면 동의 ON 하지 않음
        return;
      }
    }
    onPushAgreeChange(newValue);
  };

  const toggleAllAgree = async () => {
    const newValue = !(privacyAgree && termsAgree);
    setPrivacyAgree(newValue);
    setTermsAgree(newValue);
    onMarketingAgreeChange(newValue ? 1 : 0);
    await handlePushAgreeChange(newValue ? 1 : 0);
  };

  const allAgreed = privacyAgree && termsAgree && marketingAgree === 1 && pushAgree === 1;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
      >
        <View style={styles.container}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            keyboardShouldPersistTaps='handled'
            contentContainerStyle={{ paddingBottom: 40 }}
          >
        <Text style={styles.title}>약관 동의</Text>
        <Text style={styles.subtitle}>
          서비스 이용을 위해 아래 약관에 동의해주세요
        </Text>

        {/* 전체 동의 */}
        <TouchableOpacity style={styles.allAgreeContainer} onPress={toggleAllAgree}>
          <View style={styles.checkboxRow}>
            <View style={[styles.checkbox, allAgreed && styles.checkboxChecked]}>
              {allAgreed && <Ionicons name="checkmark" size={20} color="#FFF" />}
            </View>
            <Text style={styles.allAgreeText}>전체 동의</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* 필수 - 개인정보 처리방침 */}
        <View style={styles.agreeItem}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setPrivacyAgree(!privacyAgree)}
          >
            <View style={[styles.checkbox, privacyAgree && styles.checkboxChecked]}>
              {privacyAgree && <Ionicons name="checkmark" size={20} color="#FFF" />}
            </View>
            <View style={styles.agreeTextContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.requiredBadge}>필수</Text>
                <Text style={styles.agreeText}>개인정보 처리방침</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewButton} onPress={() => navigation.navigate('PrivacyPolicy', { agreeType: 'privacy' })}>
            <Text style={styles.viewButtonText}>보기</Text>
          </TouchableOpacity>
        </View>

        {/* 필수 - 이용약관 */}
        <View style={styles.agreeItem}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setTermsAgree(!termsAgree)}
          >
            <View style={[styles.checkbox, termsAgree && styles.checkboxChecked]}>
              {termsAgree && <Ionicons name="checkmark" size={20} color="#FFF" />}
            </View>
            <View style={styles.agreeTextContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.requiredBadge}>필수</Text>
                <Text style={styles.agreeText}>이용약관</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewButton} onPress={() => navigation.navigate('TermsOfService', { agreeType: 'terms' })}>
            <Text style={styles.viewButtonText}>보기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* 선택 - 마케팅 정보 수신 동의 */}
        <TouchableOpacity
          style={styles.agreeItem}
          onPress={() => onMarketingAgreeChange(marketingAgree === 1 ? 0 : 1)}
        >
          <View style={styles.checkboxRow}>
            <View
              style={[styles.checkbox, marketingAgree === 1 && styles.checkboxChecked]}
            >
              {marketingAgree === 1 && <Ionicons name="checkmark" size={20} color="#FFF" />}
            </View>
            <View style={styles.agreeTextContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.optionalBadge}>선택</Text>
                <Text style={styles.agreeText}>마케팅 정보 수신 동의</Text>
              </View>
              <Text style={styles.agreeDescription}>
                이벤트, 프로모션 등의 마케팅 정보를 받아보실 수 있습니다.
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 선택 - 푸시 알림 수신 동의 */}
        <TouchableOpacity
          style={styles.agreeItem}
          onPress={() => handlePushAgreeChange(pushAgree === 1 ? 0 : 1)}
        >
          <View style={styles.checkboxRow}>
            <View style={[styles.checkbox, pushAgree === 1 && styles.checkboxChecked]}>
              {pushAgree === 1 && <Ionicons name="checkmark" size={20} color="#FFF" />}
            </View>
            <View style={styles.agreeTextContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.optionalBadge}>선택</Text>
                <Text style={styles.agreeText}>푸시 알림 수신 동의</Text>
              </View>
              <Text style={styles.agreeDescription}>
                새로운 소식과 알림을 푸시로 받아보실 수 있습니다.
              </Text>
            </View>
          </View>
        </TouchableOpacity>
          </ScrollView>

          {/* 버튼 */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={isLoading}>
              <Text style={styles.backButtonText}>이전</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, !canSubmit() && styles.submitButtonDisabled]}
              onPress={onSubmit}
              disabled={!canSubmit() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>가입완료</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  allAgreeContainer: {
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  allAgreeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  agreeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  agreeTextContainer: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requiredBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3B30',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  optionalBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  agreeText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  agreeDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#FF8C00',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    marginLeft: 8,
  },
  viewButtonText: {
    fontSize: 13,
    color: '#666',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
