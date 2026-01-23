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
import { formatDate, diffMonthsFrom } from '@/libs/utils/common';
import { FeedItemProps } from '../libs/types/FeedType';
import { USER_CHILD_GENDER } from '../libs/utils/codes/UserChildCode';

const { width } = Dimensions.get('window');
const API_BASE_URL = process.env.EXPO_PUBLIC_STATIC_BASE_URL;
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

  return (
    <View style={styles.feedContainer}>
      {/* 사용자 정보 */}
      <View style={styles.userHeader}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => onViewProfile(item.user.user_hash || '', item.user.nickname)}
        >
          <Image
            source={{ uri: `${API_BASE_URL}${item.user.profile_image}_small.webp` }}
            style={styles.profileImage}
          />
          <View>
            <Text style={styles.nickname}>{item.user.nickname}</Text>
            {/*  n 개월  */}
            {item.childs && (
              <Text style={styles.timestamp}>
                {diffMonthsFrom(item.childs.child_birth)} 개월 · {USER_CHILD_GENDER[item.childs.child_gender]}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity ref={menuButtonRef} onPress={handleMenuToggle}>
          <Ionicons name="ellipsis-vertical" size={22} color="#C0C0C0" />
        </TouchableOpacity>
      </View>

      {/* 드롭다운 메뉴 */}
      <Modal
        visible={menuVisible === item.id}
        transparent={true}
        animationType="fade"
        onRequestClose={() => onMenuToggle(-1)}
      >
        <TouchableWithoutFeedback onPress={() => onMenuToggle(-1)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[
                styles.dropdownMenu,
                { top: menuPosition.top, right: menuPosition.right }
              ]}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => onViewProfile(item.user.user_hash || '', item.user.nickname)}
                >
                  <Ionicons name="person-outline" size={20} color="#4A4A4A" />
                  <Text style={styles.menuText}>사용자 계정보기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => onAddToMealCalendar(item.user.user_hash, item.id)}
                >
                  <Ionicons name="person-outline" size={20} color="#4A4A4A" />
                  <Text style={styles.menuText}>식단 캘린더에 추가</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => onBlock(item.user.user_hash, item.user.nickname)}
                >
                  <Ionicons name="ban-outline" size={20} color="#FF6B6B" />
                  <Text style={[styles.menuText, styles.menuTextDanger]}>차단하기</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onLike(item.id);
                    onMenuToggle(-1);
                  }}
                >
                  <Ionicons
                    name={item.is_liked ? 'heart' : 'heart-outline'}
                    size={20}
                    color={item.is_liked ? '#FF9AA2' : '#4A4A4A'}
                  />
                  <Text style={styles.menuText}>
                    {item.is_liked ? '좋아요 취소' : '좋아요'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 피드 이미지 */}
      {item.images.length > 0 ? (
        <View style={styles.imageCarouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const slideIndex = Math.round(
                event.nativeEvent.contentOffset.x / (width - 16)
              );
              onImageScroll(item.id, slideIndex);
            }}
            scrollEventThrottle={16}
          >
            {item.images.map((imageUri, index) => (
              <Image
                key={`${item.id}-image-${extractImageId(imageUri) || index}`}
                source={{ uri: `${API_BASE_URL}${imageUri}_thumbnail.webp` }}
                style={styles.feedImage}
              />
            ))}
          </ScrollView>
          {item.images.length > 1 && (
            <View style={styles.imageIndicatorContainer}>
              <Text style={styles.imageIndicator}>
                {(currentImageIndex[item.id] || 0) + 1} / {item.images.length}
              </Text>
            </View>
          )}
          {onAiSummary && userHash && (
            <TouchableOpacity
              style={styles.aiSummaryButton}
              onPress={() => {
                const currentIndex = currentImageIndex[item.id] || 0;
                const currentImageUrl = item.images[currentIndex];
                console.log('AI Summary clicked:', {
                  feedId: item.id,
                  imageUrl: currentImageUrl,
                  index: currentIndex
                });
                // 이미지 URL 또는 인덱스를 전달
                onAiSummary(userHash, item.id, currentIndex.toString());
              }}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.aiButtonInner,
                  {
                    opacity: shimmerOpacity,
                    transform: [{ scale: shimmerScale }],
                  },
                ]}
              >
                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                <Text style={styles.aiButtonText}>AI</Text>
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={[styles.feedImage, styles.noImageContainer]}>
          <Text style={styles.noImageTitle}>{item.title}</Text>
        </View>
      )}

      {/* 액션 버튼 */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            onPress={() => onLike(item.id)}
            style={styles.actionButton}
          >
            <Ionicons
              name={item.is_liked ? 'heart' : 'heart-outline'}
              size={30}
              color={item.is_liked ? '#FF9AA2' : '#C0C0C0'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onCommentPress(item.id)}
          >
            <Ionicons name="chatbubble-outline" size={28} color="#C0C0C0" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 좋아요 수 */}
      <Text style={styles.likeCount}>좋아요 {item.like_count}개</Text>

      {/* 내용 */}
      <View style={styles.contentContainer}>
        <Text style={styles.content}>
          {item.tags.length > 0 && item.tags.map((tag, idx) => (
            <Text key={`${item.id}-tag-${idx}-${tag}`}>#{tag} </Text>
          ))}{"\n"}
          <Text style={styles.contentNickname}>{item.user.nickname}</Text>{' '}
          {item.content}
        </Text>
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
    fontSize: 12,
    color: '#B0B0B0',
    marginTop: 3,
  },
  imageCarouselContainer: {
    position: 'relative',
  },
  feedImage: {
    width: width - 16,
    height: width - 16,
    resizeMode: 'cover',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  leftActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginRight: 16,
  },
  likeCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
    paddingHorizontal: 14,
    paddingTop: 8,
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
});

export default FeedItem;
