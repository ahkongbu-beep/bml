import React, { useState, useEffect } from 'react';
import styles from './MealRegistScreen.styles';
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
import { useCreateMeal, useUpdateMeal } from '../libs/hooks/useMeals';

export default function MealRegistScreen({ route, navigation }: any) {
  const { selectedDate, meal } = route.params || {};
  const { user } = useAuth();
  const { data: categoryCodes } = useCategoryCodes('MEALS_GROUP');
  const createMealMutation = useCreateMeal();
  const updateMealMutation = useUpdateMeal();
  const isEditMode = !!meal;

  const [title, setTitle] = useState('');
  const [contents, setContents] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // 수정 모드일 때 초기값 설정
  useEffect(() => {
    if (meal) {
      setTitle(meal.title || '');
      setContents(meal.contents || '');
      setSelectedCategory(meal.category_id || null);
      setTags(meal.tags || []);
    }
  }, [meal]);

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
    if (!title.trim()) {
      Alert.alert('알림', '제목을 입력해주세요.');
      return;
    }
    if (!contents.trim()) {
      Alert.alert('알림', '내용을 입력해주세요.');
      return;
    }
    if (!selectedCategory) {
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

    if (isEditMode) {
      // 수정 모드
      updateMealMutation.mutate(
        { mealHash: meal.view_hash, mealData },
        {
          onSuccess: (response) => {
            if (!response.success) {
              Alert.alert('오류', response.error || response.message || '식단 수정에 실패했습니다.');
              return;
            }

            Alert.alert('성공', '식단이 수정되었습니다.', [{
              text: '확인',
              onPress: () => navigation.goBack(),
            }]);
          },
          onError: (error) => {
            console.error('식단 수정 오류:', error);
            Alert.alert('오류', '식단 수정에 실패했습니다.');
          },
        }
      );
    } else {
      // 등록 모드
      createMealMutation.mutate(mealData, {
        onSuccess: (response) => {
          if (!response.success) {
            Alert.alert('오류', response.error || response.message || '식단 등록에 실패했습니다.');
            return;
          }
          Alert.alert('성공', '식단이 등록되었습니다.', [{
            text: '확인',
            onPress: () => navigation.goBack(),
          }]);
        },
        onError: (error) => {
          console.error('식단 등록 오류:', error);
          Alert.alert('오류', '식단 등록에 실패했습니다.');
        },
      });
    }
  };

  return (
    <Layout>
      <View style={styles.container}>
        <Header
          title={isEditMode ? '식단 수정' : '식단 추가'}
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
