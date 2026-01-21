/*
 * 비밀번호 찾기페이지
 * 화면 영역을 2개로 나눔 - 왼쪽 : 이메일로 찾기, 오른쪽 : 휴대폰으로 찾기
 * 각 영역에서 입력된 값으로 백엔드에 사용자 존재여부 확인
 * 사용자가 존재하면 인증코드 발송 화면으로 이동
 */
import React, { useState } from 'react';
import styles from './UserSearchPassword.styles';
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
import { getConfirmUser, useRequestPasswordReset } from '../libs/api/authApi';
import { validatePhoneNumber, validateEmail } from '../libs/utils/common';

export default function UserSearchPassword({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 이메일로 찾기
  const handleSearchByEmail = async () => {
    if (!email.trim()) {
      Alert.alert('알림', '이메일을 입력해주세요.');
      return;
    }

    // 이메일 형식 검증
    if (!validateEmail(email)) {
      Alert.alert('알림', '올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await getConfirmUser('email', email);
      setIsLoading(false);

      if (result.success === true) {
        Alert.alert('확인', '인증코드가 발송되었습니다.', [
          {
            text: '확인',
            onPress: async () => {
              try {
                await useRequestPasswordReset('email', result.data!.user_hash);
                Alert.alert('성공', '비밀번호 재설정 이메일이 발송되었습니다.');
              } catch (error: any) {
                Alert.alert('오류', error?.message || '비밀번호 재설정 요청 중 오류가 발생했습니다.');
              }
            }
          }
        ]);
      } else {
        Alert.alert('알림', result.error || '해당 이메일로 가입된 계정이 없습니다.');
      }
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('오류', error?.message || '사용자 확인 중 오류가 발생했습니다.');
    }
  };

  // 휴대폰으로 찾기
  const handleSearchByPhone = async () => {
    if (!phone.trim()) {
      Alert.alert('알림', '휴대폰 번호를 입력해주세요.');
      return;
    }

    // 휴대폰 번호 형식 검증 (숫자만)
    if (!validatePhoneNumber(phone)) {
      Alert.alert('알림', '올바른 휴대폰 번호를 입력해주세요. (10-11자리 숫자)');
      return;
    }

    setIsLoading(true);

    try {
      const result = await getConfirmUser('phone', phone);
      setIsLoading(false);

      if (result.success === true) {
        Alert.alert('확인', '인증코드가 발송되었습니다.', [
          {
            text: '확인',
            onPress: async () => {
              try {
                await useRequestPasswordReset('phone', result.data!.user_hash);
                Alert.alert('성공', '임시 비밀번호가 문자로 발송되었습니다.');
              } catch (error: any) {
                Alert.alert('오류', error?.message || '비밀번호 재설정 요청 중 오류가 발생했습니다.');
              }
            }
          }
        ]);
      } else {
        Alert.alert('알림', result.error || '해당 전화번호로 가입된 계정이 없습니다.');
      }
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('오류', error?.message || '사용자 확인 중 오류가 발생했습니다.');
    }
  };

  return (
    <Layout>
      <Header
        title="비밀번호 찾기"
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
            <Ionicons name="lock-closed-outline" size={48} color="#FF9AA2" />
            <Text style={styles.title}>비밀번호를 잊으셨나요?</Text>
            <Text style={styles.subtitle}>
              가입 시 등록한 이메일 또는 휴대폰 번호로{'\n'}
              비밀번호를 재설정할 수 있습니다.
            </Text>
          </View>

          {/* 탭 선택 */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'email' && styles.activeTab]}
              onPress={() => setActiveTab('email')}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={activeTab === 'email' ? '#FF9AA2' : '#B0B0B0'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'email' && styles.activeTabText,
                ]}
              >
                이메일로 찾기
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'phone' && styles.activeTab]}
              onPress={() => setActiveTab('phone')}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={20}
                color={activeTab === 'phone' ? '#FF9AA2' : '#B0B0B0'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'phone' && styles.activeTabText,
                ]}
              >
                휴대폰으로 찾기
              </Text>
            </TouchableOpacity>
          </View>

          {/* 이메일로 찾기 폼 */}
          {activeTab === 'email' && (
            <View style={styles.formContainer}>
              <Text style={styles.label}>이메일</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#B0B0B0" />
                <TextInput
                  style={styles.input}
                  placeholder="example@email.com"
                  placeholderTextColor="#B0B0B0"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.disabledButton]}
                onPress={handleSearchByEmail}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>인증코드 받기</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* 휴대폰으로 찾기 폼 */}
          {activeTab === 'phone' && (
            <View style={styles.formContainer}>
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
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.disabledButton]}
                onPress={handleSearchByPhone}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>인증코드 받기</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* 도움말 */}
          <View style={styles.helpSection}>
            <Ionicons name="information-circle-outline" size={18} color="#B0B0B0" />
            <Text style={styles.helpText}>
              가입 정보가 기억나지 않으시면 고객센터로 문의해주세요.
            </Text>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
}
