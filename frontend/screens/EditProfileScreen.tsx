import React, { useState, useEffect } from 'react';
import styles from '../styles/screens/EditProfileScreen.styles';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import Layout from '../components/Layout';
import BlurScreen from '@/components/BlurScreen';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import PasswordChangeModal from '../components/PasswordChangeModal';

import { getMessaging, hasPermission, AuthorizationStatus } from '@react-native-firebase/messaging';
import { useAuth } from '../libs/contexts/AuthContext';
import { useChangePassword } from '../libs/hooks/useUsers';
import { getStaticImage } from '../libs/utils/common';
import { toastInfo, toastSuccess, toastError } from '../libs/utils/toast';

export default function EditProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, isLoading, updateProfile, updateProfileLoading, refreshUser } = useAuth();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [profileImage, setProfileImage] = useState('https://via.placeholder.com/100');
  const [marketingAgree, setMarketingAgree] = useState(false);
  const [pushAgree, setPushAgree] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [passwordChangeModalVisible, setPasswordChangeModalVisible] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<boolean>(true);
  const changePasswordMutation = useChangePassword();

  // 알림 권한 상태 확인
  useEffect(() => {
    const checkPermission = async () => {
      const status = await hasPermission(getMessaging());
      setNotificationPermission(
        status === AuthorizationStatus.AUTHORIZED ||
        status === AuthorizationStatus.PROVISIONAL
      );
    };
    checkPermission();
  }, []);

  // user 데이터가 로드되면 state 업데이트
  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setEmail(user.email || '');
      setDescription(user.description || '');
      setProfileImage(user.profile_image || '');
      setMarketingAgree(!!user.marketing_agree);
      setPushAgree(!!user.push_agree);
    }
  }, [user]);

  const handleSave = () => {
    if (!nickname.trim()) {
      toastError('닉네임을 입력해주세요.');
      return;
    }

    if (!user?.view_hash) {
      toastError('사용자 정보를 찾을수 없습니다.');
      return;
    }

    updateProfile(
      {
        nickname,
        email,
        description,
        marketing_agree: marketingAgree,
        push_agree: pushAgree,
        profile_image: profileImage,
      },
      {
        onSuccess: async (response) => {
          if (response?.success) {
            toastSuccess('프로필이 수정되었습니다.', {
              onPress: async () => {
                await refreshUser();
                navigation.goBack();
              },
              onHide: async () => {
                await refreshUser();
                navigation.goBack();
              }
            });
          } else {
            toastError(response?.error || response?.message || '프로필 수정에 실패했습니다.');
          }
        },
        onError: (error: any) => {
          toastError(error?.message || '프로필 수정 중 오류가 발생했습니다.');
        },
      }
    );
  };

  const handlePasswordSave = (currentPassword: string, newPassword: string) => {
    changePasswordMutation.mutate({ current_password: currentPassword, new_password: newPassword }, {
      onSuccess: () => {
        toastSuccess('비밀번호가 변경되었습니다.');
        setPasswordChangeModalVisible(false);
      },
      onError: (error: any) => {
        toastError(error?.message || '비밀번호 변경 중 오류가 발생했습니다.');
      },
    });
  }


  const handleImageChange = async () => {
    // 권한 요청
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      toastError('사진첩 접근 권한이 필요합니다.');
      return;
    }

    // 이미지 선택
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

  const pushPermissionBannerStyle = {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#FFD6D6',
  } as const;

  const pushPermissionIconStyle = {
    backgroundColor: '#FFE5E9',
    padding: 8,
    borderRadius: 8,
  } as const;

  const pushPermissionTitleStyle = {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FF6B6B',
    marginBottom: 2,
  };

  const pushPermissionDescStyle = {
    fontSize: 12,
    color: '#FF9AA2',
    lineHeight: 16,
  };

  return (
    <Layout>
      <BlurScreen visible={updateProfileLoading} title="회원정보 수정중입니다." />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <Header
            title="프로필 수정"
            showBack={true}
            onBackPress={() => navigation.goBack()}
          />
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* 프로필 이미지 */}
          <View style={styles.imageSection}>
            <Image
              source={{ uri: getStaticImage('small', profileImage) || '' }}
              style={styles.profileImage}
            />
            <TouchableOpacity
              style={styles.imageChangeButton}
              onPress={handleImageChange}
            >
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* 입력 필드 */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>이메일</Text>
              <Text style={styles.textOnly}>{email}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>닉네임</Text>
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="닉네임을 입력하세요"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>소개</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="소개글을 입력하세요"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* 비밀번호 변경 버튼 */}
          <TouchableOpacity
            style={styles.changePasswordButton}
            onPress={() => setPasswordChangeModalVisible(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ backgroundColor: '#FFE5E9', padding: 8, borderRadius: 8 }}>
                <Ionicons name="lock-closed" size={20} color="#FF9AA2" />
              </View>
              <Text style={styles.changePasswordButtonText}>비밀번호 변경</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          {/* 알림 설정 */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>알림 설정</Text>
            <View style={styles.settingItem}>
              <Text style={styles.settingText}>마케팅 수신 동의</Text>
              <TouchableOpacity
                style={[styles.switch, !marketingAgree && styles.switchInactive]}
                onPress={() => setMarketingAgree(!marketingAgree)}
              >
                <View style={[styles.switchThumb, marketingAgree && styles.switchThumbActive]} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingText}>푸시 알림</Text>
              <TouchableOpacity
                style={[styles.switch, !pushAgree && styles.switchInactive]}
                onPress={() => setPushAgree(!pushAgree)}
              >
                <View style={[styles.switchThumb, pushAgree && styles.switchThumbActive]} />
              </TouchableOpacity>
            </View>

            {/* 알림 권한 꺼짐 배너 */}
            {!notificationPermission && (
              <TouchableOpacity
                style={pushPermissionBannerStyle}
                onPress={() => Linking.openSettings()}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={pushPermissionIconStyle}>
                    <Ionicons name="notifications-off" size={18} color="#FF6B6B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={pushPermissionTitleStyle}>알림 권한이 꺼져 있어요</Text>
                    <Text style={pushPermissionDescStyle}>휴대폰 설정에서 알림을 켜야 정상적으로 받을 수 있어요</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#FF6B6B" />
                </View>
              </TouchableOpacity>
            )}
          </View>

        </ScrollView>

          {/* 저장 버튼 */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity
              style={[styles.saveButton, updateProfileLoading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={updateProfileLoading}
            >
              {updateProfileLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>저장하기</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 비밀번호 변경 모달 */}
          <PasswordChangeModal
            visible={passwordChangeModalVisible}
            onClose={() => setPasswordChangeModalVisible(false)}
            onSubmit={async (currentPassword, newPassword) => {
              handlePasswordSave(currentPassword, newPassword);
            }}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Layout>
  );
}