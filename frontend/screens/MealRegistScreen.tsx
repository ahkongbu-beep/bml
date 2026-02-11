import React, { useState, useEffect, useRef } from 'react';
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
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import Layout from '@/components/Layout';
import { useAuth } from '../libs/contexts/AuthContext';
import { MEAL_CATEGORIES } from '../libs/utils/codes/MealCalendarCode';
import { useCategoryCodes } from '../libs/hooks/useCategories';
import { getStaticImage } from '../libs/utils/common';
import { useCreateMeal, useUpdateMeal, useCreateMealWithImage, useUpdateMealWithImage } from '../libs/hooks/useMeals';

export default function MealRegistScreen({ route, navigation }: any) {
  const { selectedDate, meal } = route.params || {};
  const { user } = useAuth();
  const { data: categoryCodes } = useCategoryCodes('MEALS_GROUP');
  const createMealMutation = useCreateMeal();
  const updateMealMutation = useUpdateMeal();
  const createMealWithImageMutation = useCreateMealWithImage();
  const updateMealWithImageMutation = useUpdateMealWithImage();
  const isEditMode = !!meal;

  const [title, setTitle] = useState('');
  const [contents, setContents] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  // 애니메이션 값
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // 마운트 시 애니메이션
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // 수정 모드일 때 초기값 설정
  useEffect(() => {
    if (meal) {
      setTitle(meal.title || '');
      setContents(meal.contents || '');
      setSelectedCategory(meal.category_id || null);
      setTags(meal.tags || []);

      // 기존 이미지 URL 설정
      if (meal.image_url) {
        setExistingImageUrl(getStaticImage('medium', meal.image_url));
      }
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

  const handlePickImage = async () => {
    // 권한 요청
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
      return;
    }

    // 이미지 선택
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    // 카메라 권한 요청
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
      return;
    }

    // 카메라로 촬영
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setExistingImageUrl(null);
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

    // 이미지가 있는 경우 FormData 사용
    if (selectedImage) {
      const formData = new FormData();

      // 이미지 파일 추가
      const filename = selectedImage.split('/').pop() || 'meal.jpg';
      const match = /\.([\w]+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('attaches', {
        uri: selectedImage,
        name: filename,
        type: type,
      } as any);

      // 나머지 데이터 추가
      Object.entries(mealData).forEach(([key, value]) => {
        if (key === 'tags') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });

      if (isEditMode) {
        // 수정 모드 (이미지 포함)
        updateMealWithImageMutation.mutate(
          { mealHash: meal.view_hash, formData },
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
        // 등록 모드 (이미지 포함)
        createMealWithImageMutation.mutate(formData, {
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
    } else {
      // 이미지가 없는 경우 기존 방식 사용
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
          <Animated.View
            style={[
              styles.dateSection,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}
          >
            <LinearGradient
              colors={['#FF9AA2', '#FFB7B2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dateGradient}
            >
              <Ionicons name="calendar" size={22} color="#FFFFFF" />
              <Text style={styles.dateText}>
                {selectedDate ? selectedDate.replace(/-/g, '.') : '날짜 미선택'}
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* 식사 시간 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>식사 시간 *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {categoryCodes?.map((category) => {
                const isActive = selectedCategory === category.id;
                return isActive ? (
                  <LinearGradient
                    key={category.id}
                    colors={['#FF9AA2', '#FFB7B2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.categoryButtonActive}
                  >
                    <TouchableOpacity
                      style={styles.categoryButtonInner}
                      onPress={() => setSelectedCategory(category.id)}
                    >
                      <Text style={styles.categoryIcon}>{MEAL_CATEGORIES.find(c => c.name === category.value)?.icon || ''}</Text>
                      <Text style={styles.categoryTextActive}>
                        {category.value}
                      </Text>
                    </TouchableOpacity>
                  </LinearGradient>
                ) : (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryButton}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Text style={styles.categoryIcon}>{MEAL_CATEGORIES.find(c => c.name === category.value)?.icon || ''}</Text>
                    <Text style={styles.categoryText}>
                      {category.value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 이미지 첨부 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>사진</Text>
            {(selectedImage || existingImageUrl) ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: selectedImage || existingImageUrl || '' }}
                  style={styles.imagePreview}
                />
                <TouchableOpacity
                  style={styles.imageRemoveButton}
                  onPress={handleRemoveImage}
                >
                  <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imageButtonContainer}>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={handleTakePhoto}
                >
                  <Ionicons name="camera" size={24} color="#FF9AA2" />
                  <Text style={styles.imageButtonText}>촬영</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={handlePickImage}
                >
                  <Ionicons name="images" size={24} color="#FF9AA2" />
                  <Text style={styles.imageButtonText}>갤러리</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 제목 입력 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>제목 *</Text>
            <TextInput
              style={styles.input}
              placeholder="식단 제목을 입력하세요"
              placeholderTextColor="#B8B8B8"
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
              placeholderTextColor="#B8B8B8"
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
                placeholderTextColor="#B8B8B8"
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.tagAddButton} onPress={handleAddTag}>
                <Ionicons name="add" size={26} color="#FFFFFF" />
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
          <LinearGradient
            colors={createMealMutation.isPending ? ['#CCC', '#DDD'] : ['#FF9AA2', '#FF7B89']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitButton}
          >
            <TouchableOpacity
              style={styles.submitButtonInner}
              onPress={handleSubmit}
              disabled={createMealMutation.isPending}
            >
              {createMealMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>✨ 식단 저장하기 ✨</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Layout>
  );
}
