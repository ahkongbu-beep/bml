// frontend/screens/FeedCommentScreen.tsx

import React from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import CommentModal from '../components/CommentModal';
import {
  useFeedComments,
  useCreateFeedComment,
  useDeleteFeedComment,
} from '../libs/hooks/useFeeds';
import { toastError, toastSuccess } from '@/libs/utils/toast';

export default function FeedCommentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { feedId } = route.params as { feedId: number };

  // 댓글 목록 조회
  const { data: commentsData, refetch: refetchComments } = useFeedComments({
    feedId: feedId || 0,
    limit: 50,
    offset: 0,
  });

  const createFeedCommentMutation = useCreateFeedComment(); // 댓글등록
  const deleteFeedCommentMutation = useDeleteFeedComment(); // 댓글삭제

  // 댓글 등록
  const onHandleCommentSubmit = (content: string, parentHash?: string) => {
    if (!feedId) {
      toastError('피드 정보가 없습니다.');
      return;
    }

    const params = {
      feed_id: feedId,
      comment: content,
      parent_hash: parentHash || '',
    };

    createFeedCommentMutation.mutate(params, {
      onSuccess: () => {
        toastSuccess('댓글이 등록되었습니다.', { onHide: () => refetchComments() });
      },
      onError: (error) => {
        toastError('댓글 등록 중 오류가 발생했습니다.');
      },
    });
  };

  // 댓글삭제
  const onHandleCommentDelete = (commentHash: string) => {
    deleteFeedCommentMutation.mutate(commentHash, {
      onSuccess: () => {
        toastSuccess('댓글이 삭제되었습니다.', { onHide: () => refetchComments() });
      },
      onError: (error) => {
        toastError('댓글 삭제 중 오류가 발생했습니다.');
      },
    });
  };

  // 화면 닫기
  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <CommentModal
      onClose={handleClose}
      comments={commentsData || []}
      onSubmit={onHandleCommentSubmit}
      onDelete={onHandleCommentDelete}
      isLoading={createFeedCommentMutation.isPending}
    />
  );
}
