import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';

const { width } = Dimensions.get('window');

interface Banner {
  id: number;
  title: string;
  description: string;
  color: string;
}

const SAMPLE_BANNERS: Banner[] = [
  {
    id: 1,
    title: '🎉 신규 회원 50% 할인!',
    description: '지금 가입하고 특별 혜택을 받아보세요',
    color: '#FFE5E5',
  },
  {
    id: 2,
    title: '🔥 인기 레시피 모음',
    description: '아이들이 좋아하는 건강 간식 TOP 10',
    color: '#E5F4FF',
  },
  {
    id: 3,
    title: '🌟 이달의 추천 식단',
    description: '영양 만점 우리 아이 식단표',
    color: '#F0FFE5',
  },
];

export default function BannerCarousel() {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerScrollRef = useRef<ScrollView>(null);

  const handleBannerScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (width - 32));
    setCurrentBannerIndex(index);
  };

  return (
    <View style={styles.bannerSection}>
      <View style={styles.bannerHeader}>
        <Text style={styles.bannerTitle}>🔥 Hot Deals</Text>
      </View>
      <ScrollView
        ref={bannerScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleBannerScroll}
        scrollEventThrottle={16}
        style={styles.bannerScrollView}
      >
        {SAMPLE_BANNERS.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            style={[styles.bannerCard, { backgroundColor: banner.color }]}
            onPress={() => Alert.alert('배너', banner.title)}
          >
            <Text style={styles.bannerCardTitle}>{banner.title}</Text>
            <Text style={styles.bannerCardDescription}>{banner.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.bannerIndicator}>
        {SAMPLE_BANNERS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicatorDot,
              currentBannerIndex === index && styles.indicatorDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
  },
  bannerHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A4A4A',
  },
  bannerScrollView: {
    paddingLeft: 16,
  },
  bannerCard: {
    width: width - 32,
    marginRight: 16,
    borderRadius: 16,
    padding: 24,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A4A4A',
    marginBottom: 8,
  },
  bannerCardDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  bannerIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  indicatorDotActive: {
    backgroundColor: '#FF9AA2',
    width: 24,
  },
});
