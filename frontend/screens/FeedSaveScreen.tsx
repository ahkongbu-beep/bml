import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Header from '../components/Header';
import Layout from '../components/Layout';
import styles from './FeedSaveScreen.styles';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useCreateFeed, useUpdateFeed, useSearchTags } from '../libs/hooks/useFeeds';
import { useAuth } from '../libs/contexts/AuthContext';
import { useCategoryCodes } from '../libs/hooks/useCategories';
import { useMealsByDate } from '../libs/hooks/useMeals';

import { getToday, getStaticImage } from '../libs/utils/common';
import { toastInfo, toastSuccess, toastError } from '../libs/utils/toast';
import { MEAL_CATEGORIES } from '../libs/utils/codes/MealCalendarCode';
import { MEAL_CONDITION } from '../libs/utils/codes/FeedMealCondition';

export default function FeedSaveScreen({ route, navigation }: any) {
  const { feed } = route.params || {};
  const isEditMode = !!feed;
  const { user } = useAuth();
  const createFeedMutation = useCreateFeed();
  const updateFeedMutation = useUpdateFeed();
  const { data: categoryCodes } = useCategoryCodes('MEALS_GROUP');
  const nowDate = getToday('YYYY-MM-DD');

  // 이미 등록된 카테고리 ID 배열 추출
  const { data: existCategoriesData} = useMealsByDate(user?.view_hash || '', feed?.input_date || nowDate);
  const existCategoryIds = existCategoriesData?.exist_categories || [];

  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublic, setIsPublic] = useState<'Y' | 'N'>('Y');
  const [isShareMealPlan, setIsShareMealPlan] = useState<'Y' | 'N'>('N');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [mealCondition, setMealCondition] = useState<string>('2');

  // 화면이 열릴 때 또는 feed가 변경될 때 초기화
  useEffect(() => {
    if (isEditMode && feed) {
      setContent(feed.content || '');
      setImages(feed.images || []);
      setTags(feed.tags || []);
      setIsPublic(feed.is_published || 'Y');
      setIsShareMealPlan(feed.is_share_meal_plan || 'N');
      setSelectedCategory(feed.category_id || '');
      setMealCondition(feed.meal_condition || '2');
    } else {
      // 새 글 작성 시 초기화
      setContent('');
      setImages([]);
      setTags([]);
      setIsPublic('Y');
      setIsShareMealPlan('N');
      setSelectedCategory('');
      setMealCondition('2');
    }
  }, [feed, isEditMode]);

  // 태그 자동완성 검색
  const searchTerm = tagInput.trim();
  const { data: tagSuggestions = [] } = useSearchTags(searchTerm);
  const showTagSuggestions = searchTerm.length > 0 && tagSuggestions.length > 0;

  const handleImagePick = async () => {
    if (images.length >= 1) {
      toastError('사진은 최대 1장까지 업로드할 수 있습니다.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toastError('사진을 선택하려면 갤러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  // 이미지 제거 함수
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // 재료 추가함수
  const handleAddTag = (tagName: string) => {
    const cleanTag = tagName.replace('#', '').trim();
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
      setTagInput('');
    }
  };

  // 재료 제거 함수
  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // 내용 변경 함수
  const handleContentChange = (text: string) => {
    setContent(text);

    // # 입력 감지
    const lastChar = text[text.length - 1];
    if (lastChar === '#') {
      setTagInput('#');
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toastError('내용을 입력해주세요.');
      return;
    }

    if (content.length > 1000) {
      toastError('내용은 최대 1000자까지 입력할 수 있습니다.');
      return;
    }

    if (images.length === 0) {
      toastError('사진을 최소 1장 이상 업로드해주세요.');
      return;
    }

    if (!selectedCategory) {
      toastError('식사 시간을 선택해주세요.');
      return;
    }

    const feedData = {
      content,
      images: images.map(image =>
        image.startsWith('file://') ? image : getStaticImage("medium", image)
      ),
      tags,
      category_id: selectedCategory,
      is_share_meal_plan: isShareMealPlan,
      is_public: isPublic,
      meal_condition: mealCondition,
    };

    try {
      if (isEditMode) {
        await updateFeedMutation.mutateAsync({ id: feed.id, data: feedData });
        toastSuccess('피드가 수정되었습니다.', {
          onHide: () => navigation.goBack()
        });
      } else {
        await createFeedMutation.mutateAsync(feedData);
        toastSuccess('피드가 등록되었습니다.', {
          onHide: () => navigation.goBack()
        });
      }
    } catch (error) {
      toastError(error?.message || '피드 저장 중 오류가 발생했습니다.');
    }
  };

  const isLoading = createFeedMutation.isPending || updateFeedMutation.isPending;

  return (
    <Layout>
      <View style={styles.container}>
        <Header
          title={isEditMode ? '식단 수정하기' : '식단 올리기'}
          showBack={true}
          onBackPress={() => navigation.goBack()}
        />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* 이미지 섹션 */}
            <View style={styles.card}>
              <View style={styles.imageSection}>
                <Text style={styles.sectionLabel}>
                  사진 ({images.length}/1) <Text style={styles.required}>*</Text>
                </Text>
                <Text style={styles.sectionHint}>아이 식단 사진만 업로드해주세요.{"\n"}얼굴·신체 노출 사진은 제한됩니다</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 8 }}
                  style={{ marginHorizontal: -8 }}
                >
                  <View style={styles.imageList}>
                  {images.map((image, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image
                        source={{ uri: image.startsWith('file://') ? image : getStaticImage("medium", image) }}
                        style={styles.image}
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => handleRemoveImage(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {images.length < 2 && (
                    <TouchableOpacity
                      style={styles.addImageButton}
                      onPress={handleImagePick}
                    >
                      <Ionicons name="camera" size={40} color="#FFB6C1" />
                      <Text style={styles.addImageText}>사진 추가</Text>
                    </TouchableOpacity>
                  )}
                  </View>
                </ScrollView>
              </View>
            </View>

            {/* 식단 설명 카드 */}
            <View style={styles.card}>
              <View style={styles.inputSection}>
                <Text style={styles.sectionLabel}>
                  내용 <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.contentInput}
                  placeholder="오늘 준비한 식단에 대해 자유롭게 적어주세요."
                  value={content}
                  onChangeText={handleContentChange}
                  multiline
                  textAlignVertical="top"
                  placeholderTextColor="#999"
                />
                <View style={styles.charCountContainer}>
                  <Text style={styles.charCountText}>({content.length} / 1000)</Text>
                </View>
              </View>

              {/* 해시태그 섹션 */}
              <View style={styles.tagsSection}>
                <Text style={styles.sectionLabel}>재료 선택</Text>
                <View style={styles.tagsContainer}>
                  <Ionicons name="pricetag-outline" size={22} color="#FF9AA2" />
                  <TextInput
                    style={styles.tagsInput}
                    placeholder="재료명을 검색하세요(예: 당근, 감자)"
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={() => handleAddTag(tagInput)}
                    placeholderTextColor="#999"
                  />
                  {tagInput.length > 0 && (
                    <TouchableOpacity onPress={() => handleAddTag(tagInput)}>
                      <Ionicons name="add-circle" size={24} color="#FF9AA2" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* 재료 자동완성 */}
                {showTagSuggestions && tagSuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {tagSuggestions.map((suggestion, key) => (
                      <TouchableOpacity
                        key={key}
                        style={styles.suggestionItem}
                        onPress={() => handleAddTag(suggestion)}
                      >
                        <Text style={styles.suggestionText}>#{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* 추가된 재료 목록 */}
                {tags.length > 0 && (
                  <View style={styles.tagsList}>
                    {tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>#{tag}</Text>
                        <TouchableOpacity onPress={() => handleRemoveTag(index)}>
                          <Ionicons name="close-circle" size={18} color="#FF9AA2" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* 식사 컨디션 섹션 */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>식사 섭취량</Text>
              <View style={styles.buttonGroup}>
                {MEAL_CONDITION.map((condition) => (
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      mealCondition === condition.value && styles.toggleButtonActive,
                    ]}
                    onPress={() => setMealCondition(condition.value)}
                    activeOpacity={0.7}
                    key={condition.value}
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
              <Text style={styles.descriptionText}>아이의 식사를 기록해보세요.</Text>
            </View>

            {/* 식단 카테고리 선택 섹션 */}
            <View style={styles.card}>
              <View style={styles.inputSection}>
                <Text style={styles.sectionLabel}>식사 시간 *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                >
                  {categoryCodes?.map((category) => {
                    if (!isEditMode && existCategoryIds.length > 0 && existCategoryIds.includes(category.id)) {
                        return null;
                    }
                    return (
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
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            {/* 식단 캘린더 반영 */}
            { (!isEditMode || feed?.is_share_meal_plan === 'N' ) && (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>캘린더 반영 여부</Text>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    onPress={() => setIsShareMealPlan('Y')}
                    activeOpacity={0.7}
                    style={[
                      styles.toggleButton,
                      isShareMealPlan === 'Y' && styles.toggleButtonActive,
                    ]}
                  >
                    <Ionicons
                      name="calendar"
                      size={20}
                      color={isShareMealPlan === 'Y' ? '#FFFFFF' : '#999'}
                    />
                    <Text
                      style={[
                        styles.toggleButtonText,
                        isShareMealPlan === 'Y' && styles.toggleButtonTextActive,
                      ]}
                    >
                      반영
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      isShareMealPlan === 'N' && styles.toggleButtonActive,
                    ]}
                    onPress={() => setIsShareMealPlan('N')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={isShareMealPlan === 'N' ? '#FFFFFF' : '#999'}
                    />
                    <Text
                      style={[
                        styles.toggleButtonText,
                        isShareMealPlan === 'N' && styles.toggleButtonTextActive,
                      ]}
                    >
                      미반영
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.descriptionText}>이미지와 정보가 캘린더에 자동으로 반영됩니다.</Text>
              </View>
            )}

            {/* 공개 여부 */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>공개 여부</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    isPublic === 'Y' && styles.toggleButtonActive,
                  ]}
                  onPress={() => setIsPublic('Y')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="earth"
                    size={20}
                    color={isPublic === 'Y' ? '#FFFFFF' : '#999'}
                  />
                  <Text
                    style={[
                      styles.toggleButtonText,
                      isPublic === 'Y' && styles.toggleButtonTextActive,
                    ]}
                  >
                    공개
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    isPublic === 'N' && styles.toggleButtonActive,
                  ]}
                  onPress={() => setIsPublic('N')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="lock-closed"
                    size={20}
                    color={isPublic === 'N' ? '#FFFFFF' : '#999'}
                  />
                  <Text
                    style={[
                      styles.toggleButtonText,
                      isPublic === 'N' && styles.toggleButtonTextActive,
                    ]}
                  >
                    비공개
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.descriptionText}>피드 페이지에 노출됩니다.</Text>
            </View>
          </View>
        </ScrollView>

        {/* 등록 버튼 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditMode ? '수정하기' : '등록하기'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Layout>
  );
}