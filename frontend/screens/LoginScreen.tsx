import React, { useState } from 'react';
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
import Layout from '@/components/Layout';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, loginLoading, loginError } = useAuth();

  const handleLogin = () => {
    if (!email.trim()) {
      Alert.alert('오류', '이메일을 입력해주세요.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('오류', '비밀번호를 입력해주세요.');
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
            <Text style={styles.logo}>BML</Text>
            <Text style={styles.subtitle}>Baby Meal List</Text>
          </View>

          {/* 입력 폼 */}
          <View style={styles.formContainer}>
            {/* 이메일 입력 */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#FF9AA2" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="이메일"
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
                placeholder="비밀번호"
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

            {/* 추가 링크 */}
            <View style={styles.linksContainer}>
              <TouchableOpacity>
                <Text style={styles.linkText}>비밀번호 찾기</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity onPress={() => navigation.navigate('Regist')}>
                <Text style={styles.linkText}>회원가입</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* SNS 로그인
          <View style={styles.snsContainer}>
            <Text style={styles.snsTitle}>SNS 로그인</Text>
            <View style={styles.snsButtons}>
              <TouchableOpacity style={[styles.snsButton, styles.kakaoButton]}>
                <Text style={styles.snsButtonText}>카카오</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.snsButton, styles.naverButton]}>
                <Text style={styles.snsButtonText}>네이버</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.snsButton, styles.googleButton]}>
                <Text style={styles.snsButtonText}>Google</Text>
              </TouchableOpacity>
            </View>
          </View> */}
        </ScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF7',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FF9AA2',
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A',
    marginTop: 8,
    letterSpacing: 1,
  },
  formContainer: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#4A4A4A',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#FF9AA2',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#FF9AA2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    color: '#4A4A4A',
    fontSize: 14,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: '#B0B0B0',
    marginHorizontal: 16,
  },
  snsContainer: {
    marginTop: 24,
  },
  snsTitle: {
    textAlign: 'center',
    color: '#4A4A4A',
    fontSize: 14,
    marginBottom: 16,
  },
  snsButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  snsButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
  },
  naverButton: {
    backgroundColor: '#03C75A',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  snsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
  },
});
