import React, { useState, useEffect } from 'react';
import styles from './EditProfileScreen.styles';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from '../components/Header';
import Layout from '../components/Layout';
import { useAuth } from '../libs/contexts/AuthContext';
import { useAgeGroups, useCategoryCodes } from '../libs/hooks/useCategories';
import { getStaticImage } from '../libs/utils/common';

export default function EditProfileScreen({ navigation }: any) {
  const { user, isLoading, updateProfile, updateProfileLoading } = useAuth();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [profileImage, setProfileImage] = useState('https://via.placeholder.com/100');
  const [childBirth, setChildBirth] = useState('');
  const [childGender, setChildGender] = useState<'M' | 'W' | ''>('');
  const [childAgeGroup, setChildAgeGroup] = useState<number>(0);
  const [dietGroup, setDietGroup] = useState<number[]>([]);
  const [marketingAgree, setMarketingAgree] = useState(false);
  const [pushAgree, setPushAgree] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Hooks
  const { data: ageGroups, isLoading: ageGroupsLoading } = useAgeGroups();
  const { data: mealGroups, isLoading: mealGroupsLoading } = useCategoryCodes("MEALS_GROUP");

  // user 데이터가 로드되면 state 업데이트
  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setEmail(user.email || '');
      setDescription(user.description || '');
      setProfileImage(user.profile_image || '');
      setDietGroup(user.meal_group || []);
      setMarketingAgree(!!user.marketing_agree);
      setPushAgree(!!user.push_agree);
    }
  }, [user]);

  const handleSave = () => {
    if (!nickname.trim()) {
      Alert.alert('알림', '닉네임을 입력해주세요.');
      return;
    }

    if (!user?.view_hash) {
      Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
      return;
    }

    updateProfile(
      {
        nickname,
        email,
        description,
        child_birth: childBirth,
        child_gender: childGender || undefined,
        marketing_agree: marketingAgree,
        push_agree: pushAgree,
        profile_image: profileImage,
      },
      {
        onSuccess: () => {
          Alert.alert('성공', '프로필이 수정되었습니다.', [
            {
              text: '확인',
              onPress: () => navigation.navigate('EditProfile', { refresh: true })
            },
          ]);
        },
        onError: (error: any) => {
          Alert.alert('오류', error?.message || '프로필 수정 중 오류가 발생했습니다.');
        },
      }
    );
  };

  const handleImageChange = async () => {
    // 권한 요청
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('권한 필요', '사진첩 접근 권한이 필요합니다.');
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

  const handleDatePress = () => {
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
      setChildBirth(formattedDate);
    }
  };

  const closeDatePicker = () => {
    setShowDatePicker(false);
  };

  // 선호 식단 toggle
  const toggleDietGroup = (id: number) => {
    setDietGroup((prev) => {
      if (prev.includes(id)) {
        return prev.filter((v) => v !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  return (
    <Layout>
      <View style={styles.container}>
        <Header
          title="프로필 수정"
          showBack={true}
          onBackPress={() => navigation.goBack()}
        />
        <ScrollView style={styles.content}>
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
          </View>
        </ScrollView>

        {/* 저장 버튼 */}
        <View style={styles.footer}>
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
      </View>
    </Layout>
  );
}