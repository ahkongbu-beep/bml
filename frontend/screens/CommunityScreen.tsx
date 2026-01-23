/*
 * 커뮤니티 화면
 * 연령별 카테고리(라디오버튼)를 통해 연령별 커뮤니티 분류
 * 커뮤니티 글 목록 표시
 * 오른쪽 하단에는 동그랗게 + 버튼(플로팅 액션 버튼)으로 글 작성 화면으로 이동
 * 내가 작성한 글은 수정 및 삭제 가능
 * 카카오 메신저처럼 내가 작성한 글은 화면 오른쪽/ 타인이 작성한 글은 왼쪽에 배치
 * 글 작성자는 프로필 이미지와 닉네임 표시
 * 글 작성 시간 표시
 * 공감 버튼 및 공감 수 표시
 * 댓글등록/수정 모달 및 댓글 수 표시
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../libs/contexts/AuthContext';
import Layout from '../components/Layout';
import Header from '../components/Header';
import CommentModal from '../components/CommentModal';
import { formatDate, diffMonthsFrom, formatRelativeTime } from '@/libs/utils/common';
import {
  useGetCommunities,
  useSoftDeleteCommunity,
  useLikeToggleCommunity,
  useCommunityComments,
  useCreateCommunityComment,
  useDeleteCommunityComment
} from '../libs/hooks/useCommunities';
import { useCategoryCodes } from '../libs/hooks/useCategories';
import { Portal, Dialog, Button } from 'react-native-paper';
import { CommunityPost } from '../libs/types/CommunitiesType';
import styles from './CommunityScreen.styles';

export default function CommunityScreen({ navigation }: any) {
  const API_BASE_URL = process.env.EXPO_PUBLIC_STATIC_BASE_URL;
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // 검색 관련 state
  const [searchVisible, setSearchVisible] = useState(false);
  // const [startDate, setStartDate] = useState<Date | null>(null);
  // const [endDate, setEndDate] = useState<Date | null>(null);
  // const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  // const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  // const [userIdSearch, setUserIdSearch] = useState('');
  const [titleSearch, setTitleSearch] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'likes' | 'views'>('latest');


  const { data: topicGroups, isLoading: topicGroupsLoading } = useCategoryCodes("TOPIC_GROUP");

  // 전체 카테고리를 포함한 topicGroups
  const topicGroupsWithAll = [
    { code: "topic_000", id: "ALL", is_active: "Y", sort: 0, type: "TOPIC_GROUP", value: "전체" },
    ...(topicGroups || []),
  ];

  const getCommunities = useGetCommunities();
  const deleteCommunity = useSoftDeleteCommunity();
  const likeToggleCommunity = useLikeToggleCommunity();

  // 댓글 목록 조회 - selectedPostId가 있을 때만 호출
  const { data: commentsData, refetch: refetchComments } = useCommunityComments({
    communityHash: selectedPostId || '',
    limit: 100
  }, {
    enabled: !!selectedPostId, // selectedPostId가 있을 때만 실행
  });

  const createCommunityCommentMutation = useCreateCommunityComment();
  const deleteCommunityCommentMutation = useDeleteCommunityComment();

  // 커뮤니티 목록 로드
  const loadCommunities = (refresh: boolean = false) => {
    const params = {
      categoryCode: selectedCategory === 'ALL' ? undefined : parseInt(selectedCategory),
      isSecret: 'N',
      cursor: refresh ? undefined : cursor,
      limit: 20,
      keyword: titleSearch || undefined,
      // userNickname: userIdSearch || undefined,
      // startDate: startDate ? startDate.toISOString().split('T')[0] : undefined,
      // endDate: endDate ? endDate.toISOString().split('T')[0] : undefined,
      sortBy: sortBy,
    };

    getCommunities.mutate(params, {
      onSuccess: (response) => {
        if (response.success && response.data) {
          const newPosts = response.data.communities;
          setPosts(refresh ? newPosts : [...posts, ...newPosts]);
          setCursor(response.data.cursor);
        }
        setIsLoading(false);
        setIsRefreshing(false);
      },
      onError: (error) => {
        console.error('Failed to load communities:', error);
        setIsLoading(false);
        setIsRefreshing(false);
      },
    });
  };

  // 초기 로드 및 카테고리 변경 시
  useEffect(() => {
    setIsLoading(true);
    setPosts([]);
    setCursor(undefined);
    loadCommunities(true);
  }, [selectedCategory]);

  // 화면이 focus될 때 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      handleRefresh();
    }, [selectedCategory])
  );

  // 새로고침
  const handleRefresh = () => {
    setIsRefreshing(true);
    setPosts([]);
    setCursor(undefined);
    loadCommunities(true);
  };

  // 검색 실행
  const handleSearch = () => {
    setIsLoading(true);
    setPosts([]);
    setCursor(undefined);
    setSearchVisible(false);
    loadCommunities(true);
  };

  // 무한 스크롤
  const handleLoadMore = () => {
    if (!isLoading && cursor && cursor > 0) {
      loadCommunities(false);
    }
  };

  // 공감 토글
  const handleLikeToggle = (viewHash: string) => {
    likeToggleCommunity.mutate(viewHash, {
      onSuccess: (response) => {
        if (response.success) {
          updatePostLikeState(viewHash);
        } else {
          Alert.alert('오류', response.error || '공감 처리에 실패했습니다.');
        }
      },
      onError: (error) => {
        console.error('Failed to toggle like:', error);
        Alert.alert('오류', '공감 처리 중 오류가 발생했습니다.');
      },
    });

    setPosts(posts.map(post => {
      if (post.view_hash === viewHash) {
        const isLiked = post.is_liked;
        const likeCount = post.like_count || 0;
        return {
          ...post,
          is_liked: isLiked === "Y" ? "N" : "Y",
          like_count: isLiked === "Y" ? ((likeCount < 0)? 0: likeCount - 1) : likeCount + 1,
        };
      }
      return post;
    }));
  };

  // 댓글 모달 열기
  const handleCommentPress = (viewHash: string) => {
    setSelectedPostId(viewHash);
    setCommentModalVisible(true);
    // selectedPostId가 변경되면 자동으로 refetch되지만, 명시적으로도 호출
    setTimeout(() => {
      refetchComments();
    }, 100);
  };

  // 메뉴 토글
  const handleMenuToggle = (viewHash: string, event: any) => {
    if (menuVisible === viewHash) {
      setMenuVisible(null);
    } else {
      event.target.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        setMenuPosition({
          top: pageY + height,
          right: 20,
        });
        setMenuVisible(viewHash);
      });
    }
  };

  // 게시글 수정
  const handleEdit = (viewHash: string) => {
    setMenuVisible(null);
    // TODO: 수정 화면으로 이동
    navigation.navigate('CommunityModify', { viewHash })
  };

  // 게시글 삭제 모달
  const handleDelete = (viewHash: string) => {
    setMenuVisible(null);
    setDeleteDialogVisible(true);
    setPostToDelete(viewHash);
  };

  // 게시글 삭제 취소
  const cancelDelete = () => {
    setDeleteDialogVisible(false);
    setPostToDelete(null);
  };

  // 게시글 삭제
  const handelCommunityDelete = () => {
    const viewHash = postToDelete;
    if (!viewHash) return;

    deleteCommunity.mutate(viewHash, {
      onSuccess: (response) => {
        if (response.success) {

          setPosts(posts.filter(post => post.view_hash !== viewHash));
          setDeleteDialogVisible(false);
          setPostToDelete(null);
          Alert.alert('성공', response.message || '게시글이 성공적으로 삭제되었습니다.');

          handleRefresh();
        } else {
          Alert.alert('오류', response.error || '게시글 삭제에 실패했습니다.');
        }
      },
      onError: (error) => {
        console.error('Failed to delete community:', error);
      },
    });
  }

  // 게시글 작성
  const handleCreatePost = () => {
    // TODO: 작성 화면으로 이동
    navigation.navigate('CommunityWrite');
  };

  // 댓글 등록
  const handleCommentSubmit = (content: string, parentHash: string | null) => {
    if (!selectedPostId) {
      Alert.alert('오류', '게시글 정보가 없습니다.');
      return;
    }
    createCommunityCommentMutation.mutate(
      {
        community_hash: selectedPostId,
        comment: content,
        parent_hash: parentHash || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert('성공', '댓글이 등록되었습니다.');
          refetchComments(); // 댓글 목록 새로고침

          // 댓글 카운트 증가
          setPosts(posts.map(post => {
            if (post.view_hash === selectedPostId) {
              return { ...post, comment_count: (post.comment_count || 0) + 1 };
            }
            return post;
          }));

        },
        onError: (error) => {
          Alert.alert('오류', '댓글 등록 중 오류가 발생했습니다.');
          console.error('Comment create error:', error);
        },
      }
    );
  };

  // 댓글 삭제
  const handleCommentDelete = (commentHash: string) => {
    deleteCommunityCommentMutation.mutate(
      commentHash,
      {
        onSuccess: () => {
          Alert.alert('성공', '댓글이 삭제되었습니다.');
          refetchComments(); // 댓글 목록 새로고침
          // 댓글 카운트 감소
          setPosts(posts.map(post => {
            if (post.view_hash === selectedPostId) {
              const currentCount = post.comment_count || 0;
              return { ...post, comment_count: currentCount > 0 ? currentCount - 1 : 0 };
            }
            return post;
          }));
        },
        onError: (error) => {
          Alert.alert('오류', '댓글 삭제 중 오류가 발생했습니다.');
          console.error('Comment delete error:', error);
        },
      }
    );
  };

  const renderPost = ({ item }: { item: CommunityPost }) => {
    const isMine = item.user_hash === user?.view_hash;

    // category_code에 맞는 주제 찾기
    const category = topicGroupsWithAll.find(cat => cat.id === item.category_code);
    const categoryName = category ? category.value : '';

    return (
      <View style={[styles.postContainer, isMine ? styles.postRight : styles.postLeft]}>
        <TouchableOpacity
          style={[styles.postCard, isMine && styles.postCardMine]}
          onPress={() => navigation.navigate('CommunityDetail', { viewHash: item.view_hash })}
          activeOpacity={0.7}
        >
          <View style={styles.postHeader}>
            <Image
              source={{ uri: API_BASE_URL + (item.profile_image + "_small.webp" || '/default-profile.png') }}
              style={styles.profileImage}
            />
            <View style={styles.postUserInfo}>
              <Text style={styles.postUsername}>{item.nickname}</Text>
              <Text style={styles.postTime}>
                {item.child_name} · {diffMonthsFrom(item.child_birth)}개월 · {item.child_gender === 'M' ? '남아' : '여아'}
              </Text>
            </View>
            {isMine && (
              <TouchableOpacity
                style={styles.menuButton}
                onPress={(e) => handleMenuToggle(item.view_hash, e)}
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#868E96" />
              </TouchableOpacity>
            )}
          </View>

          {item.title && <Text style={styles.postTitle}>{item.title}</Text>}

          {/* 주제 배지 */}
          {categoryName && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>#{categoryName}</Text>
            </View>
          )}
          <View style={styles.postFooter}>
            <View style={styles.postActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleLikeToggle(item.view_hash)}
              >
                <Ionicons
                  name={item.is_liked === "Y" ? 'heart' : 'heart-outline'}
                  size={20}
                  color={item.is_liked === "Y" ? '#FF9AA2' : '#868E96'}
                />
                <Text style={[styles.actionText, item.is_liked === "Y" && styles.actionTextActive]}>
                  {item.like_count || 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCommentPress(item.view_hash)}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#868E96" />
                <Text style={styles.actionText}>{item.comment_count || 0}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.postTime}>{formatRelativeTime(item.created_at)}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Layout>
      <Header
        title="커뮤니티"
        rightButton={{
          icon: 'search',
          onPress: () => setSearchVisible(!searchVisible)
        }}
      />

      {/* 주제 카테고리 */}
      <View style={styles.categoryContainer}>
        <Text style={styles.categoryTitle}>주제별 커뮤니티</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.radioGroup}
        >
          {topicGroupsWithAll.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.radioButton,
                selectedCategory === category.id && styles.radioButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <View
                style={[
                  styles.radioCircle,
                  selectedCategory === category.id && styles.radioCircleActive,
                ]}
              >
                {selectedCategory === category.id && (
                  <View style={styles.radioCircleInner} />
                )}
              </View>
              <Text
                style={[
                  styles.radioLabel,
                  selectedCategory === category.id && styles.radioLabelActive,
                ]}
              >
                {category.value}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 검색 필터 */}
      {searchVisible && (
        <View style={styles.searchContainer}>
          {/* 날짜 범위 */}
          {/* <View style={styles.searchRow}>
            <Text style={styles.searchLabel}>기간</Text>
            <View style={styles.dateRangeContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {startDate ? startDate.toLocaleDateString('ko-KR') : '시작일'}
                </Text>
                <Ionicons name="calendar-outline" size={16} color="#718096" />
              </TouchableOpacity>
              <Text style={styles.dateSeparator}>~</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {endDate ? endDate.toLocaleDateString('ko-KR') : '종료일'}
                </Text>
                <Ionicons name="calendar-outline" size={16} color="#718096" />
              </TouchableOpacity>
            </View>
          </View> */}

          {/* 회원ID 검색 */}
          {/* <View style={styles.searchRow}>
            <Text style={styles.searchLabel}>회원ID</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="회원ID 입력"
              placeholderTextColor="#ADB5BD"
              value={userIdSearch}
              onChangeText={setUserIdSearch}
            />
          </View> */}

          {/* 제목 검색 */}
          <View style={styles.searchRow}>
            <Text style={styles.searchLabel}>제목</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="제목 검색"
              placeholderTextColor="#ADB5BD"
              value={titleSearch}
              onChangeText={setTitleSearch}
            />
          </View>

          {/* 정렬 */}
          <View style={styles.searchRow}>
            <Text style={styles.searchLabel}>정렬</Text>
            <View style={styles.sortContainer}>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'latest' && styles.sortButtonActive]}
                onPress={() => setSortBy('latest')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'latest' && styles.sortButtonTextActive]}>
                  최신순
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'likes' && styles.sortButtonActive]}
                onPress={() => setSortBy('likes')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'likes' && styles.sortButtonTextActive]}>
                  좋아요순
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'views' && styles.sortButtonActive]}
                onPress={() => setSortBy('views')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'views' && styles.sortButtonTextActive]}>
                  조회순
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 검색 버튼 */}
          <View style={styles.searchButtonRow}>
            {/* <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                // setStartDate(null);
                // setEndDate(null);
                // setUserIdSearch('');
                setTitleSearch('');
                setSortBy('latest');
                handleRefresh();
              }}
            >
              <Text style={styles.resetButtonText}>초기화</Text>
            </TouchableOpacity> */}
            <TouchableOpacity
              style={styles.searchSubmitButton}
              onPress={handleSearch}
            >
              <Ionicons name="search" size={18} color="#FFFFFF" />
              <Text style={styles.searchSubmitButtonText}>검색</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* DateTimePicker for Start Date */}
      {/* {showStartDatePicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )} */}

      {/* DateTimePicker for End Date */}
      {/*showEndDatePicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )*/}

      {/* 게시글 목록 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9AA2" />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#FF9AA2"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoading && posts.length > 0 ? (
              <ActivityIndicator size="small" color="#FF9AA2" style={{ marginVertical: 20 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#DEE2E6" />
              <Text style={styles.emptyText}>아직 게시글이 없습니다</Text>
              <Text style={styles.emptySubText}>첫 번째 게시글을 작성해보세요!</Text>
            </View>
          }
        />
      )}

      {/* 플로팅 액션 버튼 */}
      <TouchableOpacity style={styles.fabButton} onPress={handleCreatePost}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* 메뉴 모달 */}
      {menuVisible !== null && (
        <Modal transparent visible={menuVisible !== null} onRequestClose={() => setMenuVisible(null)}>
          <TouchableWithoutFeedback onPress={() => setMenuVisible(null)}>
            <View style={styles.menuOverlay}>
              <View style={[styles.menuContainer, { top: menuPosition.top, right: menuPosition.right }]}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleEdit(menuVisible)}
                >
                  <Ionicons name="create-outline" size={20} color="#343A40" />
                  <Text style={styles.menuItemText}>수정</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleDelete(menuVisible)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                  <Text style={[styles.menuItemText, styles.menuItemDelete]}>삭제</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* 댓글 모달 */}
      <CommentModal
        visible={commentModalVisible}
        onClose={() => {
          setCommentModalVisible(false);
          setSelectedPostId(null);
        }}
        feedId={0}
        comments={commentsData?.data?.comments || []}
        onSubmit={(content, parentHash) => handleCommentSubmit(content, parentHash)}
        onDelete={(commentHash) => handleCommentDelete(commentHash)}
      />

      {/* 내 게시글 삭제 */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={cancelDelete}>
          <Dialog.Title>게시글 삭제</Dialog.Title>
          <Dialog.Content>
            <Text>삭제하시겠습니까?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={cancelDelete}>취소</Button>
            <Button onPress={handelCommunityDelete} textColor="#FF6B6B">삭제</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Layout>
  );
}