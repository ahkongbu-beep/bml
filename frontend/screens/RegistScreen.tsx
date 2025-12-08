// 회원가입페이지
// frontend/screens/RegistScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Header from '../components/Header';
import Layout from '../components/Layout';
import { useRegister } from '../libs/hooks/useUsers';
import { useAgeGroups } from '../libs/hooks/useCategories';
import { RegisterRequest } from '../libs/types/ApiTypes';

export default function RegistScreen({ navigation }: any) {
  // Form State
  const [snsLoginType, setSnsLoginType] = useState<'EMAIL'>('EMAIL');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState<string | undefined>();
  const [description, setDescription] = useState('');
  const [childBirth, setChildBirth] = useState(''); // YYYY-MM-DD
  const [childGender, setChildGender] = useState<'M' | 'W'>('M');
  const [childAgeGroup, setChildAgeGroup] = useState<number>(0);
  const [marketingAgree, setMarketingAgree] = useState<number>(0);
  const [pushAgree, setPushAgree] = useState<number>(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Hooks
  const { data: ageGroups, isLoading: ageGroupsLoading } = useAgeGroups();
  const registerMutation = useRegister();

  // 프로필 이미지 선택
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('알림', '갤러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // 생년월일 입력 포맷팅 (YYYY-MM-DD)
  const handleBirthChange = (text: string) => {
    // 숫자만 추출
    const numbers = text.replace(/[^0-9]/g, '');

    let formatted = '';
    if (numbers.length <= 4) {
      formatted = numbers;
    } else if (numbers.length <= 6) {
      formatted = `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
    } else {
      formatted = `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`;
    }

    setChildBirth(formatted);
  };

  // 전화번호 입력 포맷팅
  const handlePhoneChange = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');

    let formatted = '';
    if (numbers.length <= 3) {
      formatted = numbers;
    } else if (numbers.length <= 7) {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }

    setPhone(formatted);
  };

  // 회원가입 처리
  const handleRegister = () => {
    // 필수 입력 검증
    if (!name.trim()) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return;
    }
    if (!nickname.trim()) {
      Alert.alert('알림', '닉네임을 입력해주세요.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('알림', '이메일을 입력해주세요.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('알림', '비밀번호를 입력해주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert('알림', '비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('알림', '전화번호를 입력해주세요.');
      return;
    }
    if (childAgeGroup === 0) {
      Alert.alert('알림', '자녀 연령대를 선택해주세요.');
      return;
    }

    const registerData: RegisterRequest = {
      sns_login_type: snsLoginType,
      name: name.trim(),
      nickname: nickname.trim(),
      email: email.trim(),
      password: password.trim(),
      phone: phone.replace(/[^0-9]/g, ''),
      address: address.trim(),
      profile_image: profileImage,
      description: description.trim(),
      child_birth: childBirth || undefined,
      child_gender: childGender,
      child_age_group: childAgeGroup,
      marketing_agree: marketingAgree,
      push_agree: pushAgree,
    };

    registerMutation.mutate(registerData, {
      onSuccess: (response) => {
        if (response.success) {
          Alert.alert('회원가입 완료', '회원가입이 완료되었습니다.', [
            {
              text: '확인',
              onPress: () => navigation.navigate('Login'),
            },
          ]);
        }
      },
      onError: (error: any) => {
        Alert.alert(
          '회원가입 실패',
          error?.response?.data?.message || '회원가입에 실패했습니다.'
        );
      },
    });
  };

  return (
    <Layout>
      <Header
        title="회원가입"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          {/* 프로필 이미지 */}
          <View style={styles.imageSection}>
            <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera" size={32} color="#FF9AA2" />
                  <Text style={styles.imagePlaceholderText}>프로필 사진</Text>
                  <Text style={styles.imageOptionalText}>(선택사항)</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* 기본 정보 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>기본 정보</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                이름 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="이름을 입력해주세요"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                닉네임 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="닉네임을 입력해주세요"
                value={nickname}
                onChangeText={setNickname}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                이메일 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                비밀번호 <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="비밀번호를 입력해주세요"
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
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                비밀번호 확인 <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="비밀번호를 다시 입력해주세요"
                  value={passwordConfirm}
                  onChangeText={setPasswordConfirm}
                  secureTextEntry={!showPasswordConfirm}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPasswordConfirm ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#B0B0B0"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                전화번호 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="010-0000-0000"
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                maxLength={13}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>주소</Text>
              <TextInput
                style={styles.input}
                placeholder="주소를 입력해주세요"
                value={address}
                onChangeText={setAddress}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>소개글</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="자기소개를 입력해주세요"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* 자녀 정보 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>자녀 정보</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>자녀 생년월일</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={childBirth}
                onChangeText={handleBirthChange}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                자녀 성별 <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    childGender === 'M' && styles.genderButtonActive,
                  ]}
                  onPress={() => setChildGender('M')}
                >
                  <Ionicons
                    name="male"
                    size={20}
                    color={childGender === 'M' ? '#FFFFFF' : '#4A4A4A'}
                  />
                  <Text
                    style={[
                      styles.genderButtonText,
                      childGender === 'M' && styles.genderButtonTextActive,
                    ]}
                  >
                    남자아이
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    childGender === 'W' && styles.genderButtonActive,
                  ]}
                  onPress={() => setChildGender('W')}
                >
                  <Ionicons
                    name="female"
                    size={20}
                    color={childGender === 'W' ? '#FFFFFF' : '#4A4A4A'}
                  />
                  <Text
                    style={[
                      styles.genderButtonText,
                      childGender === 'W' && styles.genderButtonTextActive,
                    ]}
                  >
                    여자아이
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                자녀 연령대 <Text style={styles.required}>*</Text>
              </Text>
              {ageGroupsLoading ? (
                <ActivityIndicator color="#FF9AA2" />
              ) : (
                <View style={styles.ageGroupContainer}>
                  {ageGroups?.map((group) => (
                    <TouchableOpacity
                      key={group.id}
                      style={[
                        styles.ageGroupButton,
                        childAgeGroup === group.id && styles.ageGroupButtonActive,
                      ]}
                      onPress={() => setChildAgeGroup(group.id)}
                    >
                      <Text
                        style={[
                          styles.ageGroupButtonText,
                          childAgeGroup === group.id && styles.ageGroupButtonTextActive,
                        ]}
                      >
                        {group.value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* 약관 동의 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>약관 동의</Text>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setMarketingAgree(marketingAgree ? 0 : 1)}
            >
              <Ionicons
                name={marketingAgree ? 'checkbox' : 'square-outline'}
                size={24}
                color={marketingAgree ? '#FF9AA2' : '#B0B0B0'}
              />
              <Text style={styles.checkboxText}>마케팅 정보 수신 동의 (선택)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setPushAgree(pushAgree ? 0 : 1)}
            >
              <Ionicons
                name={pushAgree ? 'checkbox' : 'square-outline'}
                size={24}
                color={pushAgree ? '#FF9AA2' : '#B0B0B0'}
              />
              <Text style={styles.checkboxText}>푸시 알림 수신 동의 (선택)</Text>
            </TouchableOpacity>
          </View>

          {/* 회원가입 버튼 */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              registerMutation.isPending && styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>회원가입</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFBF7',
  },
  container: {
    padding: 20,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#4A4A4A',
    fontWeight: '600',
  },
  imageOptionalText: {
    fontSize: 12,
    color: '#B0B0B0',
    marginTop: 2,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A4A4A',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 8,
  },
  required: {
    color: '#FF6B6B',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#4A4A4A',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#4A4A4A',
  },
  eyeIcon: {
    padding: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    paddingVertical: 14,
    gap: 8,
  },
  genderButtonActive: {
    backgroundColor: '#FF9AA2',
    borderColor: '#FF9AA2',
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  ageGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ageGroupButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  ageGroupButtonActive: {
    backgroundColor: '#FF9AA2',
    borderColor: '#FF9AA2',
  },
  ageGroupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  ageGroupButtonTextActive: {
    color: '#FFFFFF',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  checkboxText: {
    fontSize: 14,
    color: '#4A4A4A',
  },
  registerButton: {
    backgroundColor: '#FF9AA2',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
    shadowColor: '#FF9AA2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});