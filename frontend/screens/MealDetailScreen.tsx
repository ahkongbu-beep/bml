import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDate, getStaticImage, diffMonthsFrom } from '../libs/utils/common';
import { MEAL_CATEGORIES } from '../libs/utils/codes/MealCalendarCode';
import { USER_CHILD_GENDER } from '../libs/utils/codes/UserChildCode';
import { MEAL_CONDITION } from '../libs/utils/codes/FeedMealCondition';
import { MEAL_STAGE } from '../libs/utils/codes/MealState';
import { getAmountColor, getBorderColor } from '../libs/utils/codes/IngredientCode';
import { useDeleteMeal } from '../libs/hooks/useMeals';
import { useAuth } from '../libs/contexts/AuthContext';
import ConfirmPortal from '../components/ConfirmPortal';
import { toastError, toastSuccess, toastInfo } from '@/libs/utils/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MealDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { meal, selectedDate } = route.params as { meal: any; selectedDate?: string };

  const [deleteConfirmVisible, setDeleteConfirmVisible] = React.useState(false);
  const deleteMealMutation = useDeleteMeal();

  const category = MEAL_CATEGORIES.find((c) => c.name === meal?.category_name);

  const condition = MEAL_CONDITION.find(v => v.value === meal?.meal_condition);
  let stage = null;
  let stageDetail = null;
  if (meal?.meal_stage && meal?.meal_stage_detail) {
    stage = MEAL_STAGE.find(v => v.id === meal.meal_stage);
    stageDetail = stage?.items?.find(v => v.id === meal.meal_stage_detail);
  }

  if (!meal) {
    navigation.goBack();
    return null;
  }

  const handleEdit = () => {
    if (meal.refer_feed_id) {
      toastInfo('복사된 식단은 수정할 수 없습니다.');
      return;
    }
    navigation.navigate('MealRegist', { meal, selectedDate });
  };

  const handleDelete = () => {
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = () => {
    deleteMealMutation.mutate(meal.view_hash, {
      onSuccess: (response) => {
        if (response?.success) {
          toastSuccess('식단이 삭제되었습니다');
          navigation.goBack();
        } else {
          toastError('식단 삭제에 실패했습니다');
        }
      },
      onError: () => {
        toastError('식단 삭제 중 오류가 발생했습니다.');
      },
    });
    setDeleteConfirmVisible(false);
  };

  const handleViewSource = () => {
    if (meal.refer_info?.refer_meal_hash && meal.refer_info?.refer_user_hash) {
      navigation.navigate('MealUserDetail', {
        mealHash: meal.refer_info.refer_meal_hash,
        userHash: meal.refer_info.refer_user_hash,
      });
      return;
    }
    toastInfo('원본 식단 정보를 찾을 수 없습니다.');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <LinearGradient
        colors={[category?.color || '#FFE5E5', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryIcon}>{category?.icon || '🍽️'}</Text>
            <Text style={styles.categoryName}>{meal.category_name || ''}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#4A4A4A" />
          </TouchableOpacity>
        </View>
        <Text style={styles.dateText}>📅 {meal.input_date?.replace(/-/g, '.')}</Text>
      </LinearGradient>

      {/* 컨텐츠 */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* 이미지 */}
        {meal.image_url && (
          <View style={styles.imageSection}>
            <Image
              source={{ uri: getStaticImage('large', meal.image_url) }}
              style={styles.detailImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* 아이정보 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={20} color="#FF9AA2" />
            <Text style={styles.sectionTitle}>아이정보</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="calendar-outline" size={18} color="#FF9AA2" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>아이정보</Text>
                <Text style={styles.infoValue}>
                  {meal.childs
                    ? `${diffMonthsFrom(meal.childs.child_birth)}세 · ${USER_CHILD_GENDER[meal.childs.child_gender]}`
                    : '정보 없음'}
                </Text>
                {meal.childs?.allergies?.length > 0 && (
                  <View style={styles.allergyContainer}>
                    <Text style={styles.allergyLabel}>알레르기 </Text>
                    {meal.childs.allergies.map((a: { allergy_code: string; allergy_name: string }) => (
                      <View key={a.allergy_code} style={styles.allergyTag}>
                        <Text style={styles.allergyTagText}>{a.allergy_name}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* 식단 정보 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={20} color="#FF9AA2" />
            <Text style={styles.sectionTitle}>식단 정보</Text>
          </View>

          {!!(meal.meal_stage && meal.meal_stage_detail) && (
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="calendar" size={18} color="#FF9AA2" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>식사 분류</Text>
                  <Text style={styles.infoValue}>{stage?.label || ''} · {stageDetail?.label || ''}</Text>
                </View>
              </View>
            </View>
          )}

          {meal.mapped_tags?.length > 0 && (
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="time-outline" size={18} color="#FF9AA2" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>사용재료</Text>
                  <View style={styles.tagContainer}>
                    {meal.mapped_tags.map((tag: any, index: number) => {
                      const score = parseFloat(tag.mapper_score);
                      const bgColor = getAmountColor(score);
                      const borderColor = getBorderColor(score);
                      return (
                        <View key={index} style={[styles.tag, { backgroundColor: bgColor, borderColor: borderColor }]}>
                          <Text style={[styles.tagText, { color: borderColor }]}>{tag.mapper_name}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>
          )}

          {!!meal.meal_condition && (
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="alert-circle-outline" size={18} color="#FF9AA2" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>식단 상태</Text>
                  <Text style={styles.infoValue}>{condition?.name || ''} {condition?.icon || ''}</Text>
                </View>
              </View>
            </View>
          )}

          {meal.contents && (
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="document-text-outline" size={18} color="#FF9AA2" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>메모</Text>
                  <Text style={styles.infoValue}>{meal.contents}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {meal.refer_feed_id > 0 && (
          <TouchableOpacity style={styles.sourceSection} onPress={handleViewSource}>
            <Ionicons name="copy-outline" size={20} color="#FF9AA2" />
            <Text style={styles.sourceText}>원본 식단 보기</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        )}

        {meal.refer_feed_id > 0 && (
          <View style={styles.referenceSection}>
            <Ionicons name="copy-outline" size={12} color="#BDBDBD" />
            <Text style={styles.referenceText}>
              {meal.refer_info?.refer_user_nickname || ''} 님의 식단
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        {meal.refer_feed_id === 0 && (
          <LinearGradient
            colors={['#FF9AA2', '#FFB7B2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.editButton}
          >
            <TouchableOpacity style={styles.editButtonInner} onPress={handleEdit}>
              <Ionicons name="create-outline" size={22} color="#FFFFFF" />
              <Text style={styles.editButtonText}>수정하기</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
          <Text style={styles.deleteButtonText}>삭제</Text>
        </TouchableOpacity>
      </View>

      <ConfirmPortal
        visible={deleteConfirmVisible}
        title="식단 삭제"
        message="정말로 이 식단을 삭제하시겠습니까?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmVisible(false)}
        confirmText="삭제"
        cancelText="취소"
        confirmColor="#FF6B6B"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 22,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A4A4A',
  },
  closeButton: {
    padding: 4,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imageSection: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  detailImage: {
    width: '100%',
    height: SCREEN_WIDTH - 40,
  },
  section: {
    marginTop: 24,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2D2D2D',
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 14,
    borderRadius: 10,
    gap: 12,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#868E96',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sourceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 10,
  },
  sourceText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  referenceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  referenceText: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  editButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#FF9AA2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  editButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F0',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#FFD4D4',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  allergyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  allergyLabel: {
    fontSize: 11,
    color: '#868E96',
  },
  allergyTag: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  allergyTagText: {
    fontSize: 11,
    color: '#F57F17',
    fontWeight: '600',
  },
});
