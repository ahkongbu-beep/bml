import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import Layout from '@/components/Layout';
import { useAuth } from '../libs/contexts/AuthContext';
import { MEAL_CATEGORIES } from '../libs/utils/codes/MealCalendarCode';
import { useCategoryCodes } from '../libs/hooks/useCategories';
import { useCreateMeal } from '../libs/hooks/useMeals';

export default function MealRegistScreen({ route, navigation }: any) {
  const { selectedDate } = route.params || {};
  const { user } = useAuth();
  const { data: categoryCodes } = useCategoryCodes('MEALS_GROUP');
  const createMealMutation = useCreateMeal();
  const [title, setTitle] = useState('');
  const [contents, setContents] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    const cleanTag = tagInput.replace('#', '').trim();
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    console.log('handleSubmit 호출됨');
    console.log('title:', title);
    console.log('contents:', contents);
    console.log('selectedCategory:', selectedCategory);

    if (!title.trim()) {
      console.log('제목 없음');
      Alert.alert('알림', '제목을 입력해주세요.');
      return;
    }
    if (!contents.trim()) {
      console.log('내용 없음');
      Alert.alert('알림', '내용을 입력해주세요.');
      return;
    }
    if (!selectedCategory) {
      console.log('카테고리 선택 안됨');
      Alert.alert('알림', '식사 시간을 선택해주세요.');
      return;
    }

    const mealData = {
      user_hash: user?.view_hash || '',
      title: title.trim(),
      contents: contents.trim(),
      category_id: selectedCategory,
      input_date: selectedDate,
      tags: tags,
    };

    console.log('등록할 식단 데이터:', mealData);

    createMealMutation.mutate(mealData, {
      onSuccess: (response) => {
        let message = '식단이 등록되었습니다.';
        if (!response.success) {
          message = response.error || response.message ||'식단 등록에 실패했습니다.';
          Alert.alert('오류', message);
          return;
        }

        Alert.alert('성공', message, [{
            text: '확인',
            onPress: () => navigation.navigate('MealPlan'),
        }]);
      },
      onError: (error) => {
        console.error('식단 등록 오류:', error);
        Alert.alert('오류', '식단 등록에 실패했습니다.');
      },
    });
  };

  return (
    <Layout>
      <View style={styles.container}>
        <Header
          title="식단 추가"
          leftButton={{
            icon: 'arrow-back',
            onPress: () => navigation.goBack(),
          }}
          rightButton={{
            text: '완료',
            onPress: handleSubmit,
          }}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          {/* 날짜 표시 */}
          <View style={styles.dateSection}>
            <Ionicons name="calendar" size={20} color="#FF9AA2" />
            <Text style={styles.dateText}>
              {selectedDate ? selectedDate.replace(/-/g, '.') : '날짜 미선택'}
            </Text>
          </View>

          {/* 식사 시간 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>식사 시간 *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {categoryCodes?.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={styles.categoryIcon}>{MEAL_CATEGORIES.find(c => c.name === category.value)?.icon}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category.id && styles.categoryTextActive,
                    ]}
                  >
                    {category.value}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 제목 입력 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>제목 *</Text>
            <TextInput
              style={styles.input}
              placeholder="식단 제목을 입력하세요"
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />
            <Text style={styles.charCount}>{title.length}/50</Text>
          </View>

          {/* 내용 입력 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>내용 *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="먹은 음식이나 메뉴를 자세히 적어주세요"
              value={contents}
              onChangeText={setContents}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>{contents.length}/500</Text>
          </View>

          {/* 태그 입력 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>태그</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder="태그를 입력하세요 (예: 한식, 다이어트)"
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.tagAddButton} onPress={handleAddTag}>
                <Ionicons name="add" size={24} color="#FF9AA2" />
              </TouchableOpacity>
            </View>

            {/* 태그 목록 */}
            {tags.length > 0 && (
              <View style={styles.tagList}>
                {tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveTag(index)}
                      style={styles.tagRemoveButton}
                    >
                      <Ionicons name="close" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 저장 버튼 */}
          <TouchableOpacity
            style={[styles.submitButton, createMealMutation.isPending && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={createMealMutation.isPending}
          >
            {createMealMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>식단 등록하기</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF7',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 300,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A4A4A',
    marginBottom: 12,
  },
  categoryScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFE5E5',
    backgroundColor: '#FFFFFF',
    marginRight: 10,
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: '#FF9AA2',
    borderColor: '#FF9AA2',
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#4A4A4A',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  textArea: {
    minHeight: 120,
    maxHeight: 200,
  },
  charCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 4,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#4A4A4A',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  tagAddButton: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 16,
    gap: 4,
  },
  tagText: {
    fontSize: 14,
    color: '#4A4A4A',
    fontWeight: '500',
  },
  tagRemoveButton: {
    padding: 2,
  },
  submitButton: {
    backgroundColor: '#FF9AA2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});