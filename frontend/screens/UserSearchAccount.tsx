/*
 * 이메일 찾기
 * 이메일 찾기는 휴대폰번호 + 이름으로 구성
 * 각 영역에서 입력된 값으로 백엔드에 사용자 존재여부 확인
 * 조회하여 조회 결과가 있을 경우 아래에 이메일을 화면에 노출
 * 이메일은 1/3 은 마스킹 처리하고 노출
 */

import React, { useState } from 'react';
import styles from './UserSearchAccount.styles';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { validatePhoneNumber } from '../libs/utils/common';
import { useSearchAccount } from '../libs/hooks/useUsers';

export default function UserSearchAccount({ navigation }: any) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [foundEmail, setFoundEmail] = useState<string | null>(null);

  // React Query mutation hook
  const searchAccountMutation = useSearchAccount({ user_name: name, user_phone: phone });

  // 이메일 마스킹 처리 함수 (1/3 마스킹)
  const maskEmail = (email: string): string => {
    const [localPart, domain] = email.split('@');
    const visibleLength = Math.ceil(localPart.length / 3);
    const maskedLength = localPart.length - visibleLength;
    const masked = localPart.substring(0, visibleLength) + '*'.repeat(maskedLength);
    return `${masked}@${domain}`;
  };

  // 이메일 찾기
  const handleSearchEmail = async () => {
    if (!name.trim()) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('알림', '휴대폰 번호를 입력해주세요.');
      return;
    }

    // 휴대폰 번호 형식 검증
    if (!validatePhoneNumber(phone)) {
      Alert.alert('알림', '올바른 휴대폰 번호를 입력해주세요. (10-11자리 숫자)');
      return;
    }

    setFoundEmail(null);

    try {
      const result = await searchAccountMutation.mutateAsync();

      if (result.success === true && result.data?.email) {
        setFoundEmail(result.data.email);
      } else {
        Alert.alert('알림', result.error || '해당 정보로 가입된 계정을 찾을 수 없습니다.');
      }
    } catch (error: any) {
      Alert.alert('오류', error?.message || '이메일 찾기 중 오류가 발생했습니다.');
    }
  };

  // 초기화
  const handleReset = () => {
    setName('');
    setPhone('');
    setFoundEmail(null);
  };

  return (
    <Layout>
      <Header
        title="이메일 찾기"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* 안내 문구 */}
            <View style={styles.headerSection}>
              <Ionicons name="mail-outline" size={48} color="#FF9AA2" />
              <Text style={styles.title}>이메일을 잊으셨나요?</Text>
              <Text style={styles.subtitle}>
                가입 시 등록한 이름과 휴대폰 번호로{'\n'}
                이메일을 찾을 수 있습니다.
              </Text>
            </View>

            {/* 이메일 찾기 폼 */}
            <View style={styles.formContainer}>
              <Text style={styles.label}>이름</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#B0B0B0" />
                <TextInput
                  style={styles.input}
                  placeholder="이름을 입력하세요"
                  placeholderTextColor="#B0B0B0"
                  value={name}
                  onChangeText={setName}
                  editable={!searchAccountMutation.isPending}
                />
              </View>

              <Text style={styles.label}>휴대폰 번호</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="phone-portrait-outline" size={20} color="#B0B0B0" />
                <TextInput
                  style={styles.input}
                  placeholder="01012345678 (- 없이 입력)"
                  placeholderTextColor="#B0B0B0"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={11}
                  editable={!searchAccountMutation.isPending}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, searchAccountMutation.isPending && styles.disabledButton]}
                onPress={handleSearchEmail}
                disabled={searchAccountMutation.isPending}
              >
                {searchAccountMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>이메일 찾기</Text>
                    <Ionicons name="search" size={20} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* 이메일 조회 결과 */}
            {foundEmail && (
              <View style={styles.resultContainer}>
                <View style={styles.resultHeader}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  <Text style={styles.resultTitle}>이메일을 찾았습니다!</Text>
                </View>

                <View style={styles.emailBox}>
                  <Ionicons name="mail" size={20} color="#FF9AA2" />
                  <Text style={styles.emailText}>{maskEmail(foundEmail)}</Text>
                </View>

                <View style={styles.resultActions}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleReset}
                  >
                    <Text style={styles.secondaryButtonText}>다시 찾기</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => navigation.navigate('Login')}
                  >
                    <Text style={styles.primaryButtonText}>로그인하기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 도움말 */}
            <View style={styles.helpSection}>
              <Ionicons name="information-circle-outline" size={18} color="#B0B0B0" />
              <Text style={styles.helpText}>
                가입 정보가 기억나지 않으시면 고객센터로 문의해주세요.
              </Text>
            </View>

            {/* 다른 옵션 */}
            <View style={styles.optionsSection}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => navigation.navigate('UserSearchPassword')}
              >
                <Text style={styles.optionText}>비밀번호 찾기</Text>
                <Ionicons name="chevron-forward" size={16} color="#B0B0B0" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
}