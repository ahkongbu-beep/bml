/*
 * 타인의 피드를 내 식단 캘린더로 복사하는 화면
 * 타인의 피드를 조회하고, 해당 피드의 식단을 내 캘린더에 복사할 수 있다.
 * 수정은 제목, 메모만 가능하며 이미지는 수정 불가
 * 식사 시간과 날짜는 내가 직접 선택가능
 */

import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import Header from '../components/Header';
import Layout from '@/components/Layout';
import { useAuth } from '../libs/contexts/AuthContext';
import { MEAL_CATEGORIES } from '../libs/utils/codes/MealCalendarCode';
import { useCategoryCodes } from '../libs/hooks/useCategories';
import { getToday } from '../libs/utils/common';
import { useFeed, useCopyFeed } from '../libs/hooks/useFeeds';
import { LoadingPage } from '../components/Loading';
import styles from './MealCopyByFeedScreen.styles';

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

export default function MealCopyByFeedScreen({ route, navigation }: any) {
  const { feedId, userHash } = route.params || {};
  const { user } = useAuth();
  const { data: categoryCodes } = useCategoryCodes('MEALS_GROUP');

  // TODO: feedId와 userHash를 사용하여 피드 상세 정보 조회
  const { data: feed, isLoading: isFeedLoading } = useFeed(feedId);

  // 복사 mutation
  const copyFeedMutation = useCopyFeed();

  const [memo, setMemo] = useState('');
  const [feedHash, setFeedHash] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(getToday('YYYY-MM-DD'));
  const [showCalendar, setShowCalendar] = useState(false);

  // 피드 정보로 초기값 설정
  useEffect(() => {
    if (feed) {
      setMemo(feed.content || '');
      setFeedHash(feed.feed_hash || '');
    }
  }, [feed]);

  const handleCopyFeed = async () => {
    if (!selectedCategory) {
      Alert.alert('알림', '식사 시간을 선택해주세요.');
      return;
    }
    if (!selectedDate) {
      Alert.alert('알림', '날짜를 선택해주세요.');
      return;
    }

    const copyData = {
      targetFeedId: feedId,
      targetUserHash: userHash,
      memo: memo.trim(),
      categoryCode: selectedCategory,
      inputDate: selectedDate,
    };

    copyFeedMutation.mutate(copyData, {
      onSuccess: (response) => {
        if (response.success) {
          Alert.alert('성공', '식단이 복사되었습니다.', [
            {
              text: '확인',
              onPress: () => navigation.goBack(),
            },
          ]);
        } else {
          Alert.alert('오류', response.error || '식단 복사에 실패했습니다.');
        }
      },
      onError: (error) => {
        console.error('식단 복사 오류:', error);
        Alert.alert('오류', '식단 복사 중 오류가 발생했습니다.');
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
            {feed?.images && feed.images.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>원본 이미지</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imageScroll}
                >
                  {feed.images.map((imageUri: string, index: number) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image source={{ uri: imageUri }} style={styles.previewImage} />
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

            {/* 메모 입력 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>메모</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="추가 메모를 입력하세요 (선택사항)"
                value={memo}
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
      </View>
    </Layout>
  );
}