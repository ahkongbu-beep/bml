/*
 * 커뮤니티 상세화면
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  StyleSheet,
  BackHandler,
} from 'react-native';
//import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../components/Layout';
import Header from '../components/Header';
import CommentModal from '../components/CommentModal';
import { useAuth } from '../libs/contexts/AuthContext';
import { useGetDetailCommunity, useSoftDeleteCommunity } from '../libs/hooks/useCommunities';
import { useCategoryCodes } from '../libs/hooks/useCategories';
import { LoadingPage } from '../components/Loading';
import { formatDate, diffMonthsFrom } from '@/libs/utils/common';
import { Portal, Dialog, Button } from 'react-native-paper';

interface CommunityDetail {
  title: string;
  contents: string;
  category_code: number;
  is_secret: string;
  user_hash: string;
  user_profile_image: string;
  user_nickname: string;
  view_hash: string;
  user_child_name: string;
  user_child_birth: string;
  user_child_gender: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export default function CommunityDetailScreen({ route, navigation }: any) {
  const { viewHash } = route.params || {};
  const { user } = useAuth();
  const { data: topicGroups, isLoading: topicGroupsLoading } = useCategoryCodes("TOPIC_GROUP");
  const getDetailCommunity = useGetDetailCommunity();
  const deleteCommunity = useSoftDeleteCommunity();

  const [communityData, setCommunityData] = useState<CommunityDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // 기존 데이터 불러오기
  useEffect(() => {
    if (viewHash) {
      getDetailCommunity.mutate(viewHash, {
        onSuccess: (response) => {
          if (response.success && response.data) {
            setCommunityData(response.data);
          } else {
            Alert.alert('오류', response.error || '게시글을 불러올 수 없습니다.');
            navigation.goBack();
          }
          setIsLoading(false);
        },
        onError: (error) => {
          console.error('Failed to load community:', error);
          Alert.alert('오류', '게시글을 불러오는 중 오류가 발생했습니다.');
          navigation.goBack();
        },
      });
    }
  }, [viewHash]);

//   // 안드로이드 뒤로가기 버튼 처리
//   useFocusEffect(
//     useCallback(() => {
//       const onBackPress = () => {
//         navigation.navigate('Community');
//         return true;
//       };

//       BackHandler.addEventListener('hardwareBackPress', onBackPress);

//       return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
//     }, [navigation])
//   );

  // 카테고리 이름 가져오기
  const getCategoryName = () => {
    if (!communityData || !topicGroups) return '';
    const category = topicGroups.find((cat) => cat.id === communityData.category_code);
    return category ? category.value : '';
  };

  // 본인 게시글인지 확인
  const isMine = communityData?.user_hash === user?.view_hash;

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
          Alert.alert('성공', '게시글이 삭제되었습니다.', [
            {
              text: '확인',
              onPress: () => navigation.navigate('Community'),
            },
          ]);
        } else {
          Alert.alert('오류', response.error || '게시글 삭제에 실패했습니다.');
        }
      },
      onError: (error) => {
        console.error('Failed to delete community:', error);
        Alert.alert('오류', '게시글 삭제 중 오류가 발생했습니다.');
      },
    });
  };

  // 좋아요 토글
  const handleLikeToggle = () => {
    // TODO: 좋아요 API 호출
    console.log('Like toggled');
  };

  // 댓글 모달 열기
  const handleCommentPress = () => {
    setCommentModalVisible(true);
  };

  if (topicGroupsLoading || isLoading || !communityData) {
    return <LoadingPage title="게시글을 불러오는 중입니다." />;
  }

  const categoryName = getCategoryName();

  return (
    <Layout>
      <Header
        title="커뮤니티 상세"
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
          <Image
            source={{ uri: communityData.user_profile_image || 'https://via.placeholder.com/48' }}
            style={styles.profileImage}
          />
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
            <Text style={styles.actionCount}>0</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity style={styles.actionButton} onPress={handleCommentPress}>
            <Ionicons name="chatbubble-outline" size={24} color="#868E96" />
            <Text style={styles.actionText}>댓글</Text>
            <Text style={styles.actionCount}>0</Text>
          </TouchableOpacity>
        </View>

        {/* 댓글 목록 영역 */}
        <View style={styles.commentSection}>
          <Text style={styles.sectionTitle}>댓글</Text>
          <View style={styles.emptyComment}>
            <Ionicons name="chatbubble-outline" size={48} color="#DEE2E6" />
            <Text style={styles.emptyCommentText}>첫 댓글을 작성해보세요</Text>
          </View>
        </View>
      </ScrollView>

      {/* 댓글 작성 버튼 */}
      <View style={styles.commentInputContainer}>
        <TouchableOpacity
          style={styles.commentInputButton}
          onPress={handleCommentPress}
        >
          <Text style={styles.commentInputPlaceholder}>댓글을 작성해주세요</Text>
          <Ionicons name="send" size={20} color="#FF9AA2" />
        </TouchableOpacity>
      </View>

      {/* 댓글 모달 */}
      <CommentModal
        visible={commentModalVisible}
        onClose={() => setCommentModalVisible(false)}
        feedId={0}
        comments={[]}
        onSubmitComment={(comment) => {
          // TODO: 댓글 등록 API
          console.log('Submit comment:', comment);
        }}
        onDeleteComment={(commentHash) => {
          // TODO: 댓글 삭제 API
          console.log('Delete comment:', commentHash);
        }}
      />

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
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343A40',
    marginBottom: 4,
  },
  authorDetail: {
    fontSize: 13,
    color: '#868E96',
  },
  categoryBadge: {
    backgroundColor: '#FFF0F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    margin: 16,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF8FA3',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#343A40',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  contents: {
    fontSize: 15,
    lineHeight: 24,
    color: '#495057',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#868E96',
  },
  divider: {
    height: 8,
    backgroundColor: '#F1F3F5',
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#DEE2E6',
  },
  actionText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  actionCount: {
    fontSize: 14,
    color: '#868E96',
  },
  commentSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
    minHeight: 200,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343A40',
    marginBottom: 16,
  },
  emptyComment: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyCommentText: {
    fontSize: 14,
    color: '#ADB5BD',
    marginTop: 12,
  },
  commentInputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#DEE2E6',
    padding: 12,
  },
  commentInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentInputPlaceholder: {
    fontSize: 14,
    color: '#ADB5BD',
  },
});