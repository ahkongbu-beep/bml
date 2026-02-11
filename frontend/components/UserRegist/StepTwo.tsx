import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useAllergyCategories } from '../../libs/hooks/useCategories';

interface AllergyItem {
  allergy_code: string;
  allergy_name: string;
}

interface ChildData {
  childName: string;
  childBirth: Date;
  childGender: 'M' | 'W' | '';
  allergies: AllergyItem[];
}

interface StepTwoProps {
  childrenData: ChildData[];
  onChildrenDataChange: (data: ChildData[]) => void;
  onNext: () => void;
  onBack: () => void;
  nextButtonText?: string;
  backButtonText?: string;
  isLoading?: boolean;
}

export default function StepTwo({
  childrenData,
  onChildrenDataChange,
  onNext,
  onBack,
  nextButtonText = '다음',
  backButtonText = '이전',
  isLoading = false,
}: StepTwoProps) {
  const [numberOfChildren, setNumberOfChildren] = useState(childrenData.length || 1);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { data: allergyCategories } = useAllergyCategories();

  // 자녀 수 변경 시 데이터 초기화
  const handleNumberOfChildrenChange = (count: number) => {
    setNumberOfChildren(count);
    const newChildrenData: ChildData[] = [];

    for (let i = 0; i < count; i++) {
      if (childrenData[i]) {
        newChildrenData.push(childrenData[i]);
      } else {
        newChildrenData.push({
          childName: '',
          childBirth: new Date(),
          childGender: '',
          allergies: [],
        });
      }
    }

    onChildrenDataChange(newChildrenData);
    if (selectedChildIndex >= count) {
      setSelectedChildIndex(0);
    }
  };

  // 현재 선택된 자녀 데이터
  const currentChild = childrenData[selectedChildIndex] || {
    childName: '',
    childBirth: new Date(),
    childGender: '' as '',
    allergies: [],
  };

  // 자녀 데이터 업데이트 헬퍼
  const updateCurrentChild = (updates: Partial<ChildData>) => {
    const newData = [...childrenData];
    // currentChild 대신 childrenData에서 직접 가져와서 최신 상태 반영
    const current = newData[selectedChildIndex] || {
      childName: '',
      childBirth: new Date(),
      childGender: '' as '',
      allergies: [],
    };
    newData[selectedChildIndex] = { ...current, ...updates };
    onChildrenDataChange(newData);
  };

  const toggleAllergy = (allergyCode: string, allergyName: string) => {
    const isSelected = currentChild.allergies.some(a => a.allergy_code === allergyCode);

    if (isSelected) {
      // 이미 선택된 경우 제거
      const updated = currentChild.allergies.filter(a => a.allergy_code !== allergyCode);
      updateCurrentChild({ allergies: updated });
    } else {
      // 선택되지 않은 경우 추가 (최대 5개)
      if (currentChild.allergies.length >= 5) {
        Alert.alert('알림', '알레르기는 최대 5개까지 선택 가능합니다.');
        return;
      }

      const newAllergy: AllergyItem = {
        allergy_code: allergyCode,
        allergy_name: allergyName,
      };

      updateCurrentChild({ allergies: [...currentChild.allergies, newAllergy] });
    }
  };

  const isAllergySelected = (allergyCode: string) => {
    return currentChild.allergies.some(a => a.allergy_code === allergyCode);
  };

  // 알레르기 이모지 매핑
  const getAllergyEmoji = (allergyName: string) => {
    const emojiMap: { [key: string]: string } = {
      '우유': '🥛',
      '달걀': '🥚',
      '계란': '🥚',
      '땅콩': '🥜',
      '게': '🦀',
      '새우': '🦐',
      '생선': '🐟',
      '고등어': '🐟',
      '조개': '🦪',
      '밀': '🌾',
      '밀가루': '🌾',
      '메밀': '🌾',
      '대두': '🫘',
      '콩': '🫘',
      '복숭아': '🍑',
      '토마토': '🍅',
      '돼지고기': '🥓',
      '소고기': '🥩',
      '닭고기': '🍗',
      '오징어': '🦑',
      '고추': '🌶️',
      '브로콜리': '🥦',
      '당근': '🥕',
      '옥수수': '🌽',
    };
    return emojiMap[allergyName] || '🍽️';
  };

  const canProceed = () => {
    // 모든 자녀의 필수 정보가 입력되었는지 확인
    return childrenData.every(child =>
      child.childName.trim().length > 0 && child.childGender !== ''
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* 자녀 수 선택 */}
        <Text style={styles.label}>자녀 수</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={numberOfChildren}
            onValueChange={(value) => handleNumberOfChildrenChange(value)}
            style={styles.picker}
          >
            <Picker.Item label="1명" value={1} />
            <Picker.Item label="2명" value={2} />
            <Picker.Item label="3명" value={3} />
            <Picker.Item label="4명" value={4} />
          </Picker>
        </View>

        {/* 대표 자녀 선택 (메인 프로필) */}
        <View style={styles.mainProfileContainer}>
          <Text style={styles.mainProfileLabel}>대표 자녀 선택 (메인 프로필)</Text>
          <View style={styles.mainProfileButtons}>
            {Array.from({ length: numberOfChildren }, (_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.mainProfileButton,
                  selectedChildIndex === index && styles.mainProfileButtonActive,
                ]}
                onPress={() => setSelectedChildIndex(index)}
              >
                <Text
                  style={[
                    styles.mainProfileButtonText,
                    selectedChildIndex === index && styles.mainProfileButtonTextActive,
                  ]}
                >
                  자녀 {index + 1}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>자녀 이름 또는 별명</Text>

        {/* 자녀 별명 */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="예: 은서, 흥이"
            value={currentChild.childName}
            onChangeText={(text) => updateCurrentChild({ childName: text })}
          />
        </View>

        {/* 성별 */}
        <Text style={styles.label}>성별</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              currentChild.childGender === 'M' && styles.genderButtonActive,
            ]}
            onPress={() => updateCurrentChild({ childGender: 'M' })}
          >
            <Text style={styles.genderEmoji}>👦</Text>
            <Text
              style={[
                styles.genderText,
                currentChild.childGender === 'M' && styles.genderTextActive,
              ]}
            >
              남아
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderButton,
              currentChild.childGender === 'W' && styles.genderButtonActive,
            ]}
            onPress={() => updateCurrentChild({ childGender: 'W' })}
          >
            <Text style={styles.genderEmoji}>👧</Text>
            <Text
              style={[
                styles.genderText,
                currentChild.childGender === 'W' && styles.genderTextActive,
              ]}
            >
              여아
            </Text>
          </TouchableOpacity>
        </View>

        {/* 생년월일 */}
        <Text style={styles.label}>생년월일</Text>
        <TouchableOpacity
          style={styles.dateInputContainer}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {currentChild.childBirth.getFullYear()}-
            {String(currentChild.childBirth.getMonth() + 1).padStart(2, '0')}-
            {String(currentChild.childBirth.getDate()).padStart(2, '0')}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#999" />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={currentChild.childBirth}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                updateCurrentChild({ childBirth: selectedDate });
              }
            }}
            maximumDate={new Date()}
          />
        )}

        {/* 알레르기 정보 */}
        <Text style={styles.label}>알레르기 정보 (최대 5개)</Text>

        {/* 알레르기 그리드 버튼 */}
        <View style={styles.allergyGrid}>
          {allergyCategories?.map((allergy) => (
            <TouchableOpacity
              key={allergy.food_code}
              style={[
                styles.allergyButton,
                isAllergySelected(allergy.food_code) && styles.allergyButtonSelected,
              ]}
              onPress={() => toggleAllergy(allergy.food_code, allergy.food_name)}
            >
              <Text style={styles.allergyEmoji}>{getAllergyEmoji(allergy.food_name)}</Text>
              <Text
                style={[
                  styles.allergyButtonText,
                  isAllergySelected(allergy.food_code) && styles.allergyButtonTextSelected,
                ]}
              >
                {allergy.food_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 선택된 알레르기 표시 */}
        {currentChild.allergies.length > 0 && (
          <View style={styles.selectedAllergiesContainer}>
            <Text style={styles.selectedAllergiesLabel}>
              선택된 알레르기 ({currentChild.allergies.length}/5)
            </Text>
            <View style={styles.allergyList}>
              {currentChild.allergies.map((allergy, index) => (
                <View key={index} style={styles.allergyChip}>
                  <Text style={styles.allergyChipText}>{allergy.allergy_name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* 버튼 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>{backButtonText}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, (!canProceed() || isLoading) && styles.nextButtonDisabled]}
          onPress={onNext}
          disabled={!canProceed() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.nextButtonText}>{nextButtonText}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  pickerContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  picker: {
    height: 50,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#FFF',
    borderColor: '#FF8C00',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#FF8C00',
  },
  mainProfileContainer: {
    backgroundColor: '#FFF4E6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  mainProfileLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  mainProfileButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  mainProfileButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  mainProfileButtonActive: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  mainProfileButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  mainProfileButtonTextActive: {
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
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
    backgroundColor: '#FFF',
    borderRadius: 8,
    height: 60,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  genderButtonActive: {
    backgroundColor: '#FFF',
    borderColor: '#FF8C00',
    borderWidth: 2,
  },
  genderEmoji: {
    fontSize: 24,
  },
  genderText: {
    fontSize: 16,
    color: '#999',
  },
  genderTextActive: {
    color: '#FF8C00',
    fontWeight: '600',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  allergyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  allergyButton: {
    width: '18%',
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 4,
  },
  allergyButtonSelected: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  allergyEmoji: {
    fontSize: 24,
  },
  allergyButtonText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  allergyButtonTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  selectedAllergiesContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedAllergiesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  allergyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FF8C00',
  },
  allergyChipText: {
    fontSize: 13,
    color: '#FF8C00',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#FF8C00',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
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
