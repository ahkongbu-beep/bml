import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Feed {
  id: number;
  title?: string;
  content?: string;
  images?: string[];
  created_at?: string;
  like_count?: number;
  comment_count?: number;
}

interface MyFeedGridProps {
  feeds: Feed[];
  isLoading: boolean;
  viewType: 'grid' | 'list';
  onFeedPress: (feedId: number) => void;
}

export default function MyFeedGrid({
  feeds,
  isLoading,
  viewType,
  onFeedPress
}: MyFeedGridProps) {
  if (isLoading) {
    return (
      <View style={styles.feedLoadingContainer}>
        <ActivityIndicator size="small" color="#FF9AA2" />
      </View>
    );
  }

  if (feeds.length === 0) {
    return (
      <View style={styles.emptyFeedContainer}>
        <Ionicons name="camera-outline" size={48} color="#DDD" />
        <Text style={styles.emptyFeedText}>아직 작성한 피드가 없습니다</Text>
      </View>
    );
  }

  if (viewType === 'grid') {
    return (
      <View style={styles.feedGrid}>
        {feeds.map((feed) => (
          <TouchableOpacity
            key={feed.id}
            style={styles.feedItem}
            onPress={() => onFeedPress(feed.id)}
          >
            <Image
              source={{ uri: feed.images?.[0] || 'https://via.placeholder.com/400' }}
              style={styles.feedImage}
            />
            {feed.images && feed.images.length > 1 && (
              <View style={styles.multiImageBadge}>
                <Ionicons name="images" size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // List view
  return (
    <View style={styles.feedList}>
      {feeds.map((feed) => (
        <TouchableOpacity
          key={feed.id}
          style={styles.feedListItem}
          onPress={() => onFeedPress(feed.id)}
        >
          <Image
            source={{ uri: feed.images?.[0] || 'https://via.placeholder.com/400' }}
            style={styles.feedListImage}
          />
          <View style={styles.feedListContent}>
            <Text style={styles.feedListTitle} numberOfLines={2}>
              {feed.title || feed.content || '제목 없음'}
            </Text>
            <View style={styles.feedListStats}>
              <View style={styles.feedListStatItem}>
                <Ionicons name="heart" size={14} color="#FF9AA2" />
                <Text style={styles.feedListStatText}>{feed.like_count || 0}</Text>
              </View>
              <View style={styles.feedListStatItem}>
                <Ionicons name="chatbubble" size={14} color="#C0C0C0" />
                <Text style={styles.feedListStatText}>{feed.comment_count || 0}</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C0C0C0" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  feedLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFeedContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFeedText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  // Grid styles
  feedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  feedItem: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 4,
  },
  feedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#FFF5F0',
  },
  multiImageBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  // List styles
  feedList: {
    gap: 12,
  },
  feedListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  feedListImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#FFF5F0',
  },
  feedListContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  feedListTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 8,
    lineHeight: 20,
  },
  feedListStats: {
    flexDirection: 'row',
    gap: 12,
  },
  feedListStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  feedListStatText: {
    fontSize: 13,
    color: '#B0B0B0',
    fontWeight: '500',
  },
});
