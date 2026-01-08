import React, { useState, useEffect } from 'react';
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

  console.log("mealGroups", mealGroups);
  console.log("user", user);

  // user 데이터가 로드되면 state 업데이트
  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setEmail(user.email || '');
      setDescription(user.description || '');
      setProfileImage(user.profile_image || 'https://via.placeholder.com/100');
      setChildBirth(user.child_birth || '');
      setChildGender(user.child_gender || '');
      setChildAgeGroup(user.child_age_group || 0);
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
        view_hash: user.view_hash,
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
              source={{ uri: profileImage }}
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

          {/* 자녀 정보 */}
          <View style={styles.childSection}>
            <Text style={styles.sectionTitle}>자녀 정보</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>자녀 생년월일</Text>
              <TouchableOpacity style={styles.dateInput} onPress={handleDatePress}>
                <Text style={[styles.dateText, !childBirth && styles.placeholderText]}>
                  {childBirth || '생년월일을 선택하세요'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#999" />
              </TouchableOpacity>
              {showDatePicker && (
                <>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    maximumDate={new Date()}
                    locale="ko-KR"
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={styles.datePickerCloseButton}
                      onPress={closeDatePicker}
                    >
                      <Text style={styles.datePickerCloseText}>완료</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>자녀 성별</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[styles.genderButton, childGender === 'M' && styles.genderButtonActive]}
                  onPress={() => setChildGender('M')}
                >
                  <Text style={[styles.genderText, childGender === 'M' && styles.genderTextActive]}>
                    남아
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderButton, childGender === 'W' && styles.genderButtonActive]}
                  onPress={() => setChildGender('W')}
                >
                  <Text style={[styles.genderText, childGender === 'W' && styles.genderTextActive]}>여아</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>자녀 연령대</Text>
              {ageGroupsLoading ? (
                <ActivityIndicator color="#FF6B6B" />
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>선호 식습관</Text>
              {mealGroupsLoading ? (
                <ActivityIndicator color="#FF6B6B" />
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
                        onPress={() => toggleDietGroup(group.id)}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  content: {
    flex: 1,
  },
  imageSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  textOnly: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
    paddingLeft: 10,
  },
  imageChangeButton: {
    position: 'absolute',
    bottom: 30,
    right: '50%',
    marginRight: -60,
    backgroundColor: '#FF6B6B',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  formSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  childSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  genderText: {
    fontSize: 16,
    color: '#666',
  },
  genderTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  ageGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ageGroupButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  ageGroupButtonActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  ageGroupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  ageGroupButtonTextActive: {
    color: '#fff',
  },
  settingsSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B6B',
    padding: 2,
    justifyContent: 'center',
  },
  switchInactive: {
    backgroundColor: '#e0e0e0',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  placeholderText: {
    color: '#999',
  },
  datePickerCloseButton: {
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  datePickerCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#FF6B6B',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#FFB6B6',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
