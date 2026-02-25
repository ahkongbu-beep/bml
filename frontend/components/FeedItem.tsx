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
import { Feed } from '../libs/types/FeedType';
import { formatDate, diffMonthsFrom, getStaticImage } from '@/libs/utils/common';
import { FeedItemProps } from '../libs/types/FeedType';
import { USER_CHILD_GENDER } from '../libs/utils/codes/UserChildCode';

const { width } = Dimensions.get('window');

const FeedItem = React.memo(({
  item,
  menuVisible,
  currentImageIndex,
  isLiking,
  onMenuToggle,
  onImageScroll,
  onViewProfile,
  onBlock,
  onLike,
  onCommentPress,
  onAiSummary,
  onAddToMealCalendar,
  userHash,
  isMine,
  onEditFeed
}: FeedItemProps) => {
  // URL에서 iid 추출하는 함수
  const extractImageId = (imageUrl: string): string => {
    const match = imageUrl.match(/[?&]iid=(\d+)/);
    return match ? match[1] : '';
  };

  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const menuButtonRef = useRef<TouchableOpacity>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 130, right: 10 });

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

  const allergy_info = item.childs.allergies.map((allergy: any) => {
    return allergy.allergy_name;
  });

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
              <Text style={styles.timestamp}>
                {diffMonthsFrom(item.childs.child_birth)}개월 · {USER_CHILD_GENDER[item.childs.child_gender]}
              </Text>
            )}
          </View>
          {allergy_info.length > 0 && (
            <View style={styles.allergiesContainer}>
              {allergy_info.map((allergyName, index) => (
                <View key={index} style={styles.allergyBadge}>
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
      {item.images.length > 0 ? (
        <View style={styles.imageCarouselContainer}>
          {item.images.map((imageUri, index) => (
              <Image
              key={`${item.id}-image-${extractImageId(imageUri) || index}`}
              source={{ uri: getStaticImage('medium', imageUri) }}
              style={styles.feedImage}
              />
          ))}
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
          {item.tags.length > 0 && item.tags.map((tag, idx) => (
            <View key={`${item.id}-tag-${idx}-${tag}`} style={styles.tag}>
              <Text style={styles.tagText}>{tag} </Text>
            </View>
          ))}
        </View>
        <Text style={styles.content}>
          {item.content}
        </Text>
      </View>

      {/* 액션 버튼 */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => onLike(item.id)}
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
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onCommentPress(item.id)}
        >
          <Ionicons name="chatbubble-outline" size={14} color="#FF9AA2" />
          <Text style={styles.actionButtonText}>댓글</Text>
        </TouchableOpacity>
      </View>

      {/* 액션 버튼 */}
      <View style={styles.actionButtonsContainer}>
        {onAiSummary && userHash && (
          <TouchableOpacity
            style={styles.bottomActionButton}
            onPress={() => {
              const currentIndex = currentImageIndex[item.id] || 0;
              onAiSummary(userHash, item.id, currentIndex.toString());
            }}
          >
            <Ionicons name="sparkles" size={18} color="#FF9AA2" />
            <Text style={styles.bottomActionButtonText}>AI 요약</Text>
          </TouchableOpacity>
        )}
        {/* 내 피드일때 식단 공유버튼 노출 */}
        {!isMine && onAddToMealCalendar && (
          <TouchableOpacity
            style={styles.bottomActionButton}
            onPress={() => onAddToMealCalendar(item.user.user_hash, item.id)}
          >
            <Ionicons name="calendar-outline" size={18} color="#FF9AA2" />
            <Text style={styles.bottomActionButtonText}>식단 캘린더에 추가</Text>
          </TouchableOpacity>
        )}
        {/* 내 피드일때 수정보튼을 노출 */}
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
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE8B3',
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
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#f3f3f3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 14,
    color: '#707070',
    fontWeight: '600',
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
  bottomActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9AA2',
  },
});

export default FeedItem;
