import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MEAL_CATEGORIES } from '../libs/utils/codes/MealCalendarCode';
import * as ImagePicker from 'expo-image-picker';
import Header from '../components/Header';
import { useCreateFeed, useUpdateFeed, useSearchTags } from '../libs/hooks/useFeeds';
import { useAuth } from '../libs/contexts/AuthContext';
import Layout from '../components/Layout';
import { useCategoryCodes } from '../libs/hooks/useCategories';
import { useMealsByDate } from '../libs/hooks/useMeals';
import { getToday } from '../libs/utils/common';

export default function FeedSaveScreen({ route, navigation }: any) {
  const { feed } = route.params || {};
  const isEditMode = !!feed;

  const { user } = useAuth();
  const createFeedMutation = useCreateFeed();
  const updateFeedMutation = useUpdateFeed();
  const { data: categoryCodes } = useCategoryCodes('MEALS_GROUP');

  const nowDate = getToday('YYYY-MM-DD');

  const { data: existCategoriesData} = useMealsByDate(user?.view_hash || '', feed?.input_date || nowDate);

  // 이미 등록된 카테고리 ID 배열 추출
  const existCategoryIds = existCategoriesData?.exist_categories || [];

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublic, setIsPublic] = useState<'Y' | 'N'>('Y');
  const [isShareMealPlan, setIsShareMealPlan] = useState<'Y' | 'N'>('N');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // 화면이 열릴 때 또는 feed가 변경될 때 초기화
  useEffect(() => {
    if (isEditMode && feed) {
      setTitle(feed.title || '');
      setContent(feed.content || '');
      setImages(feed.images || []);
      setTags(feed.tags || []);
      setIsPublic(feed.is_published || 'Y');
      setIsShareMealPlan(feed.is_share_meal_plan || 'N');
      setSelectedCategory(feed.category_id || '');
    } else {
      // 새 글 작성 시 초기화
      setTitle('');
      setContent('');
      setImages([]);
      setTags([]);
      setIsPublic('Y');
      setIsShareMealPlan('N');
      setSelectedCategory('');
    }
  }, [feed, isEditMode]);

  // 태그 자동완성 검색
  const searchTerm = tagInput.startsWith('#') && tagInput.length > 1 ? tagInput.slice(1) : '';
  const { data: tagSuggestions = [] } = useSearchTags(searchTerm);
  const showTagSuggestions = searchTerm.length > 0 && tagSuggestions.length > 0;

  const handleImagePick = async () => {
    if (images.length >= 3) {
      Alert.alert('알림', '이미지는 최대 3장까지 업로드할 수 있습니다.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요합니다.');
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

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddTag = (tagName: string) => {
    const cleanTag = tagName.replace('#', '').trim();
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleContentChange = (text: string) => {
    setContent(text);

    // # 입력 감지
    const lastChar = text[text.length - 1];
    if (lastChar === '#') {
      setTagInput('#');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('알림', '제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('알림', '내용을 입력해주세요.');
      return;
    }
    if (images.length === 0) {
      Alert.alert('알림', '최소 1개의 이미지를 첨부해주세요.');
      return;
    }

    const feedData = {
      user_hash: user?.view_hash || '',
      title,
      content,
      images,
      tags,
      category_id: selectedCategory,
      is_share_meal_plan: isShareMealPlan,
      is_public: isPublic,
    };

    try {
      if (isEditMode) {
        await updateFeedMutation.mutateAsync({ id: feed.id, data: feedData });
        Alert.alert('성공', '피드가 수정되었습니다.', [
          { text: '확인', onPress: () => navigation.goBack() },
        ]);
      } else {
        await createFeedMutation.mutateAsync(feedData);
        Alert.alert('성공', '피드가 등록되었습니다.', [
          { text: '확인', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert('오류', '피드 저장에 실패했습니다.');
      console.error('Feed save error:', error);
    }
  };

  const isLoading = createFeedMutation.isPending || updateFeedMutation.isPending;

  return (
    <Layout>
      <View style={styles.container}>
        <Header
          title={isEditMode ? '피드 수정' : '피드 작성'}
          showBack={true}
          onBackPress={() => navigation.goBack()}
        />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* 이미지 섹션 */}
            <View style={styles.imageSection}>
              <Text style={styles.sectionLabel}>
                사진 ({images.length}/3) <Text style={styles.required}>*</Text>
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.imageList}>
                  {images.map((image, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image source={{ uri: image }} style={styles.image} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => handleRemoveImage(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {images.length < 3 && (
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

            {/* 제목 입력 */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionLabel}>
                제목 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.titleInput}
                placeholder="제목을 입력하세요"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#999"
              />
            </View>

            {/* 내용 입력 */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionLabel}>
                내용 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.contentInput}
                placeholder="내용을 입력하세요&#10;해시태그는 #을 입력하여 추가할 수 있습니다"
                value={content}
                onChangeText={handleContentChange}
                multiline
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
            </View>

            {/* 해시태그 섹션 */}
            <View style={styles.tagsSection}>
              <Text style={styles.sectionLabel}>해시태그</Text>
              <View style={styles.tagsContainer}>
                <Ionicons name="pricetag-outline" size={22} color="#FF9AA2" />
                <TextInput
                  style={styles.tagsInput}
                  placeholder="예: #이유식 #아기반찬"
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

              {/* 태그 자동완성 */}
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

              {/* 추가된 태그 목록 */}
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

            {/* 식단 카테고리 선택 섹션 */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionLabel}>식사 시간 *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                {categoryCodes?.map((category) => {
                  if (existCategoryIds.length > 0 && existCategoryIds.includes(category.id)) {
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
                )})}
              </ScrollView>
            </View>
            {/* 식단 캘린더 반영 설정 */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionLabel}>식단 캘린더 반영</Text>
              <View style={styles.publicButtons}>
                <TouchableOpacity
                  style={[
                    styles.publicButton,
                    isShareMealPlan === 'Y' && styles.publicButtonActive,
                  ]}
                  onPress={() => setIsShareMealPlan('Y')}
                >
                  <Ionicons
                    name="earth"
                    size={20}
                    color={isShareMealPlan === 'Y' ? '#FFFFFF' : '#FF9AA2'}
                  />
                  <Text
                    style={[
                      styles.publicButtonText,
                      isShareMealPlan === 'Y' && styles.publicButtonTextActive,
                    ]}
                  >
                    반영
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.publicButton,
                    isShareMealPlan === 'N' && styles.publicButtonActive,
                  ]}
                  onPress={() => setIsShareMealPlan('N')}
                >
                  <Ionicons
                    name="lock-closed"
                    size={20}
                    color={isShareMealPlan === 'N' ? '#FFFFFF' : '#FF9AA2'}
                  />
                  <Text
                    style={[
                      styles.publicButtonText,
                      isShareMealPlan === 'N' && styles.publicButtonTextActive,
                    ]}
                  >
                    미반영
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 공개 설정 */}
            <View style={styles.publicSection}>
              <Text style={styles.sectionLabel}>공개 설정</Text>
              <View style={styles.publicButtons}>
                <TouchableOpacity
                  style={[
                    styles.publicButton,
                    isPublic === 'Y' && styles.publicButtonActive,
                  ]}
                  onPress={() => setIsPublic('Y')}
                >
                  <Ionicons
                    name="earth"
                    size={20}
                    color={isPublic === 'Y' ? '#FFFFFF' : '#FF9AA2'}
                  />
                  <Text
                    style={[
                      styles.publicButtonText,
                      isPublic === 'Y' && styles.publicButtonTextActive,
                    ]}
                  >
                    전체 공개
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.publicButton,
                    isPublic === 'N' && styles.publicButtonActive,
                  ]}
                  onPress={() => setIsPublic('N')}
                >
                  <Ionicons
                    name="lock-closed"
                    size={20}
                    color={isPublic === 'N' ? '#FFFFFF' : '#FF9AA2'}
                  />
                  <Text
                    style={[
                      styles.publicButtonText,
                      isPublic === 'N' && styles.publicButtonTextActive,
                    ]}
                  >
                    비공개
                  </Text>
                </TouchableOpacity>
              </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF7',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A4A4A',
    marginBottom: 12,
  },
  required: {
    color: '#FF6B6B',
  },
  imageSection: {
    marginBottom: 24,
  },
  imageList: {
    flexDirection: 'row',
    gap: 12,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#FFF5F0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  addImageButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#FFF5F0',
    borderWidth: 2,
    borderColor: '#FFE5E5',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 13,
    color: '#FFB6C1',
    marginTop: 8,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 24,
  },
  titleInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE5E5',
    borderRadius: 12,
    padding: 16,
  },
  contentInput: {
    fontSize: 16,
    color: '#4A4A4A',
    minHeight: 200,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE5E5',
    borderRadius: 12,
    padding: 16,
    lineHeight: 24,
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
  tagsSection: {
    marginBottom: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE5E5',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  tagsInput: {
    flex: 1,
    fontSize: 14,
    color: '#4A4A4A',
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE5E5',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 150,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE5E5',
  },
  suggestionText: {
    fontSize: 14,
    color: '#FF9AA2',
    fontWeight: '600',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#FF9AA2',
    fontWeight: '600',
  },
  publicSection: {
    marginBottom: 24,
  },
  publicButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  publicButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFE5E5',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  publicButtonActive: {
    backgroundColor: '#FF9AA2',
    borderColor: '#FF9AA2',
  },
  publicButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF9AA2',
  },
  publicButtonTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#FFE5E5',
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButton: {
    backgroundColor: '#FF9AA2',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF9AA2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
