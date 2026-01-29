// 회원가입페이지 (자녀정보등록)
// frontend/screens/RegistChildScreen.tsx
/*
 * 입력정보
 - childName : string : 자녀명(닉네임)
 - childBirth : date : 자녀생년월일(YYYYMMDD)
 - childGender : 'M' | 'F' : 자녀성별
 - isAgent : 'Y' | 'N' : 대표자녀여부 (1명만 Y 가능)

 childBirth 를 입력하면 만 나이 계산하여 view 에만 노출
 RegistScreen 이 등록 성공하면 자녀정보 등록 페이지를 보여줄 예정
 */
import React, { useState } from 'react';
import styles from './RegistChildScreen.styles';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../libs/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { registerChildren, deleteChildren } from '../libs/hooks/useUsers';
import { calculateAge } from '../libs/utils/common';

interface ChildInfo {
  id?: number;
  childName: string;
  childBirth: string; // YYYYMMDD
  childGender: 'M' | 'F';
  isAgent: 'Y' | 'N';
}

export default function RegistChildScreen({ navigation, route }: any) {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  // user_childs가 있을 경우 초기값으로 세팅
  const initialChildren = user?.user_childs
    ? user.user_childs.map((child: any) => ({
        id: child.id,
        childName: child.child_name,
        childBirth: child.child_birth.replace(/-/g, ''), // YYYY-MM-DD -> YYYYMMDD
        childGender: child.child_gender as 'M' | 'F',
        isAgent: child.is_agent as 'Y' | 'N',
      }))
    : [];

  const [children, setChildren] = useState<ChildInfo[]>(initialChildren);
  const [childName, setChildName] = useState('');
  const [childBirth, setChildBirth] = useState('');
  const [childGender, setChildGender] = useState<'M' | 'F'>('M');
  const [isAgent, setIsAgent] = useState<'Y' | 'N'>('Y');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(initialChildren.length === 0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  /*
    {"address": "서울시시 강남구", "created_at": "2025-12-02T17:41:35", "deleted_at": null, "description": "안녕하세요, 우리 아이와 함께 하는 BML입니다.1", "email": "ahkongbu@naver.com", "feed_count": 13, "is_active": 1, "last_login_at": "2026-01-26T10:14:36", "like_count": 7, "marketing_agree": 1, "meal_count": 5, "meal_group": [], "name": "임영민", "nickname": "이웃집로또로", "phone": "01011112222", "profile_image": "/attaches/users/4/20260126101510_986d9002", "push_agree": 1, "role": "USER", "sns_id": "ahkongbu", "sns_login_type": "EMAIL", "updated_at": "2026-01-26T14:45:47", "user_childs": [{"child_birth": "1992-08-20", "child_gender": "M", "child_name": "홍길동4", "id": 7, "is_agent": "Y"}], "view_hash": "804c604f8d4f12f1fe51a43e65450ed40813c533ff6c06483d6e838c1c9bce76"}
   */

  // 생년월일 입력 포맷팅 (YYYYMMDD)
  const handleBirthChange = (text: string) => {
    const numbers = text.replace(/[^0-9]/g, '');
    if (numbers.length <= 8) {
      setChildBirth(numbers);
    }
  };

  // 자녀 추가
  const handleAddChild = () => {
    if (!childName.trim()) {
      Alert.alert('알림', '자녀 이름을 입력해주세요.');
      return;
    }

    if (childBirth.length !== 8) {
      Alert.alert('알림', '생년월일을 8자리로 입력해주세요. (예: 20200101)');
      return;
    }

    // 생년월일 유효성 검사
    const year = parseInt(childBirth.substring(0, 4));
    const month = parseInt(childBirth.substring(4, 6));
    const day = parseInt(childBirth.substring(6, 8));

    if (year < 1900 || year > new Date().getFullYear()) {
      Alert.alert('알림', '올바른 연도를 입력해주세요.');
      return;
    }

    if (month < 1 || month > 12) {
      Alert.alert('알림', '올바른 월을 입력해주세요.');
      return;
    }

    if (day < 1 || day > 31) {
      Alert.alert('알림', '올바른 일을 입력해주세요.');
      return;
    }

    // 대표자녀가 이미 있는 경우, 새로운 자녀는 자동으로 N
    const hasAgent = children.some(child => child.isAgent === 'Y');
    const newIsAgent = hasAgent ? 'N' : isAgent;

    const newChild: ChildInfo = {
      childName: childName.trim(),
      childBirth: childBirth,
      childGender: childGender,
      isAgent: newIsAgent,
    };

    setChildren([...children, newChild]);

    // 입력 필드 초기화
    setChildName('');
    setChildBirth('');
    setChildGender('M');
    setIsAgent('N'); // 두 번째부터는 자동으로 N
    setIsEditing(false);

    Alert.alert('완료', '자녀 정보가 추가되었습니다.');
  };

  // 자녀 수정 시작
  const handleEditChild = (index: number) => {
    const child = children[index];
    setChildName(child.childName);
    setChildBirth(child.childBirth);
    setChildGender(child.childGender);
    setIsAgent(child.isAgent);
    setEditingIndex(index);
    setIsEditing(true);
  };

  // 자녀 수정 완료
  const handleUpdateChild = () => {
    if (editingIndex === null) return;

    if (!childName.trim()) {
      Alert.alert('알림', '자녀 이름을 입력해주세요.');
      return;
    }

    if (childBirth.length !== 8) {
      Alert.alert('알림', '생년월일을 8자리로 입력해주세요. (예: 20200101)');
      return;
    }

    // 생년월일 유효성 검사
    const year = parseInt(childBirth.substring(0, 4));
    const month = parseInt(childBirth.substring(4, 6));
    const day = parseInt(childBirth.substring(6, 8));

    if (year < 1900 || year > new Date().getFullYear()) {
      Alert.alert('알림', '올바른 연도를 입력해주세요.');
      return;
    }

    if (month < 1 || month > 12) {
      Alert.alert('알림', '올바른 월을 입력해주세요.');
      return;
    }

    if (day < 1 || day > 31) {
      Alert.alert('알림', '올바른 일을 입력해주세요.');
      return;
    }

    // 대표자녀 변경 확인
    const currentChild = children[editingIndex];
    const wasAgent = currentChild.isAgent === 'Y';
    const willBeAgent = isAgent === 'Y';

    if (!wasAgent && willBeAgent) {
      // 다른 대표자녀가 있는지 확인
      const hasOtherAgent = children.some((child, idx) => idx !== editingIndex && child.isAgent === 'Y');
      if (hasOtherAgent) {
        // 기존 대표자녀를 일반으로 변경
        const updatedChildren = children.map((child, idx) => {
          if (idx === editingIndex) {
            return {
              id: child.id,
              childName: childName.trim(),
              childBirth: childBirth,
              childGender: childGender,
              isAgent: 'Y' as 'Y' | 'N',
            };
          } else if (child.isAgent === 'Y') {
            return { ...child, isAgent: 'N' as 'Y' | 'N' };
          }
          return child;
        });
        setChildren(updatedChildren);
      } else {
        // 대표자녀가 없으면 그냥 업데이트
        const updatedChildren = [...children];
        updatedChildren[editingIndex] = {
          id: children[editingIndex].id,
          childName: childName.trim(),
          childBirth: childBirth,
          childGender: childGender,
          isAgent: isAgent,
        };
        setChildren(updatedChildren);
      }
    } else if (wasAgent && !willBeAgent && children.length > 1) {
      Alert.alert('알림', '대표자녀는 최소 1명이 필요합니다.');
      return;
    } else {
      // 일반적인 수정
      const updatedChildren = [...children];
      updatedChildren[editingIndex] = {
        id: children[editingIndex].id,
        childName: childName.trim(),
        childBirth: childBirth,
        childGender: childGender,
        isAgent: isAgent,
      };
      setChildren(updatedChildren);
    }

    // 입력 필드 초기화
    setChildName('');
    setChildBirth('');
    setChildGender('M');
    setIsAgent('N');
    setEditingIndex(null);
    setIsEditing(false);

    Alert.alert('완료', '자녀 정보가 수정되었습니다.');
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setChildName('');
    setChildBirth('');
    setChildGender('M');
    setIsAgent('N');
    setEditingIndex(null);
    setIsEditing(false);
  };

  // 자녀 삭제
  const handleDeleteChild = (index: number) => {
    Alert.alert(
      '삭제 확인',
      '이 자녀 정보를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            const childToDelete = children[index];

            // DB에 저장된 자녀인 경우 삭제 API 호출
            if (childToDelete.id) {
              try {
                const result = await deleteChildren(childToDelete.id);
                // 사용자 정보 갱신
                await refreshUser();
                if (!result.success) {
                    Alert.alert('오류', result.error || '자녀 정보 삭제에 실패했습니다.');
                    return
                }

                Alert.alert('완료', result.message || '자녀 정보가 삭제되었습니다.');
                const newChildren = children.filter((_, i) => i !== index);

                // 대표자녀를 삭제한 경우, 첫 번째 자녀를 대표로 설정
                if (childToDelete.isAgent === 'Y' && newChildren.length > 0) {
                newChildren[0].isAgent = 'Y';
                }

                setChildren(newChildren);

              } catch (error) {
                console.error('Failed to delete child:', error);
                Alert.alert('오류', '자녀 정보 삭제에 실패했습니다.');
                return;
              }
            }
          },
        },
      ]
    );
  };

  // 나중에 등록하기 (건너뛰기)
  const handleSkip = () => {
    Alert.alert(
      '확인',
      '자녀 정보는 마이페이지에서 등록할 수 있습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => navigation.navigate('Login'),
        },
      ]
    );
  };

  // 등록 완료
  const handleSubmit = async () => {
    if (children.length === 0) {
      Alert.alert('알림', '최소 1명 이상의 자녀 정보를 등록해주세요.\n나중에 등록하려면 "나중에 등록하기"를 선택해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // API 형식에 맞게 데이터 변환
      const childrenData = children.map(child => {
        // YYYYMMDD -> YYYY-MM-DD 변환
        const year = child.childBirth.substring(0, 4);
        const month = child.childBirth.substring(4, 6);
        const day = child.childBirth.substring(6, 8);
        const formattedBirth = `${year}-${month}-${day}`;

        return {
          child_id: child.id,
          child_name: child.childName,
          child_birth: formattedBirth,
          child_gender: child.childGender,
          is_agent: child.isAgent,
        };
      });

      console.log("childrenData", childrenData);

      const result = await registerChildren(childrenData);
      if (!result.success) {
        throw new Error(result.message || '자녀 정보 등록에 실패했습니다.');
      }

      // 사용자 정보 갱신하여 user_childs 업데이트
      await refreshUser();

      setIsLoading(false);

      Alert.alert(
        '완료',
        '자녀 정보가 등록되었습니다!',
        [
          {
            text: '확인',
            onPress: () => navigation.navigate('Tabs', { screen: 'MyPage' }),
          },
        ]
      );
    } catch (error: any) {
      setIsLoading(false);
      console.log("error", error?.message);
      Alert.alert('오류', error?.message || '자녀 정보 등록 중 오류가 발생했습니다.');
    }
  };

  // 생년월일 포맷 표시 (YYYYMMDD -> YYYY년 MM월 DD일)
  const formatBirthDisplay = (birth: string): string => {
    if (birth.length !== 8) return birth;
    return `${birth.substring(0, 4)}년 ${birth.substring(4, 6)}월 ${birth.substring(6, 8)}일`;
  };

  return (
    <Layout>
      <Header
        title="자녀 정보 등록"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            {/* 헤더 섹션 */}
            <View style={styles.headerSection}>
              <View style={styles.headerIcon}>
                <Ionicons name="people" size={40} color="#FF9AA2" />
              </View>
              <Text style={styles.headerTitle}>자녀 정보를 등록해주세요</Text>
              <Text style={styles.headerSubtitle}>
                자녀의 연령에 맞는 맞춤 레시피를{'\n'}
                추천해드립니다.
              </Text>
            </View>

            {/* 안내 정보 */}
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Ionicons name="information-circle" size={16} color="#FF9AA2" />
                <Text style={styles.infoText}>
                  대표자녀는 1명만 선택 가능합니다.
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="information-circle" size={16} color="#FF9AA2" />
                <Text style={styles.infoText}>
                  자녀 정보는 나중에 마이페이지에서 수정할 수 있습니다.
                </Text>
              </View>
            </View>

            {/* 등록된 자녀 목록 */}
            {children.length > 0 && (

              <View style={styles.childListContainer}>
                <Text style={styles.sectionTitle}>등록된 자녀 ({children.length}명)</Text>
                {children.map((child, index) => (
                  <View key={index} style={styles.childCard}>
                    <View style={styles.childInfo}>
                      <Text style={styles.childName}>{child.childName}</Text>
                      <Text style={styles.childDetails}>
                        {formatBirthDisplay(child.childBirth)} · 만 {calculateAge(child.childBirth)}세
                      </Text>
                      <Text style={styles.childDetails}>
                        {child.childGender === 'M' ? '남아' : '여아'}
                      </Text>
                      {child.isAgent === 'Y' && (
                        <View style={styles.agentBadge}>
                          <Text style={styles.agentBadgeText}>대표자녀</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditChild(index)}
                      >
                        <Ionicons name="pencil-outline" size={24} color="#4A90E2" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteChild(index)}
                      >
                        <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 자녀 정보 입력 폼 */}
            {(children.length === 0 || isEditing) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {editingIndex !== null ? '자녀 정보 수정' : children.length === 0 ? '자녀 정보 입력' : '추가 자녀 정보 입력'}
                </Text>

                {/* 자녀 이름 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    이름 (닉네임) <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="자녀 이름을 입력해주세요"
                    placeholderTextColor="#B0B0B0"
                    value={childName}
                    onChangeText={setChildName}
                  />
                </View>

                {/* 생년월일 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    생년월일 <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYYMMDD (예: 20200101)"
                    placeholderTextColor="#B0B0B0"
                    value={childBirth}
                    onChangeText={handleBirthChange}
                    keyboardType="number-pad"
                    maxLength={8}
                  />
                  <Text style={styles.inputDescription}>
                    생년월일 8자리를 입력해주세요 (예: 20200101)
                  </Text>

                  {/* 만 나이 표시 */}
                  {childBirth.length === 8 && (
                    <View style={styles.ageDisplay}>
                      <Text style={styles.ageText}>
                        만 {calculateAge(childBirth)}세
                      </Text>
                    </View>
                  )}
                </View>

                {/* 성별 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    성별 <Text style={styles.required}>*</Text>
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
                        color={childGender === 'M' ? '#FF9AA2' : '#B0B0B0'}
                      />
                      <Text
                        style={[
                          styles.genderText,
                          childGender === 'M' && styles.genderTextActive,
                        ]}
                      >
                        남아
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        childGender === 'F' && styles.genderButtonActive,
                      ]}
                      onPress={() => setChildGender('F')}
                    >
                      <Ionicons
                        name="female"
                        size={20}
                        color={childGender === 'F' ? '#FF9AA2' : '#B0B0B0'}
                      />
                      <Text
                        style={[
                          styles.genderText,
                          childGender === 'F' && styles.genderTextActive,
                        ]}
                      >
                        여아
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 대표자녀 여부 */}
                {(children.length === 0 || editingIndex !== null) && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>대표자녀</Text>
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => setIsAgent(isAgent === 'Y' ? 'N' : 'Y')}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          isAgent === 'Y' && styles.checkboxActive,
                        ]}
                      >
                        {isAgent === 'Y' && (
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        )}
                      </View>
                      <Text style={styles.checkboxLabel}>
                        이 자녀를 대표자녀로 설정
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.inputDescription}>
                      대표자녀 기준으로 맞춤 추천이 제공됩니다.
                    </Text>
                  </View>
                )}

                {/* 추가/수정 버튼 */}
                {editingIndex !== null ? (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.button, styles.skipButton, { flex: 1 }]}
                      onPress={handleCancelEdit}
                    >
                      <Text style={[styles.buttonText, styles.skipButtonText]}>
                        취소
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.submitButton, { flex: 1 }]}
                      onPress={handleUpdateChild}
                    >
                      <Text style={[styles.buttonText, styles.submitButtonText]}>
                        수정 완료
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.button, styles.submitButton]}
                    onPress={handleAddChild}
                  >
                    <Text style={[styles.buttonText, styles.submitButtonText]}>
                      자녀 추가
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* 추가 등록 버튼 */}
            {children.length > 0 && !isEditing && (
              <TouchableOpacity
                style={styles.addAnotherButton}
                onPress={() => setIsEditing(true)}
              >
                <Ionicons name="add-circle-outline" size={24} color="#FF9AA2" />
                <Text style={styles.addAnotherButtonText}>추가로 등록하기</Text>
              </TouchableOpacity>
            )}

            {/* 하단 버튼 */}
            {children.length > 0 && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.skipButton]}
                  onPress={handleSkip}
                >
                  <Text style={[styles.buttonText, styles.skipButtonText]}>
                    나중에 등록하기
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.submitButton,
                    isLoading && styles.disabledButton,
                  ]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.buttonText, styles.submitButtonText]}>
                      등록 완료
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* 처음에 나중에 등록하기 버튼 */}
            {children.length === 0 && (
              <TouchableOpacity
                style={[styles.button, styles.skipButton, { marginTop: 12 }]}
                onPress={handleSkip}
              >
                <Text style={[styles.buttonText, styles.skipButtonText]}>
                  나중에 등록하기
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
}

