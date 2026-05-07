import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
  Linking,
} from 'react-native';
import { getStaticImage } from '@/libs/utils/common';

export type AdFeedItem = {
  is_ad: true;
  id: number;
  contents: string;
  target_link?: string | null;
  image_url?: string | string[] | null;
  view_hash: string;
  user: {
    profile_image: string;
    nickname: string;
    id: number | string;
    user_hash: string;
  };
};

type Props = {
  item: AdFeedItem;
};

const normalizeAdImages = (raw: AdFeedItem['image_url']): string[] => {
  if (Array.isArray(raw)) {
    return raw.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
        }
      } catch {
        // Fall through to next parser.
      }
    }

    if (trimmed.includes(',')) {
      return trimmed.split(',').map(v => v.trim()).filter(Boolean);
    }

    return [trimmed];
  }

  return [];
};

const normalizeTargetLink = (raw?: string | null): string | null => {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export default function AdItem({ item, onAdClick }: Props & { onAdClick: (view_hash: string) => void }) {
  const { width } = useWindowDimensions();
  const imageWidth = width - 28;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const adImages = useMemo(() => normalizeAdImages(item.image_url).slice(0, 10), [item.image_url]);
  const targetLink = useMemo(() => normalizeTargetLink(item.target_link), [item.target_link]);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = imageWidth > 0 ? Math.round(x / imageWidth) : 0;
    setCurrentImageIndex(index);
  };

  return (
    <View style={styles.card}>
      <View style={styles.topBar}>
        <View style={styles.profileWrap}>
          <Image
            source={{ uri: getStaticImage('thumbnail', item.user.profile_image) }}
            style={styles.profileImage}
          />
          <Text style={styles.profileNickname} numberOfLines={1}>{item.user.nickname}</Text>
        </View>
        <View style={styles.badgeWrap}>
          <Text style={styles.badgeText}>AD</Text>
        </View>
      </View>

      {adImages.length > 1 ? (
        <View>
          <FlatList
            data={adImages}
            keyExtractor={(img, idx) => `${item.id}-${idx}-${img}`}
            renderItem={({ item: imagePath }) => (
              <Image
                source={{ uri: getStaticImage('large', imagePath) }}
                style={[styles.image, { width: imageWidth }]}
              />
            )}
            horizontal
            pagingEnabled
            nestedScrollEnabled
            directionalLockEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
            decelerationRate="fast"
          />
          <View style={styles.dotWrap}>
            {adImages.map((_, index) => (
              <View
                key={`ad-${item.id}-dot-${index}`}
                style={[styles.dot, currentImageIndex === index && styles.dotActive]}
              />
            ))}
          </View>
        </View>
      ) : (
        <Image
          source={{ uri: getStaticImage('large', adImages[0] || '') }}
          style={[styles.image, { width: imageWidth }]}
        />
      )}
      <View style={styles.contentWrap}>
        <Text style={styles.contents}>{item.contents}</Text>
      </View>
      <View style={styles.confirmRow}>
        <TouchableOpacity
          activeOpacity={targetLink ? 0.85 : 1}
          style={[styles.confirmButton, !targetLink && styles.confirmButtonDisabled]}
          onPress={() => onAdClick(item.view_hash)}
          disabled={!targetLink}
        >
          <View style={styles.confirmButtonRow}>
            <Text style={styles.confirmButtonText}>더 알아보기</Text>
            <Text style={styles.confirmButtonArrow}>{'>'}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0E2CE',
  },
  topBar: {
    height: 48,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
  },
  badgeWrap: {
    backgroundColor: '#222',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  profileWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 220,
  },
  profileImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#EEE',
  },
  profileNickname: {
    color: '#333',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  image: {
    height: 180,
    backgroundColor: '#F7F7F7',
  },
  dotWrap: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: {
    width: 16,
    backgroundColor: '#FFFFFF',
  },
  confirmRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F4F4F4',
  },
  confirmButton: {
    width: '100%',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EFE8DB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  confirmButtonDisabled: {
    backgroundColor: '#F6F6F6',
    borderColor: '#EFEFEF',
  },
  confirmButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmButtonText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '700',
    textAlign: 'left',
  },
  confirmButtonArrow: {
    fontSize: 15,
    color: '#777',
    fontWeight: '700',
  },
  contentWrap: {
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 12,
  },
  contents: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
});
