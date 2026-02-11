// frontend/components/CommentModal.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { getStaticImage, formatDate } from '../libs/utils/common';

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
  deleted_at?: string | null;
  is_owner: boolean;
  view_hash: string;
  parent_hash: string;
  user: CommentUser;
  children: Comment[];
}

interface CommentModalProps {
  onClose: () => void;
  comments?: Comment[];
  onSubmit?: (content: string, parentHash?: string) => void;
  onDelete?: (commentHash: string) => void;
  isLoading?: boolean;
}

export default function CommentModal({
  onClose,
  comments = [],
  onSubmit,
  onDelete,
  isLoading = false,
}: CommentModalProps) {
  const insets = useSafeAreaInsets();

  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ hash: string; nickname: string } | null>(null);

  /* =============================
     handlers
  ============================= */

  const handleSubmit = () => {
    if (!commentText.trim() || !onSubmit) return;

    onSubmit(commentText.trim(), replyingTo?.hash);
    setCommentText('');
    setReplyingTo(null);
  };

  const handleDelete = (hash: string) => {
    onDelete?.(hash);
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo({
      hash: comment.view_hash,
      nickname: comment.user.nickname,
    });
  };

  /* =============================
     render comment
  ============================= */

  const renderComment = ({ item, depth = 0 }: { item: Comment; depth?: number }) => (
    <View style={[styles.commentItem, depth > 0 && styles.replyItem]}>
      <View style={styles.commentHeader}>
        {item.user.profile_image ? (
          <Image
            source={{ uri: getStaticImage('small', item.user.profile_image) }}
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
              {item.deleted_at
                ? `${formatDate(item.deleted_at)} 삭제됨`
                : formatDate(item.created_at)}
            </Text>
          </View>

          <Text style={styles.commentText}>
            {item.deleted_at ? '[사용자가 삭제한 댓글 입니다]' : item.comment}
          </Text>

          <TouchableOpacity onPress={() => handleReply(item)}>
            <Text style={styles.replyButtonText}>답글</Text>
          </TouchableOpacity>
        </View>

        {item.is_owner && !item.deleted_at && (
          <TouchableOpacity onPress={() => handleDelete(item.view_hash)}>
            <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
          </TouchableOpacity>
        )}
      </View>

      {item.children?.length > 0 && (
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

  /* =============================
     render empty
  ============================= */

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={48} color="#FFB7C5" />
      <Text style={styles.emptyText}>첫 댓글을 남겨보세요</Text>
    </View>
  );

  /* =============================
     UI
  ============================= */

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>댓글</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* 댓글 리스트 */}
        <FlatList
          data={comments}
          keyExtractor={(item) => item.view_hash}
          renderItem={({ item }) => renderComment({ item })}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={
            comments.length === 0 ? styles.emptyListContainer : styles.commentList
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        {/* 하단 고정 입력창 */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 8 : 8) }]}>
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
              disabled={!commentText.trim() || isLoading}
              onPress={handleSubmit}
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
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

/* =============================
   styles
============================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE5E5',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9AA2',
  },
  headerPlaceholder: {
    width: 32,
  },
  commentList: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 4,
  },
  commentNickname: {
    fontWeight: '600',
    marginRight: 8,
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
  },
  replyButtonText: {
    color: '#FF9AA2',
    fontSize: 12,
  },
  replyItem: {
    marginLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#FFE5E5',
    paddingLeft: 12,
  },
  repliesContainer: {
    marginTop: 8,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF0F3',
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 12,
    color: '#FF9AA2',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
    backgroundColor: '#FF9AA2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
