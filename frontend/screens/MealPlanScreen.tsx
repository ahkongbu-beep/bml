import React, { useState, useCallback, useEffect, useRef } from 'react';
import styles from './MealPlanScreen.styles';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Header from '../components/Header';
import Layout from '@/components/Layout';
import { LoadingPage } from '../components/Loading';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Dialog, Button, Portal } from 'react-native-paper';
import { useAuth } from '../libs/contexts/AuthContext';
import { useMeals, useDeleteMeal, useUploadCalendarMonthImage, useMonthImage } from '../libs/hooks/useMeals';
import { MealItem } from '../libs/types/MealType';
import { normalizeDate, getStaticImage } from '../libs/utils/common';
import { MEAL_CATEGORIES } from '../libs/utils/codes/MealCalendarCode';
import MealPlanItem from '../components/MealPlanItem';
import MealDetailModal from '../components/MealDetailModal';
import { toastError, toastSuccess, toastInfo } from '@/libs/utils/toast';

// 한국어 설정
LocaleConfig.locales['kr'] = {
  monthNames: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월',
  ],
  monthNamesShort: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월',
  ],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'kr';

export default function MealPlanScreen({ navigation }: any) {
  const [selectedDate, setSelectedDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  // 월별 이미지 경로 캐시 (서버 타이밍과 UI 분리)
  const [isMonthImageUpdating, setIsMonthImageUpdating] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');
  const [isLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [mealToDelete, setMealToDelete] = useState<MealItem | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const deleteMealMutation = useDeleteMeal();
  const uploadMonthImageMutation = useUploadCalendarMonthImage();
  const { user } = useAuth();
  const { data: mealsCalendar, isLoading: mealsLoading, refetch } = useMeals({ month: currentMonth });
  const { data: monthImage, isLoading: monthImageLoading, isFetching: monthImageFetching, refetch: refetchMonthImage } = useMonthImage(currentMonth);

  const today = new Date().toISOString().split('T')[0];
  const allMonthImages: Record<string, string> | null = monthImage?.success ? (monthImage?.data as any) ?? null : null;
  const monthImagePath = allMonthImages?.[currentMonth] ?? null;
  // 최초 로딩(데이터 없음+패칭 중)일 때만 로딩 표시, 백그라운드 리패치 시엔 기존 이미지 유지
  const isLoadingMonthImage = monthImageLoading && monthImageFetching;

  // API 데이터를 정규화된 날짜 키로 변환
  const normalizedMealsData = mealsCalendar?.data?.calendar_list ? Object.keys(mealsCalendar.data.calendar_list).reduce((acc, date) => {
    const normalizedDate = normalizeDate(date);
    acc[normalizedDate] = mealsCalendar.data.calendar_list[date];
    return acc;
  }, {} as Record<string, MealItem[]>) : {};

  // 선택된 날짜의 식단 데이터
  const selectedMeals = selectedDate ? (normalizedMealsData[selectedDate] || []) : [];

  // 마킹된 날짜 (식단이 있는 날)
  const markedDates = Object.keys(normalizedMealsData).reduce((acc, date) => {
    acc[date] = {
      marked: true,
      dotColor: '#FF9AA2',
      selected: date === selectedDate,
      selectedColor: date === selectedDate ? '#FF9AA2' : undefined,
    };
    return acc;
  }, {} as any);

  // 오늘 날짜 마킹
  if (!markedDates[today]) {
    markedDates[today] = {};
  }

  markedDates[today].today = true;
  markedDates[today].todayTextColor = '#FF9AA2';

  const handleEditMeal = (meal: MealItem) => {
    if (meal.refer_feed_id) {
      toastInfo('복사된 식단은 수정할 수 없습니다.');
      return;
    }

    setMenuVisible(null);
    setMenuPosition(null);
    navigation.getParent()?.navigate('MealRegist', { meal, selectedDate });
  };

  const handleDeleteMeal = (meal: MealItem) => {
    setMenuVisible(null);
    setMenuPosition(null);
    setMealToDelete(meal);
    setDeleteDialogVisible(true);
  };

  const confirmDelete = () => {
    if (mealToDelete) {
      deleteMealMutation.mutate(mealToDelete.view_hash, {
        onSuccess: (response) => {
          if (response?.success) {
            toastSuccess('식단이 삭제되었습니다');
            refetch();
          } else {
            toastError('식단 삭제에 실패했습니다');
          }
        },
        onError: (error) => {
          toastError('식단 삭제 중 오류가 발생했습니다.');
        }
      });
    }
    setDeleteDialogVisible(false);
    setMealToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteDialogVisible(false);
    setMealToDelete(null);
  };

  const handleDetailFeed = (feedId: number) => {
    navigation.navigate('FeedDetail', { feedId });
  }

  const handleMealPress = (meal: MealItem) => {
    setSelectedMeal(meal);
    setDetailModalVisible(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedMeal(null);
  };

  const handleEditFromModal = () => {
    if (selectedMeal) {
      setDetailModalVisible(false);
      navigation.getParent()?.navigate('MealRegist', { meal: selectedMeal, selectedDate });
      setSelectedMeal(null);
    }
  };

  const handleDeleteFromModal = () => {
    if (selectedMeal) {
      setDetailModalVisible(false);
      setMealToDelete(selectedMeal);
      setDeleteDialogVisible(true);
      setSelectedMeal(null);
    }
  };

  const handleViewSourceFromModal = () => {
    if (selectedMeal?.refer_feed_id) {
      setDetailModalVisible(false);
      handleDetailFeed(selectedMeal.refer_feed_id);
      setSelectedMeal(null);
    }
  };

  const handleMenuPress = (meal: MealItem, event: any) => {
    if (menuVisible === meal.view_hash) {
      setMenuVisible(null);
      setMenuPosition(null);
    } else {
      event.target.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        setMenuPosition({ x: pageX, y: pageY + height });
        setMenuVisible(meal.view_hash);
      });
    }
  };

  const handlePickMonthImage = async () => {
    try {
      if (uploadMonthImageMutation.isPending) {
        toastInfo('이미지 업로드 중입니다. 잠시만 기다려주세요.');
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }

      const imagePickerAny = ImagePicker as any;
      const mediaTypesOption = imagePickerAny?.MediaType?.Images
        ? [imagePickerAny.MediaType.Images]
        : ['images'];

      const result = await ImagePicker.launchImageLibraryAsync({
        ...(mediaTypesOption ? { mediaTypes: mediaTypesOption } : {}),
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const selectedAsset = result.assets[0];
      const monthSnapshot = currentMonth;
      const fileName = selectedAsset.fileName
        || selectedAsset.uri.split('/').pop()
        || `meal-month-${Date.now()}.jpg`;
      const extMatch = /\.(\w+)$/.exec(fileName);
      const mimeType = extMatch ? `image/${extMatch[1]}` : (selectedAsset.mimeType || 'image/jpeg');

      const buildFormData = () => {
        const formData = new FormData();
        formData.append('month', monthSnapshot);
        formData.append('attaches', { uri: selectedAsset.uri, name: fileName, type: mimeType } as any);
        return formData;
      };

      setIsMonthImageUpdating(true);

      const MAX_ATTEMPTS = 3;
      const requestUpload = (attempt: number) => {
        uploadMonthImageMutation.mutate(buildFormData(), {
          onSuccess: (response) => {
            if (response?.success) {
              setIsMonthImageUpdating(false);
              toastSuccess('월 메인 이미지가 등록되었습니다.');
              refetchMonthImage();
            } else {
              setIsMonthImageUpdating(false);
              toastError((response as any)?.error || '월 메인 이미지 등록에 실패했습니다.');
            }
          },
          onError: (error: unknown) => {
            const message = String(error || '').toLowerCase();
            const isNetworkError = message.includes('network') || message.includes('failed') || message.includes('timeout');
            if (isNetworkError && attempt < MAX_ATTEMPTS - 1) {
              if (attempt === 0) toastInfo('네트워크 불안정으로 업로드를 다시 시도합니다.');
              setTimeout(() => requestUpload(attempt + 1), (attempt + 1) * 800);
              return;
            }
            setIsMonthImageUpdating(false);
            toastError('월 메인 이미지 등록 중 오류가 발생했습니다.');
          },
        });
      };

      requestUpload(0);
    } catch (error) {
      toastError('갤러리를 여는 중 오류가 발생했습니다.');
    }
  };

  // 서버 응답 직접 사용 금지 → 월별 캐시에서 읽기
  if (!mealsCalendar) {
    return <LoadingPage title="식단 정보를 불러오는 중" />;
  }

  return (
    <Layout>
      <View style={styles.container}>
        <Header title="식단 관리" />
        <ScrollView style={styles.content}>
          {/* 메인 이미지 */}
          <View style={styles.monthImageHeader}>
            <Text style={styles.monthImageHeaderText}>{currentMonth.replace('-', '년 ')}월의 식단 이미지</Text>
          </View>

          {isLoadingMonthImage  ? (
            <View style={styles.monthImagePlaceholder}>
              <ActivityIndicator size="large" color="#FF9AA2" />
              <Text style={styles.monthImagePlaceholderText}>이미지 불러오는 중...</Text>
            </View>
          ) : monthImagePath ? (
            <View style={styles.monthImageContainer}>
              <Image
                key={currentMonth}   // 월 바뀌면 무조건 새로 그림
                source={{ uri: getStaticImage('small', monthImagePath) }}
                style={styles.monthImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.monthImageUploadButton}
                onPress={handlePickMonthImage}
                disabled={uploadMonthImageMutation.isPending}
              >
                <Ionicons name="image-outline" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.monthImagePlaceholder}>
              <Ionicons name="image-outline" size={36} color="#D0D0D0" />
              <Text style={styles.monthImagePlaceholderText}>
                이번 달의 식단 이미지를 등록해주세요
              </Text>
              <TouchableOpacity
                style={styles.monthImageRegisterButton}
                onPress={handlePickMonthImage}
                disabled={uploadMonthImageMutation.isPending}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.monthImageRegisterButtonText}>이미지 등록</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 캘린더 */}
          <Calendar
            current={`${currentMonth}-01`}
            markedDates={markedDates}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            onMonthChange={(month) => {
              const next = `${month.year}-${String(month.month).padStart(2, '0')}`;
              if (next !== currentMonth) setCurrentMonth(next);
            }}
            theme={{
              backgroundColor: '#FFFFFF',
              calendarBackground: '#FFFFFF',
              textSectionTitleColor: '#4A4A4A',
              selectedDayBackgroundColor: '#FF9AA2',
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: '#FF9AA2',
              dayTextColor: '#4A4A4A',
              textDisabledColor: '#D0D0D0',
              dotColor: '#FF9AA2',
              selectedDotColor: '#FFFFFF',
              arrowColor: '#FF9AA2',
              monthTextColor: '#4A4A4A',
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 14,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 12,
            }}
            enableSwipeMonths={true}
          />

          {/* 선택된 날짜의 식단 */}
          {selectedDate && (
            <View style={styles.mealsSection}>
              <View style={styles.mealsSectionHeader}>
                <Text style={styles.selectedDateText}>
                  {selectedDate.replace(/-/g, '.')} 식단
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => navigation.getParent()?.navigate('MealRegist', { selectedDate })}
                >
                  <Ionicons name="add-circle" size={24} color="#FF9AA2" />
                  <Text style={styles.addButtonText}>식단 추가</Text>
                </TouchableOpacity>
              </View>

              {isLoading ? (
                <ActivityIndicator size="large" color="#FF9AA2" />
              ) : selectedMeals.length > 0 ? (
                <View style={styles.mealsContainer}>
                  {selectedMeals.map((meal) => (
                    <MealPlanItem
                      key={meal.view_hash}
                      meal={meal}
                      handleMenuPress={handleMenuPress}
                      handleDetailFeed={handleDetailFeed}
                      onPress={handleMealPress}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyMeals}>
                  <Ionicons name="restaurant-outline" size={48} color="#D0D0D0" />
                  <Text style={styles.emptyMealsText}>등록된 식단이 없습니다</Text>
                  <Text style={styles.emptyMealsSubtext}>
                    식단을 추가하여 계획을 세워보세요
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* 안내 메시지 */}
          {!selectedDate && (
            <View style={styles.guideContainer}>
              <Ionicons name="calendar-outline" size={48} color="#FF9AA2" />
              <Text style={styles.guideText}>날짜를 선택하여 식단을 확인하세요</Text>
              <Text style={styles.guideSubtext}>
                점으로 표시된 날짜는 등록된 식단이 있습니다
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* 드롭다운 메뉴 모달 */}
      <Modal
        visible={menuVisible !== null}
        transparent={true}
        animationType="none"
        onRequestClose={() => {
          setMenuVisible(null);
          setMenuPosition(null);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setMenuVisible(null);
            setMenuPosition(null);
          }}
        >
          {menuPosition && menuVisible && (
            <View
              style={[
                styles.dropdownMenuModal,
                {
                  top: menuPosition.y,
                  right: 16,
                }
              ]}
            >
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  const meal = selectedMeals.find(m => m.view_hash === menuVisible);
                  if (meal) handleEditMeal(meal);
                }}
              >
                <Ionicons name="pencil-outline" size={18} color="#4A4A4A" />
                <Text style={styles.menuItemText}>수정</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  const meal = selectedMeals.find(m => m.view_hash === menuVisible);
                  if (meal) handleDeleteMeal(meal);
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                <Text style={[styles.menuItemText, { color: '#FF6B6B' }]}>삭제</Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Modal>

      {/* 삭제 확인 Dialog */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={cancelDelete}>
          <Dialog.Title>식단 삭제</Dialog.Title>
          <Dialog.Content>
            <Text>정말로 이 식단을 삭제하시겠습니까?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={cancelDelete}>취소</Button>
            <Button onPress={confirmDelete} textColor="#FF6B6B">삭제</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* 식단 상세 모달 */}
      {selectedMeal && (
        <MealDetailModal
          visible={detailModalVisible}
          meal={selectedMeal}
          userInfo={user}
          onClose={handleCloseDetailModal}
          onEdit={handleEditFromModal}
          onDelete={handleDeleteFromModal}
          onViewSource={selectedMeal.refer_feed_id ? handleViewSourceFromModal : undefined}
        />
      )}
    </Layout>
  );
}