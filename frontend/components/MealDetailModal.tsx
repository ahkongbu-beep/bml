import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getStaticImage, diffMonthsFrom } from '../libs/utils/common';
import { MEAL_CATEGORIES } from '../libs/utils/codes/MealCalendarCode';
import { USER_CHILD_GENDER } from '../libs/utils/codes/UserChildCode';
import { MEAL_CONDITION } from '../libs/utils/codes/FeedMealCondition';
import { MEAL_STAGE } from '../libs/utils/codes/MealState';
import { getAmountColor, getBorderColor } from '../libs/utils/codes/IngredientCode';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MealDetailModalProps {
  visible: boolean;
  meal: any;
  userInfo: any;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewSource?: () => void;
}

const MealDetailModal: React.FC<MealDetailModalProps> = ({
  visible,
  meal,
  userInfo,
  onClose,
  onEdit,
  onDelete,
  onViewSource,
}) => {
  const category = MEAL_CATEGORIES.find((c) => c.name === meal?.category_name);

  if (!meal) return null;

  // 식단 상태 매핑
  const condition = MEAL_CONDITION.find(v => v.value === meal.meal_condition);
  let stage = null;
  let stageDetail = null;
  if (meal.meal_stage && meal.meal_stage_detail) {
    stage = MEAL_STAGE.find(v => v.id === meal.meal_stage);
    stageDetail = stage.items.find(v => v.id === meal.meal_stage_detail);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* 헤더 */}
          <LinearGradient
            colors={[category?.color || '#FFE5E5', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.3 }}
            style={styles.modalHeader}
          >
            <View style={styles.headerTop}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryIcon}>{category?.icon || '🍽️'}</Text>
                <Text style={styles.categoryName}>{meal.category_name || ''}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#4A4A4A" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDate}>📅 {meal.input_date?.replace(/-/g, '.')}</Text>
          </LinearGradient>

          {/* 컨텐츠 */}
          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
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

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="calendar" size={18} color="#FF9AA2" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>월</Text>
                    <Text style={styles.infoValue}>{meal.month || ''} · {meal.contents || ''}</Text>
                  </View>
                </View>
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

              {meal.refer_feed_id > 0 && (
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="copy-outline" size={18} color="#FF9AA2" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>출처</Text>
                      <Text style={styles.infoValue}>{meal.refer_info?.refer_user_nickname || ''} 님의 식단</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* 출처 */}
            <View style={styles.infoGrid}>
              {meal.refer_feed_id > 0 && onViewSource && (
                <TouchableOpacity
                  style={styles.sourceSection}
                  onPress={onViewSource}
                >
                  <Ionicons name="copy-outline" size={20} color="#FF9AA2" />
                  <Text style={styles.sourceText}>원본 식단 보기</Text>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* 하단 버튼 */}
          <View style={styles.modalFooter}>

            {onEdit && meal && meal.refer_feed_id === 0 && (
              <LinearGradient
                colors={['#FF9AA2', '#FFB7B2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.editButton}
              >
                <TouchableOpacity
                  style={styles.editButtonInner}
                  onPress={onEdit}
                >
                  <Ionicons name="create-outline" size={22} color="#FFFFFF" />
                  <Text style={styles.editButtonText}>수정하기</Text>
                </TouchableOpacity>
              </LinearGradient>
            )}

            {onDelete && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={onDelete}
              >
                <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
                <Text style={styles.deleteButtonText}>삭제</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  modalDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
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
  firstSection: {
    marginTop: 16,
    paddingTop: 4,
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2D2D2D',
    lineHeight: 32,
  },
  userSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E9ECEF',
  },
  userAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 2,
  },
  userLabel: {
    fontSize: 13,
    color: '#868E96',
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
  contents: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 26,
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
  tagCircles: {
    fontSize: 12,
    fontWeight: '700',
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
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 48,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
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

export default MealDetailModal;
