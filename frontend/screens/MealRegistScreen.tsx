import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/screens/MealRegistScreen.styles';
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
  Modal,
  useWindowDimensions,
} from 'react-native';
import Header from '../components/Header';
import Layout from '@/components/Layout';
import AiSummaryMealModal from '../components/AiSummaryMealModal';
import { LoadingPage } from '../components/Loading';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../libs/contexts/AuthContext';
import { useIngredientList } from '../libs/hooks/useFeeds';
import { useCreateMealWithImage, useUpdateMealWithImage, useUpdateMeal, useAnalyzeMeal } from '../libs/hooks/useMeals';
import { useCategoryCodes } from '../libs/hooks/useCategories';
import { useIngredientRequest } from '../libs/hooks/useIngredients';

// 상수 및 utils
import { getStaticImage } from '../libs/utils/common';
import { toastError, toastInfo, toastSuccess } from '@/libs/utils/toast';
import { MEAL_STAGE } from '../libs/utils/codes/MealState';
import { MEAL_CATEGORIES } from '../libs/utils/codes/MealCalendarCode';
import { MEAL_CONDITION } from '../libs/utils/codes/FeedMealCondition';
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  INGREDIENT_AMOUNT_OPTIONS,
  getAmountCircles,
  getAmountColor,
  getBorderColor
} from '../libs/utils/codes/IngredientCode';

export default function MealRegistScreen({ route, navigation }: any) {
  const { width: screenWidth } = useWindowDimensions();

  const { selectedDate: _selectedDate, meal, selectedChildId } = route.params || {};

  // 선택된 날짜가 없으면 오늘날짜로
  const today = new Date();
  const selectedDate = _selectedDate || [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  const { user } = useAuth();
  const { data: categoryCodes } = useCategoryCodes('MEALS_GROUP');

  // 재료 요청
  const useIngredientRequestMutation = useIngredientRequest();

  const createMealWithImageMutation = useCreateMealWithImage();
  const updateMealWithImageMutation = useUpdateMealWithImage();
  const updateMealMutation = useUpdateMeal();
  const analyzeMealMutation = useAnalyzeMeal();
  const isPending = createMealWithImageMutation.isPending || updateMealWithImageMutation.isPending;
  const isEditMode = !!meal;

  const [contents, setContents] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [mealCondition, setMealCondition] = useState<string>('0');

  const [mealStage, setMealStage] = useState<number>(0); // 1: 이유식, 2: 유아식, 3: 일반식
  const [mealStageDetail, setMealStageDetail] = useState<string>(''); // 세부 단계 선택값
  const [isPublic, setIsPublic] = useState<'Y' | 'N'>('Y');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientAmounts, setIngredientAmounts] = useState<Record<string, number>>({});
  const [ingredientAmountModalVisible, setIngredientAmountModalVisible] = useState(false);
  const [selectedIngredientNameForAmount, setSelectedIngredientNameForAmount] = useState<string | null>(null);
  const [ingredientRequestModalVisible, setIngredientRequestModalVisible] = useState(false);
  const [ingredientRequestText, setIngredientRequestText] = useState('');
  const [ingredientInput, setIngredientInput] = useState('');
  const [childId, setChildId] = useState<number | null>(selectedChildId || null);
  const [selectedIngredientCategory, setSelectedIngredientCategory] = useState<string | null>(null);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [showIngredientInput, setShowIngredientInput] = useState(false);
  const [aiSummaryVisible, setAiSummaryVisible] = useState(false);
  const [aiSummaryData, setAiSummaryData] = useState<{
    totalScore: number;
    totalSummary: string;
    suggestions: string[];
  } | null>(null);
  const { data: ingredientListData, isLoading: ingredientListLoading } = useIngredientList('');

  const selectedStage = MEAL_STAGE.find(stage => stage.id === mealStage);
  const [stageItems, setStageItems] = useState<{id:string;label:string;needCode:boolean}[]>([]);

  useEffect(() => {
    const stage = MEAL_STAGE.find(s => s.id === mealStage);

    if (stage && Array.isArray(stage.items)) {
      setStageItems(stage.items);
    } else {
      setStageItems([]);
    }
  }, [mealStage]);

  useEffect(() => {
    const selectedStageItem = stageItems.find((item) => item.id === mealStageDetail);
    setShowIngredientInput(!!selectedStageItem?.needCode);
  }, [stageItems, mealStageDetail]);

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

  // 수정 모드일 때 초기값 설정 (조건부 return 이전에 위치해야 함 - Rules of Hooks)
  useEffect(() => {

    if (meal) {
      setContents(meal.contents || '');
      setSelectedCategory(meal.category_id || null);
      setMealCondition(meal.meal_condition || '0');
      setIsPublic(meal.is_public || 'Y');
      setChildId(meal.childs?.child_id || null);

      // mapped_tags에서 재료 이름과 스코어 추출
      if (meal.mapped_tags && Array.isArray(meal.mapped_tags)) {
        const ingredientNames = meal.mapped_tags.map((tag: any) => tag.mapper_name);
        const amounts: {[key: string]: number} = {};
        meal.mapped_tags.forEach((tag: any) => {
          amounts[tag.mapper_name] = parseFloat(tag.mapper_score);
        });
        setIngredients(ingredientNames);
        setIngredientAmounts(amounts);
      } else {
        setIngredients([]);
        setIngredientAmounts({});
      }

      setMealStage(meal.meal_stage || 0);
      setMealStageDetail(meal.meal_stage_detail || '');

      // 기존 이미지 URL 설정
      if (meal.image_url) {
        setExistingImageUrl(getStaticImage('medium', meal.image_url));
        setSelectedImage(getStaticImage('medium', meal.image_url));
      }
    }
  }, [meal]);

  if (ingredientListLoading) {
    return (
      <LoadingPage title="재료 정보를 불러오는 중" />
    );
  }

  const handleAddIngredient = (suggestion?: string) => {
    const clean = (suggestion || ingredientInput).replace('#', '').trim();
    if (clean && !ingredients.includes(clean)) {
      setIngredients([...ingredients, clean]);
      setIngredientInput('');
    }
  };

  const handleRemoveIngredient = (index: number) => {
    const targetIngredient = ingredients[index];
    setIngredients(ingredients.filter((_, i) => i !== index));
    if (targetIngredient) {
      setIngredientAmounts((prev) => {
        const next = { ...prev };
        delete next[targetIngredient];
        return next;
      });
    }
  };

  const handleOpenIngredientAmountModal = (ingredientName: string) => {
    setSelectedIngredientNameForAmount(ingredientName);
    setIngredientAmountModalVisible(true);
  };

  const handleSelectIngredientAmount = (amountValue: number) => {
    if (!selectedIngredientNameForAmount) {
      return;
    }

    const ingredientName = selectedIngredientNameForAmount;
    if (!ingredients.includes(ingredientName)) {
      setIngredients((prev) => [...prev, ingredientName]);
    }
    setIngredientAmounts((prev) => ({
      ...prev,
      [ingredientName]: amountValue,
    }));

    setIngredientAmountModalVisible(false);
    setSelectedIngredientNameForAmount(null);
  };

  const handleCloseIngredientAmountModal = () => {
    setIngredientAmountModalVisible(false);
    setSelectedIngredientNameForAmount(null);
  };

  const handleOpenIngredientRequestModal = () => {
    setIngredientRequestModalVisible(true);
  };

  const handleCloseIngredientRequestModal = () => {
    setIngredientRequestModalVisible(false);
    setIngredientRequestText('');
  };

  const handleSubmitIngredientRequest = () => {
    const requestText = ingredientRequestText.trim();
    if (!requestText) {
      toastInfo('추가 요청할 재료를 입력해주세요.');
      return;
    }

    requestText.split(',').forEach((name) => {
      if (!name.trim()) {
        toastInfo('빈 재료 이름은 요청할 수 없습니다.');
        return;
      }
    });

    const requestArr = requestText.split(',').map(name => name.trim()).filter(name => name.length > 0);

    useIngredientRequestMutation.mutate(requestArr, {
      onSuccess: () => {
        toastSuccess('추가재료 요청이 등록되었습니다.');
        setIngredientRequestText('');
        setIngredientRequestModalVisible(false);
      },
      onError: (error) => {
        toastError('재료 요청에 실패하였습니다.');
      },
    });
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
      setImageChanged(true);
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
      setImageChanged(true);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImageChanged(true);
    setExistingImageUrl(null);
  };

  const handelMealStageDetailSelect = (item: { id: string; label: string; needCode: boolean }) => {
    setShowIngredientInput(item.needCode);
    setMealStageDetail(item.id);
  }

  // 화면 너비에 따른 동적 폰트 사이즈 계산
  const getResponsiveFontSize = () => {
    if (screenWidth < 320) {
      return 8.5;
    } else if (screenWidth < 375) {
      return 9;
    } else {
      return 10;
    }
  };

  const responsiveFontSize = getResponsiveFontSize();

  /*
    식단 등록 전 ai 분석
   */
  const handleAiAnalysis = () => {
    const ingredientIdByName = new Map<string, number>();

    if (Array.isArray(ingredientListData)) {
      ingredientListData.forEach((category: any) => {
        (category?.ingredients ?? []).forEach((ing: any) => {
          ingredientIdByName.set(ing.name, Number(ing.id));
        });
      });
    }

    const ingredientList = ingredients
      .map((name) => {
        const ingredientId = ingredientIdByName.get(name);
        if (!ingredientId) {
          return null;
        }
        return {
          ingredient_id: ingredientId,
          score: ingredientAmounts[name] ?? 0.6,
        };
      })
      .filter((item): item is { ingredient_id: number; score: number } => item !== null);

    analyzeMealMutation.mutate(
      {
        userHash: user?.view_hash || '',
        categoryCode: selectedCategory ? String(selectedCategory) : '',
        input_date: selectedDate,
        childId: childId || 0,
        mealStage, mealStageDetail,
        contents: contents.trim(),
        ingredients: ingredientList,
      },
      {
        onSuccess: (response) => {
          if (!response.success) {
            toastError(response.error || response.message || '영양 분석에 실패했습니다.');
            return;
          }

          const analysisResult = response.data;
          const totalScore = Number(analysisResult?.total_score ?? 0);
          const totalSummary = analysisResult?.total_summary ?? '';
          const suggestions = typeof analysisResult?.suggestion === 'string'
            ? analysisResult.suggestion.split('_AND_').filter((item: string) => item.trim().length > 0)
            : [];

          setAiSummaryData({
            totalScore,
            totalSummary,
            suggestions,
          });
          setAiSummaryVisible(true);

        },
        onError: (error) => {
          toastError('식단 수정에 실패했습니다.');
        },
      }
    );
  }

  const handleSubmit = async () => {
    if (!contents.trim()) {
      Alert.alert('알림', '내용을 입력해주세요.');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('알림', '식사 시간을 선택해주세요.');
      return;
    }

    const ingredientIdByName = new Map<string, string | number>();
    if (Array.isArray(ingredientListData)) {
      ingredientListData.forEach((category: any) => {
        (category?.ingredients ?? []).forEach((ing: any) => {
          ingredientIdByName.set(ing.name, ing.id);
        });
      });
    }

    const mealData = {
      user_hash: user?.view_hash || '',
      contents: contents.trim(),
      category_id: selectedCategory,
      input_date: selectedDate,
      ingredientInput: ingredientInput,
      meal_condition: mealCondition,
      is_public: isPublic,
      child_id: childId,
      meal_stage: mealStage,
      meal_stage_detail: mealStageDetail,
      ingredients: ingredients
        ? ingredients.map((name) => {
            const ingredientId = ingredientIdByName.get(name) ?? name;
            return {
              id: ingredientId,
              name,
              score: ingredientAmounts[name] ?? 0.6,
            };
          })
        : [],
    };

    if (MEAL_STAGE.find(s => s.id === mealStage)?.items.some(i => i.id === mealStageDetail && i.needCode)) {
      if (mealData.ingredients.length === 0) {
        toastInfo('재료를 입력해주세요.');
        return;
      }
    }

    // 이미지가 새로 선택/변경된 경우 FormData 사용
    if (selectedImage && imageChanged) {
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

      Object.entries(mealData).forEach(([key, value]) => {
        if (key === 'ingredients' && Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (value === null || value === undefined) {
          // null/undefined는 전송하지 않음
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
      // 이미지 변경이 없는 경우 - FormData로 보내되 파일 없이
      if (isEditMode) {
        const formData = new FormData();
        // 나머지 데이터 추가
        Object.entries(mealData).forEach(([key, value]) => {
          if (key === 'ingredients' && Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else if (value === null || value === undefined) {
            // null/undefined는 전송하지 않음
          } else {
            formData.append(key, String(value));
          }
        });
        updateMealWithImageMutation.mutate(
          { mealHash: meal.view_hash, formData },
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
            onError: () => {
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
                  <Ionicons name="camera" size={10} color="#FF9AA2" />
                  <Text style={styles.imageButtonText}>촬영</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={handlePickImage}
                >
                  <Ionicons name="images" size={10} color="#FF9AA2" />
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
              placeholder="레시피 또는 기록 하실 내용이 있다면 적어주세요."
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
                      { fontSize: responsiveFontSize },
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

          {/* 식사 단계 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>식사 단계</Text>
            <View style={styles.buttonGroup}>
              {MEAL_STAGE.map((stage) => (
                <TouchableOpacity
                  key={stage.id}
                  style={[styles.toggleButton, mealStage === stage.id && styles.toggleButtonActive]}
                  onPress={() => setMealStage(stage.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.toggleButtonText, { fontSize: responsiveFontSize }, mealStage === stage.id && styles.toggleButtonTextActive]}>
                    {stage.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {/* 식사 단계 end */}

          {/* 식사 단계에 따른 selectbox 노출 */}
          {stageItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>세부 단계 선택</Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                {stageItems.map((item) => {
                  const isSelected = mealStageDetail === item.id;
                  return (
                    <TouchableOpacity
                      key={`${mealStage}_${item.id}`}
                      onPress={() => handelMealStageDetailSelect(item)}
                      activeOpacity={0.8}
                      style={[styles.toggleButton, isSelected && styles.toggleButtonActive]}
                    >
                      <Text style={[styles.toggleButtonText, isSelected && styles.toggleButtonTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* 재료선택(기성품 여부가 N 인 경우)start */}
          {showIngredientInput && (() => {
            const catData = (ingredientListData as any[])?.find(
              (c: any) => c.category === selectedIngredientCategory
            );
            const filtered = selectedIngredientCategory
              ? (catData?.ingredients ?? []).filter(
                  (ing: any) => ingredientSearch === '' || ing.name.includes(ingredientSearch)
                )
              : [];
            return (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Text style={[styles.sectionTitle, styles.sectionTitleCompact]}>재료 선택</Text>
                  <TouchableOpacity
                    style={styles.requestIngredientButton}
                    onPress={handleOpenIngredientRequestModal}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add-circle-outline" size={14} color="#FF6B7A" />
                    <Text style={styles.requestIngredientButtonText}>추가재료 요청</Text>
                  </TouchableOpacity>
                </View>

                {/* 대카테고리 칩 */}
                {Array.isArray(ingredientListData) && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 14 }}
                    contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
                  >
                    {ingredientListData.map((cat: any) => {
                      const isActive = selectedIngredientCategory === cat.category;
                      return (
                        <TouchableOpacity
                          key={cat.category}
                          onPress={() => {
                            setSelectedIngredientCategory(isActive ? null : cat.category);
                            setIngredientSearch('');
                          }}
                          style={[
                            styles.ingredientCatChip,
                            isActive && styles.ingredientCatChipActive,
                          ]}
                        >
                          <Text style={styles.ingredientCatIcon}>
                            {CATEGORY_ICONS[cat.category] ?? '🍴'}
                          </Text>
                          <Text style={[
                            styles.ingredientCatLabel,
                            isActive && styles.ingredientCatLabelActive,
                          ]}>
                            {CATEGORY_LABELS[cat.category] ?? cat.category}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                {/* 재료 검색 + 리스트 */}
                {selectedIngredientCategory && (
                  <View style={styles.ingredientListBox}>
                    {/* 검색 인풋 */}
                    <View style={styles.ingredientSearchRow}>
                      <Ionicons name="search" size={15} color="#FF9AA2" />
                      <TextInput
                        style={styles.ingredientSearchInput}
                        placeholder={`${CATEGORY_LABELS[selectedIngredientCategory] ?? ''} 재료 검색`}
                        placeholderTextColor="#C8C8C8"
                        value={ingredientSearch}
                        onChangeText={setIngredientSearch}
                      />
                      {ingredientSearch.length > 0 && (
                        <TouchableOpacity onPress={() => setIngredientSearch('')}>
                          <Ionicons name="close-circle" size={16} color="#C8C8C8" />
                        </TouchableOpacity>
                      )}
                    </View>
                    {/* 구분선 */}
                    <View style={styles.ingredientListDivider} />
                    {/* 세로 스크롤 목록 */}
                    <ScrollView
                      style={styles.ingredientScrollList}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    >
                      {filtered.length === 0 ? (
                        <View style={styles.ingredientEmptyRow}>
                          <Text style={styles.ingredientEmptyText}>검색 결과가 없습니다.</Text>
                        </View>
                      ) : (
                        filtered.map((ing: any) => {
                          const isSelected = ingredients.includes(ing.name);
                          return (
                            <TouchableOpacity
                              key={ing.id}
                              onPress={() => {
                                if (isSelected) {
                                  setIngredients(ingredients.filter(n => n !== ing.name));
                                  setIngredientAmounts((prev) => {
                                    const next = { ...prev };
                                    delete next[ing.name];
                                    return next;
                                  });
                                } else {
                                  handleOpenIngredientAmountModal(ing.name);
                                }
                              }}
                              style={[
                                styles.ingredientRow,
                                isSelected && styles.ingredientRowSelected,
                              ]}
                              activeOpacity={0.7}
                            >
                              <View style={[
                                styles.ingredientCheckCircle,
                                isSelected && styles.ingredientCheckCircleActive,
                              ]}>
                                {isSelected && (
                                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                                )}
                              </View>
                              <Text style={[
                                styles.ingredientRowText,
                                isSelected && styles.ingredientRowTextSelected,
                              ]}>
                                {ing.name}
                              </Text>
                              {ing.allergy_risk === 'Y' && (
                                <View style={styles.allergyBadge}>
                                  <Text style={styles.allergyBadgeText}>알레르기</Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </ScrollView>
                  </View>
                )}

                {/* 선택된 재료 태그 */}
                {ingredients.length > 0 && (
                  <View style={[styles.tagList, { marginTop: 14 }]}>
                    {ingredients.map((item, index) => (
                      <View key={index} style={[styles.tag, { backgroundColor: getAmountColor(ingredientAmounts[item] ?? 0.6), borderColor: getBorderColor(ingredientAmounts[item] ?? 0.6) }]}>
                        <Text style={styles.tagText}>{item} {getAmountCircles(ingredientAmounts[item] ?? 0.6)}</Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveIngredient(index)}
                          style={styles.tagRemoveButton}
                        >
                          <Ionicons name="close" size={14} color="#FF6B7A" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })()}
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
                <Ionicons name="earth" size={screenWidth < 375 ? 14 : 16} color={isPublic === 'Y' ? '#FFFFFF' : '#999'} />
                <Text style={[styles.toggleButtonText, { fontSize: responsiveFontSize }, isPublic === 'Y' && styles.toggleButtonTextActive]}>
                  공개
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, isPublic === 'N' && styles.toggleButtonActive]}
                onPress={() => setIsPublic('N')}
                activeOpacity={0.7}
              >
                <Ionicons name="lock-closed" size={screenWidth < 375 ? 14 : 16} color={isPublic === 'N' ? '#FFFFFF' : '#999'} />
                <Text style={[styles.toggleButtonText, { fontSize: responsiveFontSize }, isPublic === 'N' && styles.toggleButtonTextActive]}>
                  비공개
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.descriptionText}>
              {isPublic === 'Y' ? '피드 페이지에 전체 공개됩니다' : '마이페이지를 통해서만 확인가능합니다.'}
            </Text>
          </View>
          {/* 공개여부 end */}

          <View style={styles.submitButtonRow}>
            <LinearGradient
              colors={analyzeMealMutation.isPending ? ['#CCC', '#DDD'] : ['#8FD3F4', '#84FAB0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.analyzeButton}
            >
              <TouchableOpacity
                style={styles.analyzeButtonInner}
                onPress={handleAiAnalysis}
                disabled={analyzeMealMutation.isPending}
              >
                {analyzeMealMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.analyzeButtonText}>✨ 영양분석 ✨</Text>
                )}
              </TouchableOpacity>
            </LinearGradient>

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
          </View>
        </ScrollView>

        <Modal
          visible={ingredientAmountModalVisible}
          transparent
          animationType="fade"
          onRequestClose={handleCloseIngredientAmountModal}
        >
          <View style={styles.amountModalOverlay}>
            <View style={styles.amountModalContainer}>
              <Text style={styles.amountModalTitle}>재료 정량 선택</Text>
              <Text style={styles.amountModalDescription}>
                {selectedIngredientNameForAmount ?? ''} 을(를) 얼마나 사용하셨나요?
              </Text>
              <View style={styles.amountButtonRow}>
                {INGREDIENT_AMOUNT_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={[styles.amountButton, { backgroundColor: option.color, borderColor: getBorderColor(option.value) }]}
                    onPress={() => handleSelectIngredientAmount(option.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.amountCircles}>{'●'.repeat(option.circles)}</Text>
                    <Text style={styles.amountButtonText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.amountModalCancelButton}
                onPress={handleCloseIngredientAmountModal}
                activeOpacity={0.8}
              >
                <Text style={styles.amountModalCancelText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={ingredientRequestModalVisible}
          transparent
          animationType="fade"
          onRequestClose={handleCloseIngredientRequestModal}
        >
          <View style={styles.requestModalOverlay}>
            <View style={styles.requestModalContainer}>
              <Text style={styles.requestModalTitle}>추가재료 요청</Text>
              <Text style={styles.requestModalDescription}>주단위 취합 후 추가됩니다.</Text>
              <Text style={styles.requestModalDescription}>여러 재료 추가 시 콤마(,)로 구분해주세요.</Text>

              <TextInput
                style={styles.requestModalInput}
                placeholder="추가하고 싶은 재료명을 입력하세요"
                placeholderTextColor="#BFBFBF"
                value={ingredientRequestText}
                onChangeText={setIngredientRequestText}
                maxLength={40}
              />

              <View style={styles.requestModalButtonRow}>
                <TouchableOpacity
                  style={styles.requestModalCancelButton}
                  onPress={handleCloseIngredientRequestModal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.requestModalCancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.requestModalSubmitButton}
                  onPress={handleSubmitIngredientRequest}
                  activeOpacity={0.8}
                >
                  <Text style={styles.requestModalSubmitText}>등록</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <AiSummaryMealModal
          visible={aiSummaryVisible}
          onClose={() => setAiSummaryVisible(false)}
          totalScore={aiSummaryData?.totalScore ?? 0}
          totalSummary={aiSummaryData?.totalSummary ?? ''}
          suggestions={aiSummaryData?.suggestions ?? []}
        />
        </KeyboardAvoidingView>
      </View>
    </Layout>
  );
}
