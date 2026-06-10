import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MEAL_STAGE } from '../libs/utils/codes/MealState';
/* 상수 및 유틸리티 함수 정의 */
import { Feed, FeedItemProps } from '../libs/types/FeedType';
import { formatDate, diffMonthsFrom, getStaticImage } from '@/libs/utils/common';
import { USER_CHILD_GENDER, USER_CHILD_GENDER_COLOR } from '../libs/utils/codes/UserChildCode';
import { getAmountColor, getBorderColor } from '../libs/utils/codes/IngredientCode';
import { toggleScrap } from '../libs/api/feedsApi';
import { copyMealToMyCalendar } from '../libs/api/mealsApi';
import { useAuth } from '../libs/contexts/AuthContext';
import { toastSuccess, toastError, toastInfo } from '../libs/utils/toast';

const { width } = Dimensions.get('window');

const MealItem = React.memo(({
  item,
  menuVisible,
  currentImageIndex,
  isLiking,
  onMenuToggle,
  onViewProfile,
  onBlock,
  onLike,
  onCommentPress,
  onAiSummary,
  userHash,
  isMine,
  onEditFeed,
  onTagPress,
  selectedTags = [],
  isAnalyzing = false,
}: FeedItemProps) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // URL에서 iid 추출하는 함수
  const extractImageId = (imageUrl: string): string => {
    const match = imageUrl.match(/[?&]iid=(\d+)/);
    return match ? match[1] : '';
  };

  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const menuButtonRef = useRef<TouchableOpacity>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 130, right: 10 });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCopyToCalendarModal, setShowCopyToCalendarModal] = useState(false);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [selectedCopyDate, setSelectedCopyDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [isCopyingToCalendar, setIsCopyingToCalendar] = useState(false);
  const [isScrap, setIsScrap] = useState(item.is_scrap ?? false);
  const myChildren = user?.user_childs ?? [];

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  useEffect(() => {
    if (!showCopyToCalendarModal) {
      return;
    }

    if (myChildren.length === 0) {
      setSelectedChildId(null);
      return;
    }

    setSelectedChildId((prev) => {
      if (prev && myChildren.some((child: any) => child.id === prev)) {
        return prev;
      }
      return myChildren[0].id;
    });
  }, [showCopyToCalendarModal, myChildren]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const shimmerScale = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.1, 1],
  });

  const handleMenuToggle = () => {
    if (menuButtonRef.current) {
      menuButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setMenuPosition({
          top: pageY + height - 3,
          right: Dimensions.get('window').width - pageX - width,
        });
        onMenuToggle(item.id);
      });
    } else {
      onMenuToggle(item.id);
    }
  };

  const allergy_info = item.childs?.allergies.map((allergy: any) => {
    return allergy.allergy_name;
  }) || [];

  const openCopyToCalendarModal = () => {
    setShowSaveModal(false);

    if (myChildren.length === 0) {
      toastInfo('자녀 정보를 먼저 등록해주세요.');
      return;
    }

    setSelectedCopyDate(new Date().toISOString().split('T')[0]);
    setShowCalendarPicker(false);
    setShowCopyToCalendarModal(true);
  };

  const handleCopyToCalendar = async () => {
    if (!selectedChildId) {
      toastInfo('자녀를 선택해주세요.');
      return;
    }

    try {
      setIsCopyingToCalendar(true);
      const response = await copyMealToMyCalendar(item.view_hash, {
        child_id: selectedChildId,
        input_date: selectedCopyDate,
      });

      if (!response?.success) {
        setShowCopyToCalendarModal(false);
        setTimeout(() => toastError(response?.error || '캘린더 저장에 실패했어요.'), 300);
        return;
      }

      setShowCopyToCalendarModal(false);
      setTimeout(() => toastSuccess('내 식단 캘린더에 추가했어요.'), 300);
    } catch {
      setShowCopyToCalendarModal(false);
      setTimeout(() => toastError('캘린더 저장에 실패했어요.'), 300);
    } finally {
      setIsCopyingToCalendar(false);
    }
  };

  // 태그 스코어에 따른 정렬
  const sortMapperTags = (tags: any[]) => {
    return tags.sort((a, b) => parseFloat(b.mapper_score) - parseFloat(a.mapper_score));
  }

  return (
    <View style={styles.feedContainer}>
      {/* 사용자 정보 */}
      <View style={styles.userHeader}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => onViewProfile(item.user.user_hash || '')}
        >
          <Image
            source={{ uri: getStaticImage('thumbnail', item.user.profile_image) }}
            style={styles.profileImage}
          />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
            <Text style={styles.nickname}>{item.user.nickname}</Text>
            {item.childs && (
              <View style={styles.childMetaRow}>
                <Text style={styles.timestamp}>{diffMonthsFrom(item.childs.child_birth)}개월</Text>
                <View
                  style={[
                    styles.genderLabel,
                    { borderColor: USER_CHILD_GENDER_COLOR[item.childs.child_gender] },
                  ]}
                >
                  <Text
                    style={[
                      styles.genderLabelText,
                      { color: USER_CHILD_GENDER_COLOR[item.childs.child_gender] },
                    ]}
                  >
                    {USER_CHILD_GENDER[item.childs.child_gender]}
                  </Text>
                </View>
              </View>
            )}
          </View>
          {allergy_info.length > 0 && (
            <View style={styles.allergiesContainer}>
              {allergy_info.map((allergyName, index) => (
                <View key={index} style={styles.allergyBadge}>
                  <View style={styles.allergyBadgeDiagonal} pointerEvents="none" />
                  <Text style={styles.allergyBadgeText}>{allergyName}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={styles.categoryLabel}>
          <Text style={styles.categoryLabelText}>{item.category_name}</Text>
        </View>
      </View>

      {/* 피드 이미지 */}
      {!!item.image_url ? (
        <View style={styles.imageCarouselContainer}>
          <Image
            key={`${item.id}-image-${extractImageId(item.image_url) || 0}`}
            source={{ uri: getStaticImage('medium', item.image_url) }}
            style={styles.feedImage}
          />
          {!!item.refer_feed_id && (
            <View style={styles.referredOverlay}>
              <Ionicons name="link" size={14} color="#FFFFFF" />
              <Text style={styles.referredOverlayText}>참조됨</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.feedImage, styles.noImageContainer]}>
          <Text style={styles.noImageTitle}>{item.title}</Text>
        </View>
      )}

      {/* 내용 */}
      <View style={styles.contentContainer}>
        {/* 주 식재료 */}
        <View style={styles.tagsSection}>
          {/* 주 식재료가 없는 경우 meal_stage_detail 을 넣어줌 */}
          {item.mapped_tags && sortMapperTags(item.mapped_tags).length === 0 && (
            <View style={[styles.tag, { backgroundColor: '#FFF5F0', borderColor: '#FFCDB2', borderStyle: 'dashed' }]}>
              <Ionicons name="restaurant-outline" size={12} color="#E88B6A" />
              <Text style={[styles.tagText, { color: '#E88B6A' }]}>{(MEAL_STAGE.find(stage => stage.id === item.meal_stage)?.items.find(detail => detail.id === item.meal_stage_detail)?.label || '기타').replace(/\n/g, ' ')}</Text>
            </View>
          )}

          {sortMapperTags(item.mapped_tags).length > 0 && sortMapperTags(item.mapped_tags).map((tag, idx) => {
            const score = parseFloat(tag.mapper_score);
            const bgColor = getAmountColor(score);
            const borderColor = getBorderColor(score);
            const isSelected = selectedTags.includes(tag.mapper_name);

            return (
              <TouchableOpacity
                key={`${item.id}-tag-${idx}-${tag.mapper_name}`}
                style={[
                  styles.tag,
                  {
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                  },
                  isSelected && styles.tagActive
                ]}
                onPress={() => onTagPress?.(tag.mapper_name)}
              >
                <Text style={[styles.tagText, { color: borderColor }, isSelected && styles.tagTextActive]}>{tag.mapper_name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.content}>
          {(item.contents || '').replace(/\n+/g, ' ').trim()}
        </Text>
      </View>

      {/* 액션 버튼 */}
      <View style={styles.actions}>
        {/* 좋아요 버튼 */}
        <TouchableOpacity
          onPress={() => onLike(item.view_hash)}
          style={styles.actionButton}
        >
          <Ionicons
            name={item.is_liked ? 'heart' : 'heart-outline'}
            size={14}
            color="#FF9AA2"
          />
          <Text style={styles.actionButtonText}>도움이 되었어요</Text>
          <Text style={styles.actionButtonCount}>{item.like_count || 0}</Text>
        </TouchableOpacity>

        {/* 댓글 버튼 */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onCommentPress(item.id, item.image_url)}
        >
          <Ionicons name="chatbubble-outline" size={14} color="#FF9AA2" />
          <Text style={styles.actionButtonText}>댓글 {item.comment_count > 0 ? `+${item.comment_count}` : ''}</Text>
        </TouchableOpacity>
      </View>

      {/* 액션 버튼 */}
      <View style={styles.actionButtonsContainer}>
        {onAiSummary && userHash && (
          <TouchableOpacity
            style={[styles.bottomActionButton, isAnalyzing && styles.bottomActionButtonDisabled]}
            disabled={isAnalyzing}
            onPress={() => {
              onAiSummary(
                item.user.user_hash,
                item.category_id,
                item.input_date,
                item.child_id,
                item.meal_stage,
                item.meal_stage_detail,
                item.contents,
                item.mapped_tags,
                item.image_url
              );
            }}
          >
            {isAnalyzing ? (
              <ActivityIndicator size={16} color="#FF9AA2" />
            ) : (
              <Ionicons name="sparkles" size={18} color="#FF9AA2" />
            )}
            <Text style={styles.bottomActionButtonText}>
              {isAnalyzing ? '분석 중...' : '영양분석'}
            </Text>
          </TouchableOpacity>
        )}
        {/* 내 피드가 아닐 때 식단 공유버튼 노출 */}
        {!isMine && (
          <TouchableOpacity
            style={styles.bottomActionButton}
            onPress={() => setShowSaveModal(true)}
          >
            <Ionicons name="calendar-outline" size={18} color="#FF9AA2" />
            <Text style={styles.bottomActionButtonText}>식단 저장하기</Text>
          </TouchableOpacity>
        )}

        {/* 저장 방식 선택 모달 */}
        <Modal
          visible={showSaveModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSaveModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowSaveModal(false)}>
            <View style={styles.saveModalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.saveModalContainer}>
                  <Text style={styles.saveModalTitle}>저장 방식 선택</Text>
                  <TouchableOpacity
                    style={styles.saveModalOption}
                    onPress={openCopyToCalendarModal}
                  >
                    <Ionicons name="calendar-outline" size={22} color="#FF9AA2" />
                    <View style={styles.saveModalOptionText}>
                      <Text style={styles.saveModalOptionTitle}>캘린더</Text>
                      <Text style={styles.saveModalOptionDesc}>내 식단 캘린더에 추가해요</Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.saveModalDivider} />
                  <TouchableOpacity
                    style={styles.saveModalOption}
                    onPress={async () => {
                      setShowSaveModal(false);
                      try {
                        await toggleScrap(item.view_hash);
                        setIsScrap(prev => !prev);
                        toastSuccess(isScrap ? '스크랩에 저장되었어요!' : '스크랩이 해제되었어요.');
                      } catch {
                        toastError('스크랩 저장에 실패했어요.');
                      }
                    }}
                  >
                    <Ionicons name="bookmark-outline" size={22} color="#FF9AA2" />
                    <View style={styles.saveModalOptionText}>
                      <Text style={styles.saveModalOptionTitle}>스크랩 {isScrap ? '해제' : ''}</Text>
                      <Text style={styles.saveModalOptionDesc}>{isScrap ? '내 스크랩 목록에서 해제해요' : '내 스크랩 목록에 저장해요'}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* 캘린더에 저장하기 모달 */}
        <Modal
          visible={showCopyToCalendarModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCopyToCalendarModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowCopyToCalendarModal(false)}>
            <View style={styles.copyModalOverlay}>
              <TouchableWithoutFeedback>
                <View
                  style={[
                    styles.copyModalContainer,
                    { paddingBottom: Math.max(insets.bottom + 16, 28) },
                  ]}
                >
                  <Text style={styles.copyModalTitle}>캘린더에 저장하기</Text>

                  <View style={styles.copySection}>
                    <Text style={styles.copySectionTitle}>날짜 선택</Text>
                    <TouchableOpacity
                      style={styles.copyDateButton}
                      onPress={() => setShowCalendarPicker((prev) => !prev)}
                    >
                      <Ionicons name="calendar-outline" size={18} color="#FF9AA2" />
                      <Text style={styles.copyDateButtonText}>{selectedCopyDate.replace(/-/g, '.')}</Text>
                      <Ionicons
                        name={showCalendarPicker ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#888"
                      />
                    </TouchableOpacity>

                    {showCalendarPicker && (
                      <View style={styles.copyCalendarContainer}>
                        <Calendar
                          current={selectedCopyDate}
                          onDayPress={(day) => {
                            setSelectedCopyDate(day.dateString);
                            setShowCalendarPicker(false);
                          }}
                          markedDates={{
                            [selectedCopyDate]: {
                              selected: true,
                              selectedColor: '#FF9AA2',
                            },
                          }}
                          theme={{
                            selectedDayBackgroundColor: '#FF9AA2',
                            todayTextColor: '#FF9AA2',
                            arrowColor: '#FF9AA2',
                          }}
                        />
                      </View>
                    )}
                  </View>

                  <View style={styles.copySection}>
                    <Text style={styles.copySectionTitle}>자녀 선택</Text>
                    <View style={styles.childSelectList}>
                      {myChildren.map((child: any) => {
                        const isSelected = selectedChildId === child.id;
                        return (
                          <TouchableOpacity
                            key={child.id}
                            style={[styles.childSelectItem, isSelected && styles.childSelectItemActive]}
                            onPress={() => setSelectedChildId(child.id)}
                          >
                            <Text style={styles.childSelectName}>{child.child_name}</Text>
                            <Text style={styles.childSelectMeta}>
                              {USER_CHILD_GENDER[child.child_gender]} · {child.child_birth}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.copyModalButtonRow}>
                    <TouchableOpacity
                      style={[styles.copyModalButton, styles.copyModalCancelButton]}
                      onPress={() => setShowCopyToCalendarModal(false)}
                      disabled={isCopyingToCalendar}
                    >
                      <Text style={styles.copyModalCancelText}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.copyModalButton,
                        styles.copyModalConfirmButton,
                        isCopyingToCalendar && styles.copyModalConfirmButtonDisabled,
                      ]}
                      onPress={handleCopyToCalendar}
                      disabled={isCopyingToCalendar}
                    >
                      {isCopyingToCalendar ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.copyModalConfirmText}>확인</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* 내 피드일때 수정버튼을 노출 */}
        {isMine && onEditFeed && (
          <TouchableOpacity
            style={styles.bottomActionButton}
            onPress={() => onEditFeed(item)}
          >
            <Ionicons name="pencil-outline" size={18} color="#FF9AA2" />
            <Text style={styles.bottomActionButtonText}>수정</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  feedContainer: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  allergiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  allergyBadge: {
    position: 'relative',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE8B3',
    overflow: 'hidden',
  },
  allergyBadgeDiagonal: {
    position: 'absolute',
    top: '50%',
    left: -6,
    right: -6,
    height: 1.5,
    backgroundColor: '#D79A00',
    opacity: 0.55,
    transform: [{ rotate: '-25deg' }],
  },
  allergyBadgeText: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '600',
  },
  dropdownMenu: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop:10,
    paddingBottom:10,
    gap: 8,
  },
  tag: {
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagActive: {
    borderColor: '#FF9AA2',
    backgroundColor: '#FFE5E5',
  },
  tagCircles: {
    fontSize: 12,
    fontWeight: '700',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tagTextActive: {
    color: '#FF9AA2',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 15,
    color: '#4A4A4A',
    marginLeft: 12,
    fontWeight: '500',
  },
  menuTextDanger: {
    color: '#FF6B6B',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#FFE5E5',
    marginVertical: 4,
    marginHorizontal: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFFBF7',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFE5E5',
  },
  nickname: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A4A4A',
  },
  timestamp: {
    fontSize: 11,
    color: '#919191',
    marginTop: 0,
  },
  childMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  genderLabel: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: '#FFFFFF',
  },
  genderLabelText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
  categoryLabel: {
    alignSelf: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryLabelText: {
    fontSize: 12,
    color: '#FF9AA2',
    fontWeight: '600',
  },
  imageCarouselContainer: {
    position: 'relative',
    paddingLeft: 16,
    paddingRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referredOverlay: {
    position: 'absolute',
    top: 12,
    right: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  referredOverlayText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  feedImage: {
    width: width - 32,
    height: width - 32,
    resizeMode: 'cover',
    borderRadius: 10,
  },
  noImageContainer: {
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFB5A7',
  },
  imageIndicatorContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  imageIndicator: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  aiSummaryButton: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'transparent',
  },
  aiButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9AA2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#FF9AA2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE8B3',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  actionButtonCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
  },
  contentContainer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  content: {
    fontSize: 14,
    color: '#4A4A4A',
    lineHeight: 20,
  },
  contentNickname: {
    fontWeight: '700',
    color: '#4A4A4A',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 14,
    gap: 10,
  },
  bottomActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F0',
    borderWidth: 1,
    borderColor: '#FFE5E5',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  bottomActionButtonDisabled: {
    opacity: 0.6,
  },
  bottomActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9AA2',
  },
  saveModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  saveModalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  saveModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A4A4A',
    marginBottom: 16,
    textAlign: 'center',
  },
  saveModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 14,
  },
  saveModalOptionText: {
    flex: 1,
  },
  saveModalOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A4A4A',
  },
  saveModalOptionDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  saveModalDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  copyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  copyModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    maxHeight: '85%',
  },
  copyModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A4A4A',
    textAlign: 'center',
    marginBottom: 16,
  },
  copySection: {
    marginBottom: 16,
  },
  copySectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A4A4A',
    marginBottom: 10,
  },
  copyDateButton: {
    borderWidth: 1,
    borderColor: '#FFE5E5',
    borderRadius: 10,
    backgroundColor: '#FFF5F0',
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  copyDateButtonText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#4A4A4A',
    fontWeight: '600',
  },
  copyCalendarContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  childSelectList: {
    gap: 8,
  },
  childSelectItem: {
    borderWidth: 1,
    borderColor: '#FFE5E5',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  childSelectItemActive: {
    borderColor: '#FF9AA2',
    backgroundColor: '#FFF5F0',
  },
  childSelectName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A4A4A',
  },
  childSelectMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#8B8B8B',
  },
  copyModalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  copyModalButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyModalCancelButton: {
    backgroundColor: '#F3F3F3',
  },
  copyModalConfirmButton: {
    backgroundColor: '#FF9AA2',
  },
  copyModalConfirmButtonDisabled: {
    opacity: 0.7,
  },
  copyModalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#777777',
  },
  copyModalConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default MealItem;
