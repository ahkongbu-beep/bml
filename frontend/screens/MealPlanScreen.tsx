import React, { useState, useCallback } from 'react';
import styles from './MealPlanScreen.styles';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Dialog, Button, Portal } from 'react-native-paper';
import Header from '../components/Header';
import Layout from '@/components/Layout';
import { useAuth } from '../libs/contexts/AuthContext';
import { useMeals, useDeleteMeal } from '../libs/hooks/useMeals';
import { MealItem } from '../libs/types/MealType';
import { normalizeDate } from '../libs/utils/common';
import { MEAL_CATEGORIES } from '../libs/utils/codes/MealCalendarCode';
import MealPlanItem from '../components/MealPlanItem';

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
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');
  const [isLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [mealToDelete, setMealToDelete] = useState<MealItem | null>(null);
  const deleteMealMutation = useDeleteMeal();
  const { user } = useAuth();

  const { data: mealsCalendar, isLoading: mealsLoading, refetch } = useMeals({ month: new Date().toISOString().slice(0, 7) });

  // 화면이 포커스될 때마다 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const today = new Date().toISOString().split('T')[0];

  // API 데이터를 정규화된 날짜 키로 변환
  const normalizedMealsData = mealsCalendar?.data ? Object.keys(mealsCalendar.data).reduce((acc, date) => {
    const normalizedDate = normalizeDate(date);
    acc[normalizedDate] = mealsCalendar.data[date];
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
      const result = deleteMealMutation.mutate(mealToDelete.view_hash);
      if (result.success === true) {
        Alert.alert('식단이 삭제되었습니다.');
      }
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

  return (
    <Layout>
      <View style={styles.container}>
        <Header title="식단 관리" />
        <ScrollView style={styles.content}>
          {/* 캘린더 */}
          <Calendar
            current={today}
            markedDates={markedDates}
            onDayPress={(day) => setSelectedDate(day.dateString)}
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
    </Layout>
  );
}