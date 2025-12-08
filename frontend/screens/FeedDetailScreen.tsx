import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useFeed, useDeleteFeed } from '../libs/hooks/useFeeds';
import { useAuth } from '../libs/hooks/useAuth';
import Layout from '../components/Layout';

export default function FeedDetailScreen({ route, navigation }: any) {
  const { feedId } = route.params;
  const { user } = useAuth();
  const { data: feed, isLoading } = useFeed(feedId);
  const deleteFeedMutation = useDeleteFeed();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleDelete = () => {
    Alert.alert(
      '피드 삭제',
      '정말로 이 피드를 삭제하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFeedMutation.mutateAsync(feedId);
              Alert.alert('성공', '피드가 삭제되었습니다.', [
                { text: '확인', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert('오류', '피드 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('FeedSave', { feed });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  if (isLoading || !feed) {
    return (
      <Layout>
        <View style={styles.container}>
          <Header
            title="피드 상세"
            showBack={true}
            onBackPress={() => navigation.goBack()}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF9AA2" />
          </View>
        </View>
      </Layout>
    );
  }

  const isMyFeed = user?.view_hash === feed.user_hash;
  const images = feed.images || [];

  return (
    <Layout>
      <View style={styles.container}>
        <Header
          title="피드 상세"
          showBack={true}
          onBackPress={() => navigation.goBack()}
        />
        <ScrollView style={styles.scrollView}>
          {/* 사용자 정보 */}
          <View style={styles.userSection}>
            <Image
              source={{
                uri: feed.user?.profile_image || 'https://i.pravatar.cc/150',
              }}
              style={styles.userImage}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{feed.user?.nickname || '익명'}</Text>
              <Text style={styles.feedDate}>{formatDate(feed.created_at)}</Text>
            </View>
            {isMyFeed && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEdit}
                >
                  <Ionicons name="pencil" size={20} color="#FF9AA2" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 이미지 섹션 */}
          {images.length > 0 && (
            <View style={styles.imageSection}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(event) => {
                  const index = Math.round(
                    event.nativeEvent.contentOffset.x /
                      event.nativeEvent.layoutMeasurement.width
                  );
                  setCurrentImageIndex(index);
                }}
                scrollEventThrottle={16}
              >
                {images.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: image }}
                    style={styles.feedImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              {images.length > 1 && (
                <View style={styles.imageIndicator}>
                  <Text style={styles.imageIndicatorText}>
                    {currentImageIndex + 1} / {images.length}
                  </Text>
                </View>
              )}
            </View>
          )}


          {/* 제목 */}
          {feed.title && (
            <View style={styles.titleSection}>
              <Text style={styles.title}>{feed.title}</Text>
            </View>
          )}

          {/* 내용 */}
          <View style={styles.contentSection}>
            <Text style={styles.content}>{feed.content}</Text>
          </View>

          {/* 태그 */}
          {feed.tags && feed.tags.length > 0 && (
            <View style={styles.tagsSection}>
              {feed.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 통계 */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Ionicons name="heart" size={20} color="#FF9AA2" />
              <Text style={styles.statText}>{feed.like_count || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="eye" size={20} color="#999" />
              <Text style={styles.statText}>{feed.view_count || 0}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF7',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSection: {
    position: 'relative',
  },
  feedImage: {
    width: 400,
    height: 400,
    backgroundColor: '#FFF5F0',
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE5E5',
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  feedDate: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  titleSection: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    lineHeight: 28,
  },
  contentSection: {
    padding: 16,
    paddingTop: 8,
  },
  content: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 24,
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  tag: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: '#FF9AA2',
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: '#FFE5E5',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
});
