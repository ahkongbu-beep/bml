// 회원가입페이지
// frontend/screens/RegistScreen.tsx
import React, { useState } from 'react';
import styles from './RegistScreen.styles';
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
import { useAgeGroups, useCategoryCodes } from '../libs/hooks/useCategories';
import { RegisterRequest } from '../libs/types/ApiTypes';
import { useAuth } from '../libs/contexts/AuthContext';
import { saveToken, saveUserInfo, setNeedChildRegistration } from '../libs/utils/storage';

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
  const [dietGroup, setDietGroup] = useState<number[]>([]);
  const [marketingAgree, setMarketingAgree] = useState<number>(0);
  const [pushAgree, setPushAgree] = useState<number>(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Hooks
  const { data: mealGroups, isLoading: mealGroupsLoading } = useCategoryCodes("MEALS_GROUP");

  const registerMutation = useRegister();
  const { login } = useAuth();

  // 프로필 이미지 선택
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('알림', '갤러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
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

  // 선호 식단 toggle
  const toggleAgeGroup = (id) => {
    setDietGroup((prev) => {
    if (prev.includes(id)) {
      // 이미 선택 → 해제
      return prev.filter((v) => v !== id);
    } else {
      // 미선택 → 추가
      return [...prev, id];
    }
    });
  };

  // 회원가입 처리
  const handleRegister = () => {
    // 필수 입력 검증
    if (!profileImage) {
        Alert.alert('알림', '프로필 사진을 선택해주세요.');
        return;
    }

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

    if (dietGroup.length === 0) {
      Alert.alert('알림', '선호 식습관을 최소 하나 이상 선택해주세요.');
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
      meal_group: dietGroup,
      marketing_agree: marketingAgree,
      push_agree: pushAgree,
    };

    registerMutation.mutate(registerData, {
      onSuccess: async (response) => {
        console.log('Register Response:', response.data);
        if (response.success) {
          // 회원가입 성공 후 자동으로 로그인
          try {
            const needsChildRegistration = response.data?.is_child_registered === false;

            // 자녀 등록 필요 여부를 저장
            await setNeedChildRegistration(needsChildRegistration);

            await login({ email, password });

            // 로그인 성공하면 App.tsx에서 자동으로 RegistChild로 이동
          } catch (error) {
            Alert.alert('회원가입 완료', '회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.', [
              {
                text: '확인',
                onPress: () => navigation.navigate('Login'),
              },
            ]);
          }
        }
      },
      onError: (error: any) => {
        Alert.alert(
          '회원가입 실패',
          error?.response?.data?.error || '회원가입에 실패했습니다.'
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

          {/* 선호하는 식습관 */}
          <View style={styles.section}>
              <Text style={styles.label}>
                선호 식습관 <Text style={styles.required}>*</Text>
              </Text>
              {mealGroupsLoading ? (
                <ActivityIndicator color="#FF9AA2" />
              ) : (
                <View style={styles.ageGroupContainer}>
                  {mealGroups?.map((group) => {
                    const isChecked = dietGroup.includes(group.id);

                    return (
                    <TouchableOpacity
                        key={group.id}
                        style={[
                            styles.ageGroupButton,
                            isChecked && styles.ageGroupButtonActive,
                        ]}
                        onPress={() => toggleAgeGroup(group.id)}
                    >
                        <Text
                            style={[
                                styles.ageGroupButtonText,
                                isChecked && styles.ageGroupButtonTextActive,
                            ]}
                        >
                            {group.value}
                        </Text>
                    </TouchableOpacity>
                    );
                  })}
                </View>
              )}
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
