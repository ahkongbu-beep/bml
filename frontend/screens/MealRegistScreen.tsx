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
import { useSearchTags } from '../libs/hooks/useFeeds';
import { getStaticImage } from '../libs/utils/common';
import { useCreateMealWithImage, useUpdateMealWithImage, useUpdateMeal } from '../libs/hooks/useMeals';
import { MEAL_CONDITION } from '../libs/utils/codes/FeedMealCondition';
import { toastError, toastInfo, toastSuccess } from '@/libs/utils/toast';

export default function MealRegistScreen({ route, navigation }: any) {
  const { selectedDate, meal } = route.params || {};

  const { user } = useAuth();
  const { data: categoryCodes } = useCategoryCodes('MEALS_GROUP');
  const createMealWithImageMutation = useCreateMealWithImage();
  const updateMealWithImageMutation = useUpdateMealWithImage();
  const updateMealMutation = useUpdateMeal();
  const isPending = createMealWithImageMutation.isPending || updateMealWithImageMutation.isPending;
  const isEditMode = !!meal;

  const [contents, setContents] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [mealCondition, setMealCondition] = useState<string>('0');
  const [isPreMade, setIsPreMade] = useState<'Y' | 'N'>('N');
  const [isPublic, setIsPublic] = useState<'Y' | 'N'>('Y');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');

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

  const searchTerm = ingredientInput.trim();
  const { data: tagSuggestions = [] } = useSearchTags(searchTerm);
  const showTagSuggestions = searchTerm.length > 0 && tagSuggestions.length > 0;
  // 수정 모드일 때 초기값 설정
  useEffect(() => {
    if (meal) {
      setContents(meal.contents || '');
      setSelectedCategory(meal.category_id || null);
      setMealCondition(meal.meal_condition || '0');
      setIsPreMade(meal.is_pre_made || 'N');
      setIsPublic(meal.is_public || 'Y');
      setIngredients(meal.mapped_tags || []);

      // 기존 이미지 URL 설정
      if (meal.image_url) {
        setExistingImageUrl(getStaticImage('medium', meal.image_url));
        setSelectedImage(getStaticImage('medium', meal.image_url));
      }
    }
  }, [meal]);

  const handleAddIngredient = (suggestion?: string) => {
    const clean = (suggestion || ingredientInput).replace('#', '').trim();
    if (clean && !ingredients.includes(clean)) {
      setIngredients([...ingredients, clean]);
      setIngredientInput('');
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handlePickImage = async () => {
    // 권한 요청
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toastError('갤러리 접근 권한이 필요합니다.');
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
      toastError('카메라 접근 권한이 필요합니다.');
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
      contents: contents.trim(),
      category_id: selectedCategory,
      input_date: selectedDate,
      ingredientInput: ingredientInput,
      meal_condition: mealCondition,
      is_pre_made: isPreMade,
      is_public: isPublic,
      ingredients: isPreMade === 'N' ? ingredients : [],
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
        if (key === 'ingredients' && Array.isArray(value)) {
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
              toastSuccess('식단이 수정되었습니다.', {
                onPress: () => navigation.goBack(),
                onHide: () => navigation.goBack(),
              });
            },
            onError: (error) => {
              toastError('식단 수정에 실패했습니다.');
            },
          }
        );
      } else {
        // 등록 모드 (이미지 포함)
        createMealWithImageMutation.mutate(formData, {
          onSuccess: (response) => {
            if (!response.success) {
              toastError(response.error || response.message || '식단 등록에 실패했습니다.');
              return;
            }
            toastSuccess('식단이 등록되었습니다.', {
              onPress: () => navigation.goBack(),
              onHide: () => navigation.goBack(),
            });
          },
          onError: (error) => {
            toastError('식단 등록에 실패했습니다.');
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
                toastError(response.error || response.message || '식단 수정에 실패했습니다.');
                return;
              }
              toastSuccess('식단이 수정되었습니다.', {
                onHide: () => navigation.goBack(),
              });
            },
            onError: (error) => {
              toastError('식단 수정에 실패했습니다.');
            },
          }
        );
      } else {
        toastInfo('이미지 없이 식단을 등록할수 없습니다.');
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

          {/* 식사 섭취량 start */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>식사 섭취량</Text>
            <View style={styles.buttonGroup}>
              {MEAL_CONDITION.map((condition) => (
                <TouchableOpacity
                  key={condition.value}
                  style={[
                    styles.toggleButton,
                    mealCondition === condition.value && styles.toggleButtonActive,
                  ]}
                  onPress={() => setMealCondition(condition.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.toggleButtonText,
                      mealCondition === condition.value && styles.toggleButtonTextActive,
                    ]}
                  >
                    {condition.icon} {condition.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {/* 식사 섭취량 end */}

          {/* 기성품 여부 Y/N | N 인 경우 재료 입력 start */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>기성품 여부</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.toggleButton, isPreMade === 'Y' && styles.toggleButtonActive]}
                onPress={() => setIsPreMade('Y')}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleButtonText, isPreMade === 'Y' && styles.toggleButtonTextActive]}>
                  🏪 기성품
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, isPreMade === 'N' && styles.toggleButtonActive]}
                onPress={() => setIsPreMade('N')}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleButtonText, isPreMade === 'N' && styles.toggleButtonTextActive]}>
                  🥣 직접 조리
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.descriptionText}>구매한 완제품이면 기성품을 선택해주세요.</Text>
          </View>
          {/* 기성품 여부 Y/N | N 인 경우 재료 입력 end */}

          {/* 재료입력(기성품 여부가 N 인 경우)start */}
          {isPreMade === 'N' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>재료 입력</Text>
              <View style={styles.tagInputContainer}>
                <View style={styles.tagInputRow}>
                  <TextInput
                    style={styles.tagInput}
                    placeholder="재료명을 입력하세요 (예: 당근, 감자)"
                    placeholderTextColor="#B8B8B8"
                    value={ingredientInput}
                    onChangeText={setIngredientInput}
                    onSubmitEditing={() => handleAddIngredient(ingredientInput)}
                    returnKeyType="done"
                  />
                  {ingredientInput.length > 0 && (
                    <TouchableOpacity style={styles.tagAddButton} onPress={() => handleAddIngredient(ingredientInput)}>
                      <Ionicons name="add" size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* 재료 자동완성 */}
                {showTagSuggestions && tagSuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <View style={styles.suggestionsHeader}>
                      <Ionicons name="search" size={13} color="#FF9AA2" />
                      <Text style={styles.suggestionsHeaderText}>추천 재료</Text>
                    </View>
                    {tagSuggestions.map((suggestion, key) => (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.suggestionItem,
                          key === tagSuggestions.length - 1 && styles.suggestionItemLast,
                        ]}
                        onPress={() => handleAddIngredient(suggestion)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.suggestionHash}>#</Text>
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                        <Ionicons name="add-circle-outline" size={18} color="#FF9AA2" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {ingredients.length > 0 && (
                <View style={styles.tagList}>
                  {ingredients.map((item, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>#{item}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveIngredient(index)}
                        style={styles.tagRemoveButton}
                      >
                        <Ionicons name="close" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
          {/* 재료입력 end */}

          {/* 공개여부 start */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>공개 여부</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.toggleButton, isPublic === 'Y' && styles.toggleButtonActive]}
                onPress={() => setIsPublic('Y')}
                activeOpacity={0.7}
              >
                <Ionicons name="earth" size={18} color={isPublic === 'Y' ? '#FFFFFF' : '#999'} />
                <Text style={[styles.toggleButtonText, isPublic === 'Y' && styles.toggleButtonTextActive]}>
                  공개
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, isPublic === 'N' && styles.toggleButtonActive]}
                onPress={() => setIsPublic('N')}
                activeOpacity={0.7}
              >
                <Ionicons name="lock-closed" size={18} color={isPublic === 'N' ? '#FFFFFF' : '#999'} />
                <Text style={[styles.toggleButtonText, isPublic === 'N' && styles.toggleButtonTextActive]}>
                  비공개
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.descriptionText}>
              {isPublic === 'Y' ? '피드 페이지에 전체 공개됩니다' : '마이페이지를 통해서만 확인가능합니다.'}
            </Text>
          </View>
          {/* 공개여부 end */}


          {/* 저장 버튼 */}
          <LinearGradient
            colors={isPending ? ['#CCC', '#DDD'] : ['#FF9AA2', '#FF7B89']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitButton}
          >
            <TouchableOpacity
              style={styles.submitButtonInner}
              onPress={handleSubmit}
              disabled={isPending}
            >
              {isPending ? (
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
