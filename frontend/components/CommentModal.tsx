// 댓글 입력 모달
// frontend/components/CommentModal.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../libs/utils/common';

interface CommentUser {
  nickname: string;
  profile_image?: string;
  user_hash: string;
}

interface Comment {
  feed_id: number;
  parent_id?: number | null;
  comment: string;
  created_at: string;
  updated_at: string;
  is_owner: boolean;
  view_hash: string;
  parent_hash: string;
  user: CommentUser;
  children: Comment[];
}

interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
  feedId: number;
  comments?: Comment[];
  onSubmit?: (content: string, parentHash?: string) => void;
  onDelete?: (commentHash: string) => void;
  isLoading?: boolean;
}

export default function CommentModal({
  visible,
  onClose,
  feedId,
  comments = [],
  onSubmit,
  onDelete,
  isLoading = false,
}: CommentModalProps) {
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ hash: string; nickname: string } | null>(null);

  const handleSubmit = () => {
    if (commentText.trim() && onSubmit) {
      onSubmit(commentText.trim(), replyingTo?.hash);
      setCommentText('');
      setReplyingTo(null);
    }
  };

  const handleDelete = (commentHash: string) => {
    if (onDelete) {
      onDelete(commentHash);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo({ hash: comment.view_hash, nickname: comment.user.nickname });
  };

  const renderComment = ({ item, depth = 0 }: { item: Comment; depth?: number }) => (
    <View style={[styles.commentItem, depth > 0 && styles.replyItem]}>
      <View style={styles.commentHeader}>
        {item.user.profile_image ? (
          <Image
            source={{ uri: item.user.profile_image }}
            style={styles.commentAvatar}
          />
        ) : (
          <View style={[styles.commentAvatar, styles.noAvatar]}>
            <Ionicons name="person" size={16} color="#FFB7C5" />
          </View>
        )}
        <View style={styles.commentContent}>
          <View style={styles.commentTopRow}>
            <Text style={styles.commentNickname}>{item.user.nickname}</Text>
            <Text style={styles.commentDate}>
              {(item.deleted_at ? formatDate(item.deleted_at) + " 삭제됨" : formatDate(item.created_at))}
            </Text>
          </View>
          <Text style={styles.commentText}>{(item.deleted_at ? "[사용자가 삭제한 댓글 입니다]" : item.comment)}</Text>
          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => handleReply(item)}
          >
            <Text style={styles.replyButtonText}>[{item.user.nickname}] 답글</Text>
          </TouchableOpacity>
        </View>
        {item.is_owner && !item.deleted_at && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.view_hash)}
          >
            <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
          </TouchableOpacity>
        )}
      </View>
      {/* 대댓글 렌더링 */}
      {item.children && item.children.length > 0 && (
        <View style={styles.repliesContainer}>
          {item.children.map((child) => (
            <View key={child.view_hash}>
              {renderComment({ item: child, depth: depth + 1 })}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={48} color="#FFB7C5" />
      <Text style={styles.emptyText}>첫 댓글을 남겨보세요</Text>
    </View>
  );

  return (
   <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            {/* 헤더 */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>댓글</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* 댓글 목록 */}
            <FlatList
              data={comments}
              renderItem={({ item }) => renderComment({ item, depth: 0 })}
              keyExtractor={(item) => item.view_hash}
              ListEmptyComponent={renderEmptyList}
              contentContainerStyle={
                comments.length === 0
                  ? styles.emptyListContainer
                  : styles.commentList
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />

            {/* 댓글 입력 */}
            <View style={styles.inputContainer}>
              {replyingTo && (
                <View style={styles.replyingToContainer}>
                  <Text style={styles.replyingToText}>
                    {replyingTo.nickname}님에게 답글 작성 중
                  </Text>
                  <TouchableOpacity onPress={() => setReplyingTo(null)}>
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder={replyingTo ? "답글을 입력하세요..." : "댓글을 입력하세요..."}
                  placeholderTextColor="#999"
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  maxLength={500}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!commentText.trim() || isLoading) && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!commentText.trim() || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons
                      name="send"
                      size={20}
                      color={commentText.trim() ? '#FFFFFF' : '#CCC'}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE5E5',
  },
  commentScrollView: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9AA2',
  },
  closeButton: {
    padding: 4,
  },
  commentList: {
    padding: 16,
  },
  emptyListContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  commentItem: {
    marginBottom: 16,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  noAvatar: {
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentContent: {
    flex: 1,
  },
  commentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentNickname: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  replyButton: {
    marginTop: 4,
    paddingVertical: 2,
  },
  replyButtonText: {
    fontSize: 12,
    color: '#FF9AA2',
    fontWeight: '600',
  },
  replyItem: {
    marginLeft: 20,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#FFE5E5',
  },
  repliesContainer: {
    marginTop: 8,
  },
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFE5E5',
    backgroundColor: '#FFFBF7',
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF0F3',
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 12,
    color: '#FF9AA2',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  sendButton: {
    backgroundColor: '#FF9AA2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#F0F0F0',
  },
});
