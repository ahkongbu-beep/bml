import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import Layout from '@/components/Layout';
import { useAuth } from '../libs/contexts/AuthContext';
import { useMeals } from '../libs/hooks/useMeals';
import { MealItem } from '../libs/types/MealType';
import { normalizeDate } from '../libs/utils/common';
import { MEAL_CATEGORIES } from '../libs/utils/codes/MealCalendarCode';

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
  const { user } = useAuth();

  const { data: mealsCalendar, isLoading: mealsLoading } = useMeals({ user_hash: user?.view_hash, month: new Date().toISOString().slice(0, 7) });

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

  const renderMealItem = (meal: MealItem) => {
    const category = MEAL_CATEGORIES.find((c) => c.name === meal.category_name);

    return (
      <View
        key={meal.view_hash}
        style={[styles.mealCard, { backgroundColor: category?.color || '#F5F5F5' }]}
      >
        <View style={styles.mealHeader}>
          <View style={styles.mealCategory}>
            <Text style={styles.mealIcon}>{category?.icon}</Text>
            <Text style={styles.mealCategoryName}>{meal.category_name}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        <Text style={styles.mealTitle}>{meal.title}</Text>
        <Text style={styles.mealContents}>{meal.contents}</Text>
        {meal.tags.length > 0 && (
          <View style={styles.mealTags}>
            {meal.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Layout>
      <View style={styles.container}>
        <Header title="식단 관리" />

        {/* 주/월 전환 버튼 - TODO: 기능 구현 필요 */}
        {/* <View style={styles.viewModeContainer}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'week' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('week')}
          >
            <Text
              style={[
                styles.viewModeText,
                viewMode === 'week' && styles.viewModeTextActive,
              ]}
            >
              주간
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'month' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('month')}
          >
            <Text
              style={[
                styles.viewModeText,
                viewMode === 'month' && styles.viewModeTextActive,
              ]}
            >
              월간
            </Text>
          </TouchableOpacity>
        </View> */}

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
                  onPress={() => navigation.navigate('MealRegist', { selectedDate })}
                >
                  <Ionicons name="add-circle" size={24} color="#FF9AA2" />
                  <Text style={styles.addButtonText}>식단 추가</Text>
                </TouchableOpacity>
              </View>

              {isLoading ? (
                <ActivityIndicator size="large" color="#FF9AA2" />
              ) : selectedMeals.length > 0 ? (
                <View style={styles.mealsContainer}>
                  {selectedMeals.map((meal) => renderMealItem(meal))}
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
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF7',
  },
  content: {
    flex: 1,
  },
  viewModeContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE5E5',
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: '#FF9AA2',
    borderColor: '#FF9AA2',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  viewModeTextActive: {
    color: '#FFFFFF',
  },
  mealsSection: {
    padding: 16,
  },
  mealsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A4A4A',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9AA2',
  },
  mealsContainer: {
    gap: 12,
  },
  mealCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealIcon: {
    fontSize: 20,
  },
  mealCategoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A4A4A',
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 4,
  },
  mealContents: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  mealTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#666666',
  },
  emptyMeals: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyMealsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    marginTop: 12,
  },
  emptyMealsSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
  guideContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  guideText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    marginTop: 16,
    textAlign: 'center',
  },
  guideSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
});
