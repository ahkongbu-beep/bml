import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStaticImage } from '@/libs/utils/common';
import { getAmountColor, getBorderColor } from '../libs/utils/codes/IngredientCode';
interface AiSummaryMealModalProps {
  visible: boolean;
  onClose: () => void;
  totalScore: number;
  totalSummary: string;
  suggestions: string[];
  ingredients?: { mapper_name: string; mapper_score: number; mapper_id?: string }[];
  imageUrl?: string;
  contents?: string;
}

export default function AiSummaryMealModal({
  visible,
  onClose,
  totalScore,
  totalSummary,
  suggestions,
  ingredients,
  imageUrl,
  contents,
}: AiSummaryMealModalProps) {
  const [expandedIngredients, setExpandedIngredients] = useState(false);
  const safeScore = Math.max(0, Math.min(5, Math.round(Number(totalScore) || 0)));
  const hasPreviewSection = Boolean(imageUrl && contents?.trim());
  const extractImageId = (imagePath: string): string => {
    const match = imagePath.match(/[?&]iid=(\d+)/);
    return match ? match[1] : '';
  };

  const displayedIngredients = expandedIngredients || !ingredients || ingredients.length <= 3
    ? ingredients
    : ingredients.slice(0, 3);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>영양성분 분석</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color="#999" />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            등록된 재료를 바탕으로 식단의 영양 밸런스를 분석합니다.
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {hasPreviewSection && imageUrl && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>분석 대상</Text>
                <View style={styles.previewRow}>
                  <Image
                    key={`summary-image-${extractImageId(imageUrl) || 0}`}
                    source={{ uri: getStaticImage('medium', imageUrl) }}
                    style={styles.previewImage}
                  />
                  <View style={styles.previewTextWrap}>
                    <Text style={styles.previewLabel}>상세설명</Text>
                    <Text style={styles.previewText} numberOfLines={5}>
                      {contents}
                    </Text>
                    {Array.isArray(ingredients) && ingredients.length > 0 && (
                      <View style={styles.ingredientsList}>
                        <View style={styles.ingredientsWrap}>
                          {displayedIngredients.map((ing, idx) => {
                            const score = parseFloat(ing.mapper_score);
                            const bgColor = getAmountColor(score);
                            const borderColor = getBorderColor(score);
                            return (
                              <Text
                                key={`ing-${idx}`}
                                style={[
                                  styles.ingredientLabel,
                                  {
                                    backgroundColor: bgColor,
                                    color: borderColor,
                                  }
                                ]}
                              >
                                {ing.mapper_name}
                              </Text>
                            );
                          })}
                        </View>
                        {ingredients.length > 3 && (
                          <TouchableOpacity
                            style={styles.expandButton}
                            onPress={() => setExpandedIngredients(!expandedIngredients)}
                          >
                            <Text style={styles.expandButtonText}>
                              {expandedIngredients ? '−' : '+'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>영양 균형 점수</Text>
              <View style={styles.starBlock}>
                <View style={styles.starRow}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Ionicons
                      key={`star-${index}`}
                      name={index < safeScore ? 'star' : 'star-outline'}
                      size={22}
                      color="#FFC107"
                    />
                  ))}
                </View>
                <Text style={styles.scoreText}>{safeScore} / 5 점</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>식단 총평</Text>
              <Text style={styles.bodyText}>{totalSummary || '-'}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>개선사항</Text>
              {suggestions.length > 0 ? (
                suggestions.map((item, idx) => (
                  <View key={`suggestion-${idx}`} style={styles.bulletRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bodyText}>{item}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.bodyText}>-</Text>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  container: {
    maxHeight: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 14,
  },
  section: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#444',
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  previewImage: {
    width: 88,
    height: 88,
    borderRadius: 10,
    resizeMode: 'cover',
    backgroundColor: '#F5F5F5',
  },
  previewTextWrap: {
    flex: 1,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#777',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
    marginBottom: 8,
  },
  ingredientsList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 6,
  },
  ingredientsWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ingredientLabel: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  expandButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButtonText: {
    fontSize: 14,
    color: '#FF9AA2',
    fontWeight: '700',
    lineHeight: 18,
  },
  starBlock: {
    alignItems: 'center',
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    marginTop: 8,
    fontSize: 13,
    color: '#444',
    fontWeight: '700',
    textAlign: 'center',
  },
  bodyText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bullet: {
    fontSize: 14,
    color: '#666',
    marginRight: 6,
    lineHeight: 20,
  },
  closeButton: {
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9AA2',
    borderRadius: 10,
    paddingVertical: 12,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
