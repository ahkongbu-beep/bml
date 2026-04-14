/*
 * 타인의 피드를 내 식단 캘린더로 복사하는 화면
 * 타인의 피드를 조회하고, 해당 피드의 식단을 내 캘린더에 복사할 수 있다.
 * 수정은 제목, 메모만 가능하며 이미지는 수정 불가
 * 식사 시간과 날짜는 내가 직접 선택가능
 */

import React, { useState, useEffect } from 'react';
import '@/libs/utils/calendarLocale';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import Header from '../components/Header';
import Layout from '@/components/Layout';
import { useAuth } from '../libs/contexts/AuthContext';
import { MEAL_CATEGORIES } from '../libs/utils/codes/MealCalendarCode';
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  INGREDIENT_AMOUNT_OPTIONS,
  getAmountCircles,
  getAmountColor,
  getBorderColor,
} from '../libs/utils/codes/IngredientCode';
import { useCategoryCodes } from '../libs/hooks/useCategories';
import { getToday, getStaticImage } from '../libs/utils/common';
import { useFeed, useCopyFeed, useIngredientList } from '../libs/hooks/useFeeds';
import { LoadingPage } from '../components/Loading';
import { toastError, toastInfo, toastSuccess } from '@/libs/utils/toast';
import styles from '../styles/screens/MealCopyByFeedScreen.styles';

export default function MealCopyByFeedScreen({ route, navigation }: any) {
  const { mealId, mealHash, userHash } = route.params || {};
  const { user } = useAuth();
  const { data: categoryCodes } = useCategoryCodes('MEALS_GROUP');

  // TODO: mealHash와 userHash를 사용하여 피드 상세 정보 조회
  const { data: mealData, isLoading: isFeedLoading } = useFeed(mealHash, userHash);
  const { data: ingredientListData, isLoading: ingredientListLoading } = useIngredientList('');

  // 복사 mutation
  const copyFeedMutation = useCopyFeed();

  const [memo, setMemo] = useState('');
  const [feedHash, setFeedHash] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(getToday('YYYY-MM-DD'));
  const [showCalendar, setShowCalendar] = useState(false);

  // 재료 관련 상태
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientAmounts, setIngredientAmounts] = useState<Record<string, number>>({});
  const [ingredientAmountModalVisible, setIngredientAmountModalVisible] = useState(false);
  const [selectedIngredientNameForAmount, setSelectedIngredientNameForAmount] = useState<string | null>(null);
  const [selectedIngredientCategory, setSelectedIngredientCategory] = useState<string | null>(null);
  const [ingredientSearch, setIngredientSearch] = useState('');

  // 피드 정보로 초기값 설정
  useEffect(() => {
    if (mealData) {
      setFeedHash(mealData.feed_hash || '');

      // tags에서 재료 미리 선택
      if (Array.isArray(mealData.tags) && mealData.tags.length > 0) {
        const names = mealData.tags.map((t: any) => t.mapped_tags).filter(Boolean);
        const amounts: Record<string, number> = {};
        mealData.tags.forEach((t: any) => {
          if (t.mapped_tags) {
            amounts[t.mapped_tags] = parseFloat(t.mapped_score) || 0.6;
          }
        });
        setIngredients(names);
        setIngredientAmounts(amounts);
      }
    }
  }, [mealData]);

  const handleRemoveIngredient = (index: number) => {
    const target = ingredients[index];
    setIngredients(ingredients.filter((_, i) => i !== index));
    if (target) {
      setIngredientAmounts((prev) => {
        const next = { ...prev };
        delete next[target];
        return next;
      });
    }
  };

  const handleOpenIngredientAmountModal = (ingredientName: string) => {
    setSelectedIngredientNameForAmount(ingredientName);
    setIngredientAmountModalVisible(true);
  };

  const handleSelectIngredientAmount = (amountValue: number) => {
    if (!selectedIngredientNameForAmount) return;
    const ingredientName = selectedIngredientNameForAmount;
    if (!ingredients.includes(ingredientName)) {
      setIngredients((prev) => [...prev, ingredientName]);
    }
    setIngredientAmounts((prev) => ({ ...prev, [ingredientName]: amountValue }));
    setIngredientAmountModalVisible(false);
    setSelectedIngredientNameForAmount(null);
  };

  const handleCloseIngredientAmountModal = () => {
    setIngredientAmountModalVisible(false);
    setSelectedIngredientNameForAmount(null);
  };

  const handleCopyFeed = async () => {
    if (!selectedCategory) {
      toastInfo('식사 시간을 선택해주세요.');
      return;
    }
    if (!selectedDate) {
      toastInfo('식사 날짜를 선택해주세요.');
      return;
    }

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
        if (!ingredientId) return null;
        return { id: ingredientId, name, score: ingredientAmounts[name] ?? 0.6 };
      })
      .filter((item): item is { id: number; name: string; score: number } => item !== null);

    const copyData = {
      targetMealId: mealId,
      targetUserHash: userHash,
      memo: memo.trim(),
      categoryCode: selectedCategory,
      inputDate: selectedDate,
      title: '',
      ingredients: ingredientList,
    };

    copyFeedMutation.mutate(copyData, {
      onSuccess: (response) => {
        if (response.success) {
          toastSuccess('식단이 복사되었습니다.', {
            onPress: () => navigation.goBack(),
            onHide: () => navigation.goBack(),
          });
        } else {
          toastError(response.error || '식단 복사에 실패했습니다.');
        }
      },
      onError: (error) => {
        toastError('식단 복사 중 오류가 발생했습니다.');
      },
    });
  };

  const markedDates = {
    [selectedDate]: {
      selected: true,
      selectedColor: '#FF9AA2',
    },
    [getToday('YYYY-MM-DD')]: {
      today: true,
      todayTextColor: '#FF9AA2',
    },
  };

  if (isFeedLoading) {
    return (
      <LoadingPage title="피드정보를 조회하는 중입니다." />
    );
  }

  return (
    <Layout>
      <View style={styles.container}>
        <Header
          title="식단 복사하기"
          leftButton={{
            icon: 'arrow-back',
            onPress: () => navigation.goBack(),
          }}
          rightButton={{
            text: '완료',
            onPress: handleCopyFeed,
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
            {/* 원본 피드 이미지 미리보기 */}
            {mealData?.images && mealData.images.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>원본 이미지</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imageScroll}
                >
                  {mealData.images.map((imageUri: string, index: number) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image source={{ uri: getStaticImage("small", imageUri) }} style={styles.previewImage} />
                      <View style={styles.imageOverlay}>
                        <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                        <Text style={styles.imageOverlayText}>수정 불가</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
                <Text style={styles.helperText}>
                  * 이미지는 원본 그대로 복사되며 수정할 수 없습니다.
                </Text>
              </View>
            )}

            {/* 날짜 선택 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>날짜 선택 *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowCalendar(!showCalendar)}
              >
                <Ionicons name="calendar" size={20} color="#FF9AA2" />
                <Text style={styles.dateButtonText}>
                  {selectedDate.replace(/-/g, '.')}
                </Text>
                <Ionicons
                  name={showCalendar ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#7A7A7A"
                />
              </TouchableOpacity>

              {showCalendar && (
                <View style={styles.calendarContainer}>
                  <Calendar
                    current={selectedDate}
                    onDayPress={(day) => {
                      setSelectedDate(day.dateString);
                      setShowCalendar(false);
                    }}
                    markedDates={markedDates}
                    theme={{
                      selectedDayBackgroundColor: '#FF9AA2',
                      todayTextColor: '#FF9AA2',
                      arrowColor: '#FF9AA2',
                    }}
                  />
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
                {categoryCodes?.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category.id && styles.categoryButtonActive,
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Text style={styles.categoryIcon}>
                      {MEAL_CATEGORIES.find((c) => c.name === category.value)?.icon}
                    </Text>
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

            {/* 재료 선택 */}
            {(() => {
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
                  <Text style={styles.sectionTitle}>재료 선택 (선택사항)</Text>

                  {/* 대카테고리 칩 */}
                  {Array.isArray(ingredientListData) && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: 14 }}
                      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
                    >
                      {(ingredientListData as any[]).map((cat: any) => {
                        const isActive = selectedIngredientCategory === cat.category;
                        return (
                          <TouchableOpacity
                            key={cat.category}
                            onPress={() => {
                              setSelectedIngredientCategory(isActive ? null : cat.category);
                              setIngredientSearch('');
                            }}
                            style={[styles.ingredientCatChip, isActive && styles.ingredientCatChipActive]}
                          >
                            <Text style={styles.ingredientCatIcon}>
                              {CATEGORY_ICONS[cat.category] ?? '🍴'}
                            </Text>
                            <Text style={[styles.ingredientCatLabel, isActive && styles.ingredientCatLabelActive]}>
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
                      <View style={styles.ingredientListDivider} />
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
                                    setIngredients(ingredients.filter((n) => n !== ing.name));
                                    setIngredientAmounts((prev) => {
                                      const next = { ...prev };
                                      delete next[ing.name];
                                      return next;
                                    });
                                  } else {
                                    handleOpenIngredientAmountModal(ing.name);
                                  }
                                }}
                                style={[styles.ingredientRow, isSelected && styles.ingredientRowSelected]}
                                activeOpacity={0.7}
                              >
                                <View style={[styles.ingredientCheckCircle, isSelected && styles.ingredientCheckCircleActive]}>
                                  {isSelected && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                                </View>
                                <Text style={[styles.ingredientRowText, isSelected && styles.ingredientRowTextSelected]}>
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
                    <View style={styles.tagList}>
                      {ingredients.map((item, index) => (
                        <View key={index} style={[styles.tag, { backgroundColor: getAmountColor(ingredientAmounts[item] ?? 0.6), borderColor: getBorderColor(ingredientAmounts[item] ?? 0.6) }]}>
                          <Text style={styles.tagText}>{item} {getAmountCircles(ingredientAmounts[item] ?? 0.6)}</Text>
                          <TouchableOpacity onPress={() => handleRemoveIngredient(index)} style={styles.tagRemoveButton}>
                            <Ionicons name="close" size={14} color="#FF6B7A" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })()}

            {/* 메모 입력 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>메모</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="추가 메모를 입력하세요 (선택사항)"
                onChangeText={setMemo}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={300}
              />
              <Text style={styles.charCount}>{memo.length}/300</Text>
            </View>

            {/* 안내 메시지 */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#FF9AA2" />
              <Text style={styles.infoText}>
                원본 피드의 이미지와 내용이 복사됩니다.{'\n'}
                제목과 메모는 자유롭게 수정할 수 있습니다.
              </Text>
            </View>

            {/* 복사 버튼 */}
            <TouchableOpacity
              style={[styles.submitButton, copyFeedMutation.isPending && styles.submitButtonDisabled]}
              onPress={handleCopyFeed}
              disabled={copyFeedMutation.isPending}
            >
              {copyFeedMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="copy" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>식단 복사하기</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* 재료 정량 모달 */}
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
                    key={option.value}
                    style={[styles.amountButton, { borderColor: getAmountColor(option.value) }]}
                    onPress={() => handleSelectIngredientAmount(option.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.amountButtonCircles}>{getAmountCircles(option.value)}</Text>
                    <Text style={styles.amountButtonLabel}>{option.label}</Text>
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
      </View>
    </Layout>
  );
}