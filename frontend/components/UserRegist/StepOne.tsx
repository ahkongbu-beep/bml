import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface StepOneProps {
  email: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
  profileImage: string | undefined;
  onEmailChange: (text: string) => void;
  onPasswordChange: (text: string) => void;
  onPasswordConfirmChange: (text: string) => void;
  onNicknameChange: (text: string) => void;
  onProfileImageChange: (uri: string | undefined) => void;
  onNext: () => void;
}

export default function StepOne({
  email,
  password,
  passwordConfirm,
  nickname,
  profileImage,
  onEmailChange,
  onPasswordChange,
  onPasswordConfirmChange,
  onNicknameChange,
  onProfileImageChange,
  onNext,
}: StepOneProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const pickImage = async () => {
    // 권한 요청
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
      return;
    }

    // 이미지 선택
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      onProfileImageChange(uri);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidNickname = (nickname: string) => {
    return nickname.trim().length >= 2;
  };

  const isValidPassword = (password: string) => {
    return password.length >= 6;
  };

  const canProceed = () => {
    return (
      isValidEmail(email) &&
      isValidPassword(password) &&
      isValidNickname(nickname) &&
      password === passwordConfirm &&
      passwordConfirm.length > 0
    );
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* 대표 프로필 이미지 */}
      <Text style={styles.title}>대표 프로필 이미지</Text>
      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera" size={32} color="#999" />
            <Text style={styles.imagePlaceholderText}>사진 선택</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={[styles.title, { marginTop: 24 }]}>이메일</Text>
      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#999" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="이메일을 입력하세요."
          value={email}
          onChangeText={onEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      {email.length > 0 && !isValidEmail(email) && (
        <Text style={styles.errorText}>올바른 이메일 형식이 아닙니다</Text>
      )}

      <Text style={[styles.title, { marginTop: 24 }]}>비밀번호</Text>
      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="비밀번호를 입력하세요."
          value={password}
          onChangeText={onPasswordChange}
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
            color="#999"
          />
        </TouchableOpacity>
      </View>
      {password.length > 0 && !isValidPassword(password) && (
        <Text style={styles.errorText}>비밀번호는 6자 이상이어야 합니다</Text>
      )}

      <Text style={[styles.title, { marginTop: 24 }]}>비밀번호 확인</Text>
      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="비밀번호를 입력하세요."
          value={passwordConfirm}
          onChangeText={onPasswordConfirmChange}
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
            color="#999"
          />
        </TouchableOpacity>
      </View>
      {passwordConfirm.length > 0 && password !== passwordConfirm && (
        <Text style={styles.errorText}>비밀번호가 일치하지 않습니다</Text>
      )}

      <Text style={[styles.title, { marginTop: 24 }]}>닉네임</Text>
      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color="#999" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="닉네임을 입력하세요."
          value={nickname}
          onChangeText={onNicknameChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      {nickname.length > 0 && !isValidNickname(nickname) && (
        <Text style={styles.errorText}>닉네임은 최소 2자 이상이어야 합니다</Text>
      )}

      <TouchableOpacity
        style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
        onPress={onNext}
        disabled={!canProceed()}
      >
        <Text style={styles.nextButtonText}>다음</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  imageContainer: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    marginLeft: 4,
  },
  nextButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  nextButtonDisabled: {
    backgroundColor: '#CCC',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
