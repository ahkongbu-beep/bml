import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  const canSubmit = () => {
    return privacyAgree && termsAgree;
  };

  const toggleAllAgree = () => {
    const newValue = !(privacyAgree && termsAgree);
    setPrivacyAgree(newValue);
    setTermsAgree(newValue);
    onMarketingAgreeChange(newValue ? 1 : 0);
    onPushAgreeChange(newValue ? 1 : 0);
  };

  const allAgreed = privacyAgree && termsAgree && marketingAgree === 1 && pushAgree === 1;

  return (
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
        <TouchableOpacity
          style={styles.agreeItem}
          onPress={() => setPrivacyAgree(!privacyAgree)}
        >
          <View style={styles.checkboxRow}>
            <View style={[styles.checkbox, privacyAgree && styles.checkboxChecked]}>
              {privacyAgree && <Ionicons name="checkmark" size={20} color="#FFF" />}
            </View>
            <View style={styles.agreeTextContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.requiredBadge}>필수</Text>
                <Text style={styles.agreeText}>개인정보 처리방침</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* 필수 - 이용약관 */}
        <TouchableOpacity
          style={styles.agreeItem}
          onPress={() => setTermsAgree(!termsAgree)}
        >
          <View style={styles.checkboxRow}>
            <View style={[styles.checkbox, termsAgree && styles.checkboxChecked]}>
              {termsAgree && <Ionicons name="checkmark" size={20} color="#FFF" />}
            </View>
            <View style={styles.agreeTextContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.requiredBadge}>필수</Text>
                <Text style={styles.agreeText}>이용약관</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </TouchableOpacity>

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
          onPress={() => onPushAgreeChange(pushAgree === 1 ? 0 : 1)}
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
  );
}

const styles = StyleSheet.create({
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
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
