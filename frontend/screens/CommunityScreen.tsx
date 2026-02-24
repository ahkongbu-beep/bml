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
import Layout from '../components/Layout';
import Header from '../components/Header';
import styles from './CommunityScreen.styles';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../libs/contexts/AuthContext';
import { formatDate, diffMonthsFrom, formatRelativeTime } from '@/libs/utils/common';
import {
  useGetCommunities,
  useSoftDeleteCommunity,
  useLikeToggleCommunity,
  useCreateCommunityComment,
  useDeleteCommunityComment
} from '../libs/hooks/useCommunities';
import { useCategoryCodes } from '../libs/hooks/useCategories';
import { Portal, Dialog, Button } from 'react-native-paper';
import { CommunityPost } from '../libs/types/CommunitiesType';
import { getStaticImage, handleViewProfile } from '../libs/utils/common';
import { toastError, toastInfo, toastSuccess } from '@/libs/utils/toast';
import ConfirmPortal from '@/components/ConfirmPortal';

export default function CommunityScreen({ navigation }: any) {

  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // 검색 관련 state
  const [searchVisible, setSearchVisible] = useState(false);
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

  const createCommunityCommentMutation = useCreateCommunityComment();
  const deleteCommunityCommentMutation = useDeleteCommunityComment();

  // 커뮤니티 목록 로드
  const loadCommunities = (refresh: boolean = false) => {
    const params = {
      categoryCode: selectedCategory === 'ALL' ? undefined : parseInt(selectedCategory),
      isSecret: 'N',
      cursor: refresh ? undefined : cursor,
      limit: 50,
      keyword: titleSearch || undefined,
      sortBy: sortBy,
    };

    getCommunities.mutate(params, {
      onSuccess: (response) => {
        if (response.success && response.data) {
          const newPosts = response.data.communities.map(post => ({
            ...post,
            // images가 콤마로 구분된 문자열이면 배열로 변환
            images: post.images
              ? typeof post.images === 'string'
                ? post.images.split(',').map(img => img.trim()).filter(img => img)
                : post.images
              : []
          }));
          setPosts(refresh ? newPosts : [...posts, ...newPosts]);
          setCursor(response.data.cursor);
        } else {
          toastError(response.error || '게시글을 불러오는 데 실패했습니다.');
        }
        setIsLoading(false);
        setIsRefreshing(false);
      },
      onError: (error) => {
        console.error('Failed to load communities:', error);
        toastError('게시글을 불러오는 중 오류가 발생했습니다.');
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
          return;
        }
        toastError('공감 처리에 실패했습니다.');
      },
      onError: (error) => {
        toastError('공감 처리 중 오류가 발생했습니다.');
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

  // 게시글 수정
  const handleEdit = (viewHash: string) => {
    // TODO: 수정 화면으로 이동
    navigation.navigate('CommunityModify', { viewHash })
  };

  // 게시글 삭제 모달
  const handleDelete = (viewHash: string) => {
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

          // 삭제 후 새로고침
          toastSuccess('게시글이 성공적으로 삭제되었습니다.', {
            onHide: () => {
              handleRefresh();
            },
            onPress: () => {
              handleRefresh();
            }
          });

          return;
        }
        toastError(response.error || '게시글 삭제에 실패했습니다.');
      },
      onError: (error) => {
        toastError('게시글 삭제 중 오류가 발생했습니다.');
      },
    });
  }

  // 게시글 작성
  const handleCreatePost = () => {
    navigation.navigate('CommunityWrite');
  };

  // 댓글 등록
  const handleCommentSubmit = (content: string, parentHash: string | null) => {
    if (!selectedPostId) {
      toastError('게시글 정보가 없습니다.');
      return;
    }

    const mutateParams = {
      community_hash: selectedPostId,
      comment: content,
      parent_hash: parentHash || undefined,
    }

    createCommunityCommentMutation.mutate(mutateParams, {
      onSuccess: () => {
        toastSuccess('댓글이 등록되었습니다.', {
          onHide: () => {
            refetchComments(); // 댓글 목록 새로고침
          },
          onPress: () => {
            refetchComments(); // 댓글 목록 새로고침
          }
        });
      },
      onError: (error) => {
        toastError('댓글 등록 중 오류가 발생했습니다.');
        console.error('Comment create error:', error);
      },
    });
  };

  // 댓글 삭제
  const handleCommentDelete = (commentHash: string) => {
    deleteCommunityCommentMutation.mutate(commentHash,
      {
        onSuccess: () => {
          toastSuccess('댓글이 삭제되었습니다.', {
            onHide: () => {
              refetchComments(); // 댓글 목록 새로고침
            },
            onPress: () => {
              refetchComments(); // 댓글 목록 새로고침
            }
          });
        },
        onError: (error) => {
          toastError('댓글 삭제 중 오류가 발생했습니다.');
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
      <View style={styles.postCard}>
        <TouchableOpacity
          style={styles.postItem}
          onPress={() => navigation.navigate('CommunityDetail', { viewHash: item.view_hash })}
          activeOpacity={0.7}
        >
          <View style={styles.postItemContent}>
            <TouchableOpacity
              onPress={() => handleViewProfile(navigation, user?.view_hash, item.user_hash)}
              style={styles.postProfileContainer}
            >
              <Image
                source={{ uri: getStaticImage('thumbnail', item.profile_image) || '' }}
                style={styles.postProfileImage}
              />
            </TouchableOpacity>
            <View style={styles.postItemRight}>
              {/* 카테고리 태그와 메타 정보 */}
              <View style={styles.postMetaRow}>
                {categoryName && (
                  <View style={styles.postCategoryTag}>
                    <Text style={styles.postCategoryTagText}>{categoryName}</Text>
                  </View>
                )}
                <Text style={styles.postMetaText}>
                  {item.nickname} · {diffMonthsFrom(item.child_birth)}개월
                </Text>
              </View>

              {/* 제목과 내용, 이미지 썸네일 */}
              <View style={styles.postMainContent}>
                <View style={styles.postTextContent}>
                  {/* 제목 */}
                  {item.title && <Text style={styles.postItemTitle} numberOfLines={1}>{item.title}</Text>}

                  {/* 내용 미리보기 */}
                  {item.contents && (
                    <Text style={styles.postItemPreview} numberOfLines={2}>
                      {item.contents}
                    </Text>
                  )}
                </View>

                {/* 이미지 표시 (첫 번째 이미지만 썸네일) */}
                {item.images && item.images.length > 0 && (
                  <Image
                    source={{ uri: getStaticImage('medium', item.images[0]) || '' }}
                    style={styles.postContentImage}
                    resizeMode="cover"
                  />
                )}
              </View>

              {/* 통계 정보 */}
              <View style={styles.postStats}>
                <View style={styles.postStatsRow}>
                  <Ionicons
                    size={16}
                    name={item.is_liked === "Y" ? 'heart' : 'heart-outline'}
                    color={item.is_liked === "Y" ? '#FF8FA3' : '#868E96'}
                  />
                  <Text style={[styles.postStatsText, item.is_liked === "Y" && styles.postStatsTextActive]}>
                    {item.like_count || 0}
                  </Text>
                </View>
                <View style={styles.postStatsRow}>
                  <Ionicons name="chatbubble-outline" size={16} color="#868E96" />
                  <Text style={styles.postStatsText}>{item.comment_count || 0}</Text>
                </View>
              </View>

              {/* 내 게시글인 경우 수정/삭제 버튼 */}
              {isMine && (
                <View style={styles.postActionButtons}>
                  <TouchableOpacity
                    style={styles.postEditButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEdit(item.view_hash);
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="#495057" />
                    <Text style={styles.postEditButtonText}>수정</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.postDeleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(item.view_hash);
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                    <Text style={styles.postDeleteButtonText}>삭제</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Layout>
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>커뮤니티</Text>
            <Text style={styles.headerSubtitle}>함께 나누는 육아 이야기</Text>
          </View>
          <TouchableOpacity style={styles.writeButton} onPress={handleCreatePost}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.writeButtonText}>글쓰기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 주제 카테고리 탭 */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {topicGroupsWithAll.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.tabButton,
                selectedCategory === category.id && styles.tabButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  selectedCategory === category.id && styles.tabButtonTextActive,
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
      {/* 플로팅 액션 버튼 제거 - 헤더에 글쓰기 버튼 있음 */}

      {/* 내 게시글 삭제 */}
      <ConfirmPortal
        visible={deleteDialogVisible}
        title="게시글 삭제"
        message="삭제하시겠습니까?"
        confirmText="삭제"
        confirmTextColor="#FF6B6B"
        onCancel={cancelDelete}
        onConfirm={handelCommunityDelete}
      />
    </Layout>
  );
}