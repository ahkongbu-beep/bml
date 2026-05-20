import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Text,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Feed } from '../libs/types/FeedType';
import { getStaticImage } from '../libs/utils/common';
import { useToggleScrap, useToggleScrapPin } from '../libs/hooks/useFeeds';

interface ScrapGridProps {
  scraps: Feed[];
  isLoading: boolean;
  onScrapPress: (mealHash: string, userHash: string) => void;
}

export default function ScrapGrid({ scraps, isLoading, onScrapPress }: ScrapGridProps) {
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const { mutate: toggleScrap, isPending: isUnscrapPending } = useToggleScrap();
  const { mutate: togglePin, isPending: isPinPending } = useToggleScrapPin();

  const handleLongPress = (viewHash: string) => {
    setSelectedHash(viewHash === selectedHash ? null : viewHash);
  };

  const handleUnscrap = (viewHash: string) => {
    Alert.alert('스크랩 해제', '이 식단을 스크랩에서 해제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '해제',
        style: 'destructive',
        onPress: () => {
          toggleScrap(viewHash, { onSuccess: () => setSelectedHash(null) });
        },
      },
    ]);
  };

  const handlePin = (viewHash: string) => {
    togglePin(viewHash, { onSuccess: () => setSelectedHash(null) });
  };

  if (isLoading) {
    return (
      <View style={styles.feedLoadingContainer}>
        <ActivityIndicator size="small" color="#FF9AA2" />
      </View>
    );
  }

  if (!scraps || scraps.length === 0) {
    return (
      <View style={styles.emptyFeedContainer}>
        <Ionicons name="bookmark-outline" size={48} color="#DDD" />
        <Text style={styles.emptyFeedText}>아직 스크랩한 식단이 없습니다</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={() => setSelectedHash(null)}>
      <View style={styles.feedGrid}>
        {scraps.map((scrap) => {
          const isSelected = selectedHash === scrap.view_hash;
          return (
            <View key={scrap.id} style={styles.feedItem}>
              <TouchableOpacity
                style={styles.imageWrapper}
                onPress={() => {
                  if (selectedHash) {
                    setSelectedHash(null);
                  } else {
                    onScrapPress(scrap.view_hash, scrap.user?.user_hash || '');
                  }
                }}
                onLongPress={() => handleLongPress(scrap.view_hash)}
                delayLongPress={400}
              >
                <Image
                  source={{ uri: scrap.image_url ? getStaticImage('medium', scrap.image_url) : '' }}
                  style={[styles.feedImage, isSelected && styles.feedImageDim]}
                />
                {scrap.is_pinned && !isSelected && (
                  <View style={styles.pinBadge}>
                    <Ionicons name="pin" size={12} color="#FFF" />
                  </View>
                )}
                {isSelected && (
                  <View style={styles.actionOverlay}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handlePin(scrap.view_hash)}
                      disabled={isPinPending}
                    >
                      <Ionicons name="pin" size={18} color="#FFF" />
                      <Text style={styles.actionBtnText}>핀 고정</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnDanger]}
                      onPress={() => handleUnscrap(scrap.view_hash)}
                      disabled={isUnscrapPending}
                    >
                      <Ionicons name="bookmark-outline" size={18} color="#FFF" />
                      <Text style={styles.actionBtnText}>해제</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </TouchableWithoutFeedback>
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
  imageWrapper: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFF5F0',
  },
  feedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#FFF5F0',
  },
  feedImageDim: {
    opacity: 0.4,
  },
  pinBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF9AA2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  actionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF9AA2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  actionBtnDanger: {
    backgroundColor: '#888',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
});
