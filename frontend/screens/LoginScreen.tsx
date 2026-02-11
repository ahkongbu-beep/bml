import React, { useState } from 'react';
import styles from './LoginScreen.styles';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../libs/contexts/AuthContext';
import { useGoogleAuth } from '../libs/hooks/useGoogleAuth';
import Layout from '@/components/Layout';
import { toastError } from '../libs/utils/toast';

export default function LoginScreen({ navigation }: any) {
  // 1. 변수를 안전하게 가져오기 (기본값 설정)
  const androidId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const webId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const appName = process.env.EXPO_PUBLIC_APP_NAME || "BML";
  const appSubtitle = process.env.EXPO_PUBLIC_APP_SUBTITLE || "건강한 식단 관리";

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, loginLoading, loginError, googleLogin, googleLoginLoading } = useAuth();

  // Google Client ID 존재 여부 확인
  const hasGoogleClientId =
    !!process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID &&
    !!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  // Android Client ID로 인증, Web Client ID로 ID 토큰 받기
  const googleConfig = {
    androidClientId: androidId || '',
    webClientId: webId || '',
  };

  // 구글 로그인 훅 - Client ID가 없어도 안전하게 동작
  const { promptAsync: googlePromptAsync, isLoading: googleAuthLoading, error: googleError } = useGoogleAuth(
    googleConfig,
    async (idToken, userInfo, serverAuthCode) => {
      await googleLogin({
        idToken: idToken,
        accessToken: undefined,
        refreshToken: serverAuthCode || undefined  // serverAuthCode를 refreshToken으로 사용
      });

      return { success: true };
    }
  );

  // 구글 로그인 핸들러
  WebBrowser.maybeCompleteAuthSession();

  const handleGoogleLogin = async () => {
    try {
      await googlePromptAsync();
    } catch (error) {
      toastError('구글 로그인 중 문제가 발생했습니다.');
    }
  };

  // 구글 로그인 에러 표시
  React.useEffect(() => {
    if (googleError) {
      toastError('구글 로그인 오류: ' + googleError);
    }
  }, [googleError]);

  const handleLogin = () => {
    if (!email.trim()) {
      toastError('이메일을 입력해주세요.');
      return;
    }
    if (!password.trim()) {
      toastError('비밀번호를 입력해주세요.');
      return;
    }

    login({ email, password });
  };

  return (
    <Layout>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 로고 */}
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>{appName}</Text>
            <Text style={styles.subtitle}>{appSubtitle}</Text>
          </View>

          {/* 입력 폼 */}
          <View style={styles.formContainer}>
            {/* 이메일 입력 */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#FF9AA2" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="이메일을 입력하세요."
                placeholderTextColor="#B0B0B0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* 비밀번호 입력 */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#FF9AA2" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="비밀번호를 입력하세요."
                placeholderTextColor="#B0B0B0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#B0B0B0"
                />
              </TouchableOpacity>
            </View>

            {/* 에러 메시지 */}
            {loginError && (
              <Text style={styles.errorText}>
                로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.
              </Text>
            )}

            {/* 로그인 버튼 */}
            <TouchableOpacity
              style={[styles.loginButton, loginLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>로그인</Text>
              )}
            </TouchableOpacity>

            {/* 구글 로그인 - Google Client ID가 설정되어 있을 때만 표시 */}
            {hasGoogleClientId && (
              <>
                <TouchableOpacity
                  style={[styles.loginButton, styles.googleButton, (googleLoginLoading || googleAuthLoading) && styles.loginButtonDisabled]}
                  onPress={handleGoogleLogin}
                  disabled={googleLoginLoading || googleAuthLoading || loginLoading}
                >
                  {(googleLoginLoading || googleAuthLoading) ? (
                    <ActivityIndicator color="#3C4043" />
                  ) : (
                    <View style={styles.googleButtonContent}>
                      <Ionicons name="logo-google" size={24} color="#4285F4" style={styles.googleIcon} />
                      <Text style={styles.googleButtonText}>Google로 계속하기</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* 구글 로그인 에러 메시지 */}
                {googleError && (
                  <Text style={styles.errorText}>{googleError}</Text>
                )}
              </>
            )}

            {/* 추가 링크 */}
            <View style={styles.linksContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate('SearchAccount')}
              >
                <Text style={styles.linkText}>이메일 찾기</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                onPress={() => navigation.navigate('SearchPassword')}
              >
                <Text style={styles.linkText}>비밀번호 찾기</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity onPress={() => navigation.navigate('Regist')}>
                <Text style={styles.linkText}>회원가입</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
}
