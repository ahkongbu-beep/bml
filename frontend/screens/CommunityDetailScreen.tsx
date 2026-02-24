/*
 * 커뮤니티 상세화면
 */
import React, { useEffect, useState, useCallback, use } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  StyleSheet,
  BackHandler,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import styles from './CommunityDetailScreen.styles';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../components/Layout';
import Header from '../components/Header';
import CommentModal from '../components/CommentModal';
import { useAuth } from '../libs/contexts/AuthContext';
import { useGetDetailCommunity, useCommunityComments, useSoftDeleteCommunity, useCreateCommunityComment, useDeleteCommunityComment } from '../libs/hooks/useCommunities';
import { useCategoryCodes } from '../libs/hooks/useCategories';
import { LoadingPage } from '../components/Loading';
import { formatDate, diffMonthsFrom, getStaticImage, formatRelativeTime, handleViewProfile } from '@/libs/utils/common';
import { Portal, Dialog, Button, Icon } from 'react-native-paper';
import { toastError, toastInfo, toastSuccess } from '@/libs/utils/toast';
import { CommunityDetail } from '../libs/types/community';

export default function CommunityDetailScreen({ route, navigation }: any) {
  const { viewHash } = route.params || {};
  const { user } = useAuth();
  const { data: topicGroups, isLoading: topicGropsLoading } = useCategoryCodes("TOPIC_GROUP");
  const getDetailCommunity = useGetDetailCommunity();
  const deleteCommunity = useSoftDeleteCommunity();
  const [comments, setComments] = useState<any[]>([]);

  const { data: commentsData, refetch: refetchComments } = useCommunityComments(
    { communityHash: viewHash || '', limit: 100 },
    { enabled: !!viewHash }
  );

  const [communityData, setCommunityData] = useState<CommunityDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteCommentDialogVisible, setDeleteCommentDialogVisible] = useState(false);
  const [commentInput, setCommentInput] = useState('');

  const [replyToNickname, setReplyToNickname] = useState<string | null>(null);
  const [parentCommentHash, setParentCommentHash] = useState<string | null>(null);
  const [deleteTargetCommentHash, setDeleteTargetCommentHash] = useState<string | null>(null);

  // 댓글등록
  const createCommunityCommentMutation = useCreateCommunityComment();

  // 댓글 삭제
  const deleteCommunityCommentMutation = useDeleteCommunityComment();

  // 데이터 불러오기 함수
  const loadCommunityDetail = () => {
    if (!viewHash) return;

    setIsLoading(true);
    getDetailCommunity.mutate(viewHash, {
      onSuccess: (response) => {
        if (response.success && response.data) {
          const data = response.data;
          // images가 콤마로 구분된 문자열이면 배열로 변환
          if (data.images && typeof data.images === 'string') {
            data.images = data.images.split(',').map(img => img.trim()).filter(img => img);
          }
          setCommunityData(data);
        } else {
          toastError(response.error || '게시글을 불러오는데 실패했습니다.', {
            onHide: () => navigation.goBack(),
            onPress: () => navigation.goBack(),
          });
        }
        setIsLoading(false);
      },
      onError: (error) => {
        console.error('Failed to load community:', error);
        toastError('게시글을 불러오는 중 오류가 발생했습니다.', {
          onHide: () => navigation.goBack(),
          onPress: () => navigation.goBack(),
        });
        setIsLoading(false);
      },
    });
  };

  // 초기 로드
  useEffect(() => {
    loadCommunityDetail();
  }, []);

  // 화면 포커스 시 데이터 재로드 (수정 후 돌아왔을 때)
  useFocusEffect(
    useCallback(() => {
      loadCommunityDetail();
    }, [])
  );

  useEffect(() => {
    if (commentsData && commentsData.success && commentsData.data) {
      // 기존: setComments(commentsData.data);
      setComments(commentsData.data.comments); // ← 배열만 추출
    }
  }, [commentsData]);

  // 카테고리 이름 가져오기
  const getCategoryName = () => {
    if (!communityData || !topicGroups) return '';
    const category = topicGroups.find((cat) => cat.id === communityData.category_code);
    return category ? category.value : '';
  };
  // 본인 게시글인지 확인
  const isMine = communityData?.user_hash === user?.view_hash;

  // 댓글 등록 핸들러
  const handleCommentRegister = () => {
    if (!commentInput.trim()) return;
    createCommunityCommentMutation.mutate(
      {
        community_hash: viewHash,
        comment: commentInput, // 실제로는 입력된 댓글 내용을 사용
        parent_hash: parentCommentHash
      },
      {
        onSuccess: () => {
          toastSuccess('댓글이 등록되었습니다.', {
            onHide: () => {
              setCommentInput("");
              refetchComments();
              // 대댓글 작성 후에는 대댓글 상태 초기화
              setParentCommentHash(null);
              setReplyToNickname(null);
            }
          });
        }
      }
    );
  }

  // 댓글 삭제 모달 핸들러
  const handleCommentDelete = (commentHash: string) => {
    setDeleteTargetCommentHash(commentHash);
    setDeleteCommentDialogVisible(true);
  }

  // 댓글 삭제 모달 취소
  const cancelDeleteComment = () => {
    setDeleteTargetCommentHash(null);
    setDeleteCommentDialogVisible(false);
  };

  // 댓글 삭제처리
  const confirmDeleteComment = () => {
    deleteCommunityCommentMutation.mutate(deleteTargetCommentHash || '', {
      onSuccess: (response) => {
        if (response.success) {
          toastSuccess('댓글이 삭제되었습니다.', {
            onHide: () => {
              setDeleteCommentDialogVisible(false);
              setDeleteTargetCommentHash(null);
              refetchComments();
            }
          });
        } else {
          toastError(response.error || '댓글 삭제에 실패했습니다.');
        }
      },
      onError: (error) => {
        toastError('댓글 삭제 중 오류가 발생했습니다.');
      }
    });
  }

  // 수정하기
  const handleEdit = () => {
    navigation.navigate('CommunityModify', { viewHash });
  };

  // 삭제하기
  const handleDelete = () => {
    setDeleteDialogVisible(true);
  };

  const cancelDelete = () => {
    setDeleteDialogVisible(false);
  };

  const confirmDelete = () => {
    deleteCommunity.mutate(viewHash, {
      onSuccess: (response) => {
        if (response.success) {
          setDeleteDialogVisible(false);

          toastSuccess('게시글이 삭제되었습니다.', {
            onHide: () => navigation.navigate('Community'),
            onPress: () => navigation.navigate('Community'),
          });
        } else {
          toastError(response.error || '게시글 삭제에 실패했습니다.');
        }
      },
      onError: (error) => {
        toastError('게시글 삭제 중 오류가 발생했습니다.');
      },
    });
  };

  const handleUserProfile = (userHash: string) => {
    handleViewProfile(navigation, user?.view_hash || '', userHash);
  }

  const handleLikeToggle = () => {
    toastInfo('좋아요 기능은 준비 중입니다.');
  }

  // 댓글 모달 열기
  const handleCommentPress = (commentHash: string, nickname?: string) => {
    setParentCommentHash(commentHash);
    setReplyToNickname(nickname || null);
  };

  if (isLoading || !communityData) {
    return <LoadingPage title="게시글을 불러오는 중입니다." />;
  }

  const categoryName = getCategoryName();

  const renderComment = (comment: any, depth = 0) => (
    <View
      key={comment.view_hash}
      style={[
        styles.commentItem,
        depth > 0 && { marginLeft: depth * 20 }
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => handleUserProfile(comment.user.view_hash)}
          >
            <Image
              source={{ uri: getStaticImage('small', comment.user.profile_image) || '' }}
              style={styles.commentProfileImage}
            />
          </TouchableOpacity>
          <View>
            <Text style={styles.commentAuthor}>{comment.user.nickname}</Text>
            <Text style={styles.commentText}>{comment.comment}</Text>
            {depth < 3 && (
              <TouchableOpacity
                style={styles.replyButton}
                onPress={() => handleCommentPress(comment.view_hash, comment.user.nickname)}
                activeOpacity={0.7}
              >
                <Text style={styles.replyButtonText}>답글 달기</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {user?.view_hash === comment.user.user_hash && (
          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => handleCommentDelete(comment.view_hash)}
          >
            <Ionicons name="trash" size={18} color="#868E96" />
          </TouchableOpacity>
        )}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Text style={styles.commentDate}>{formatRelativeTime(comment.created_at)}</Text>
      </View>
      {comment.children && comment.children.length > 0 &&
        comment.children.map((child: any) => renderComment(child, depth + 1))
      }
    </View>
  );

  return (
    <Layout>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Header
          title={`${communityData.user_nickname}님의 글`}
          showBackButton
          onBackPress={() => navigation.navigate('Community')}
          rightButton={isMine ? {
            icon: 'ellipsis-vertical',
            onPress: () => {
              Alert.alert(
                '게시글 관리',
                '어떤 작업을 하시겠습니까?',
                [
                  { text: '수정', onPress: handleEdit },
                  { text: '삭제', onPress: handleDelete, style: 'destructive' },
                  { text: '취소', style: 'cancel' },
                ]
              );
            }
          } : undefined}
        />

        <ScrollView style={styles.container}>
          {/* 작성자 정보 */}
          <View style={styles.authorSection}>
            <TouchableOpacity
              onPress={() => handleUserProfile(communityData.user_hash)}
            >
              <Image
              source={{ uri: getStaticImage('small', communityData.user_profile_image) || '' }}
              style={styles.profileImage}
              />
            </TouchableOpacity>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{communityData.user_nickname}</Text>
              <Text style={styles.authorDetail}>
                {communityData.user_child_name} · {diffMonthsFrom(communityData.user_child_birth)}개월 · {communityData.user_child_gender === 'M' ? '남아' : '여아'}
              </Text>
            </View>
          </View>

          {/* 주제 배지 */}
          {categoryName && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>#{categoryName}</Text>
            </View>
          )}

          {/* 제목 */}
          <Text style={styles.title}>{communityData.title}</Text>

          {/* 내용 */}
          <Text style={styles.contents}>{communityData.contents}</Text>

          {/* 이미지 표시 (여러 장) */}
          {communityData.images && communityData.images.length > 0 && (
            <View style={styles.imageSection}>
              {communityData.images.map((imageUrl, index) => (
                <Image
                  key={index}
                  source={{ uri: getStaticImage('large', imageUrl) || '' }}
                  style={styles.contentImage}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}

          {/* 조회수, 작성일 */}
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={16} color="#868E96" />
              <Text style={styles.metaText}>{communityData.view_count}</Text>
            </View>
            <Text style={styles.metaText}>{formatDate(communityData.created_at)}</Text>
          </View>

          {/* 구분선 */}
          <View style={styles.divider} />

          {/* 액션 버튼 */}
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLikeToggle}>
              <Ionicons name="heart-outline" size={24} color="#FF9AA2" />
              <Text style={styles.actionText}>좋아요</Text>
              <Text style={styles.actionCount}>{communityData.likes ? communityData.likes.length : 0}</Text>
            </TouchableOpacity>
          </View>

          {/* 댓글 목록 영역 */}
          <View style={styles.commentSection}>
            <Text style={styles.sectionTitle}>댓글</Text>
              {comments && comments.length > 0 ? (
                comments.map((comment: any) => renderComment(comment))
              ) : (
              <View style={styles.emptyComment}>
                <Ionicons name="chatbubble-outline" size={48} color="#DEE2E6" />
                <Text style={styles.emptyCommentText}>첫 댓글을 작성해보세요</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* 삭제 확인 다이얼로그 */}
        <Portal>
          <Dialog visible={deleteDialogVisible} onDismiss={cancelDelete}>
            <Dialog.Title>게시글 삭제</Dialog.Title>
            <Dialog.Content>
              <Text>정말 삭제하시겠습니까?</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={cancelDelete}>취소</Button>
              <Button onPress={confirmDelete} textColor="#FF6B6B">삭제</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* 댓글 삭제 확인 다이얼로그 */}
        <Portal>
          <Dialog visible={deleteCommentDialogVisible} onDismiss={cancelDeleteComment}>
            <Dialog.Title>댓글 삭제</Dialog.Title>
            <Dialog.Content>
              <Text>정말 삭제하시겠습니까?</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={cancelDeleteComment}>취소</Button>
              <Button onPress={confirmDeleteComment} textColor="#FF6B6B">삭제</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* 댓글 작성 버튼 */}
        <View style={styles.commentInputContainer}>
          <View style={styles.commentInputContainer}>
            {/* 답글 안내 영역 */}
            {replyToNickname && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  backgroundColor: '#FFF0F3',
                  borderRadius: 8,
                  marginBottom: 8,
                  marginLeft: 0,
                }}
              >
                <Text style={{ fontSize: 12, color: '#FF9AA2', fontWeight: '600' }}>
                  {replyToNickname}님에게 답글 작성 중...
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setReplyToNickname(null);
                    setParentCommentHash(null);
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              </View>
            )}

            {/* 입력창과 전송 버튼 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' }}>
              <TextInput
                placeholder="댓글을 작성하세요..."
                style={[styles.commentInput, { flex: 1 }]}
                value={commentInput}
                onChangeText={setCommentInput}
                returnKeyType="send"
                onSubmitEditing={handleCommentRegister}
              />
              <View style={{ flex: 0 }}>
                <TouchableOpacity style={styles.actionButton} onPress={handleCommentRegister}>
                  <Ionicons name="send" size={20} color="#FF9AA2" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Layout>
  );
}
