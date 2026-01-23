import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MEAL_CATEGORIES } from '../libs/utils/codes/MealCalendarCode';
import { MealItemProps } from '../libs/types/MealType';

const MealPlanItem = React.memo(({
  meal,
  handleMenuPress,
  handleDetailFeed,
  onPress,
}: MealItemProps) => {
  const API_BASE_URL = process.env.EXPO_PUBLIC_STATIC_BASE_URL;
  const category = MEAL_CATEGORIES.find((c) => c.name === meal.category_name);
  const hasImage = !!meal.image_url;

  return (
    <TouchableOpacity
      style={[styles.mealCard, { backgroundColor: category?.color || '#F5F5F5' }]}
      onPress={() => onPress?.(meal)}
      activeOpacity={0.7}
    >
      <View style={hasImage ? styles.cardContentWithImage : styles.cardContentNoImage}>
        {/* 왼쪽 이미지 영역 */}
        {hasImage && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: API_BASE_URL + meal.image_url + '_medium.webp' }}
              style={styles.mealImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* 오른쪽 내용 영역 */}
        <View style={hasImage ? styles.contentContainer : styles.contentContainerFull}>
          <View style={styles.mealHeader}>
            <View style={styles.mealCategory}>
              <Text style={styles.mealIcon}>{category?.icon || ''}</Text>
              <Text style={styles.mealCategoryName}>{meal.category_name || ''}</Text>
            </View>
            <TouchableOpacity onPress={(e) => handleMenuPress(meal, e)}>
              <Ionicons name="ellipsis-vertical" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <Text style={styles.mealTitle}>{meal.title || ''}</Text>
          <Text style={styles.mealContents} numberOfLines={hasImage ? 2 : 3}>
            {meal.contents || ''}
          </Text>
          {meal.tags && meal.tags.length > 0 && (
            <View style={styles.mealTags}>
              {meal.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag || ''}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 출처 표시 */}
          {!!meal.refer_feed_id && (
            <TouchableOpacity
                onPress={() => handleDetailFeed(meal.refer_feed_id)}
                style={styles.sourceContainer}
            >
              <Ionicons name="copy-outline" size={12} color="#999" />
              <Text style={styles.sourceText}>복사된 식단</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  mealCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  cardContentWithImage: {
    flexDirection: 'row',
    gap: 12,
  },
  cardContentNoImage: {
    flexDirection: 'column',
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentContainerFull: {
    flex: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealIcon: {
    fontSize: 20,
  },
  mealCategoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A4A4A',
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 4,
  },
  mealContents: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  mealTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#666666',
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  sourceText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default MealPlanItem;

