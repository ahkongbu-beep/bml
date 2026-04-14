import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Layout from '../components/Layout';
import Header from '../components/Header';
import ConfirmPortal from '../components/ConfirmPortal';
import AiSummaryMealModal from '../components/AiSummaryMealModal';
import styles from '../styles/screens/MealMyDetailScreen.style';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../libs/contexts/AuthContext';
import { diffMonthsFrom, getStaticImage } from '@/libs/utils/common';
import { LoadingPage } from '../components/Loading';
import { useMyMealDetail } from '../libs/hooks/useMeals';
import { useDeleteMeal } from '../libs/hooks/useMeals';
import { useAnalyzeMeal } from '../libs/hooks/useMeals';
import { USER_CHILD_GENDER } from '../libs/utils/codes/UserChildCode';
import { MEAL_CONDITION } from '../libs/utils/codes/FeedMealCondition';
import { toastError, toastSuccess } from '@/libs/utils/toast';
import { ErrorPage } from '../components/ErrorPage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAmountColor, getBorderColor } from '../libs/utils/codes/IngredientCode';
export default function MealMyDetailScreen({ route, navigation }: any) {
  const { mealHash, userHash } = route.params || {};
  const { user } = useAuth();
  const { data: mealData, isLoading, isError, error } = useMyMealDetail(userHash, mealHash);
  const deleteMealMutation = useDeleteMeal(mealHash);
  const analyzeMealMutation = useAnalyzeMeal();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [ deleteConfirmVisible, setDeleteConfirmVisible ] = useState(false);
  const [aiSummaryVisible, setAiSummaryVisible] = useState(false);
  const [aiSummaryData, setAiSummaryData] = useState<{
    totalScore: number;
    totalSummary: string;
    suggestions: string[];
    ingredients: { mapper_name: string; mapper_score: number; mapper_id?: string }[];
    imageUrl?: string;
    contents?: string;
  } | null>(null);

  console.log("mealData", JSON.stringify(mealData, null, 2));
  /*
    * mealData
{
  "id": 45,
  "user_id": 56,
  "title": "",
  "content": "",
  "is_published": "N",
  "meal_condition": "",
  "view_count": 8,
  "like_count": 0,
  "created_at": "2026-04-07T13:58:52",
  "updated_at": "2026-04-09T14:53:19",
  "meal_stage": 0,
  "meal_stage_detail": "",
  "category_id": 18,
  "category_name": "점심",
  "is_liked": false,
  "tags": [
    {
      "ingredient_id": 27,
      "mapped_score": 1,
      "mapped_tags": "명태"
    },
    {
      "ingredient_id": 13,
      "mapped_score": 0.6,
      "mapped_tags": "시금치"
    },
    {
      "ingredient_id": 16,
      "mapped_score": 0.6,
      "mapped_tags": "완두콩"
    },
    {
      "ingredient_id": 24,
      "mapped_score": 0.6,
      "mapped_tags": "달걀흰자"
    },
    {
      "ingredient_id": 26,
      "mapped_score": 0.6,
      "mapped_tags": "대구"
    },
    {
      "ingredient_id": 15,
      "mapped_score": 0.3,
      "mapped_tags": "콩"
    }
  ],
  "images": [
    "/attaches/Meals/45/45/aa9b0b434ef85668aa0a95ffed2e872bd6698a3dff5c85b7f7338f0ca959deb2_shared"
  ],
  "user_hash": "c99ebe8d4a50387312b8e19c077c3936ac6175ff282088a66ee9db3bb3d8d632",
  "user": {
    "id": 56,
    "nickname": "임영 민2",
    "profile_image": "https://lh3.googleusercontent.com/a/ACg8ocJjNJhAmGL_BGJhWMFZGAFJt-Fy7ilIO6xRUAT-cb37lZGjgA=s96-c",
    "user_hash": "c99ebe8d4a50387312b8e19c077c3936ac6175ff282088a66ee9db3bb3d8d632"
  },
  "childs": {
    "child_id": 82,
    "child_name": "랑구",
    "child_birth": "2026-03-17",
    "child_gender": "M",
    "is_agent": "Y",
    "allergies": [
      {
        "allergy_code": "ALLERGY_000004",
        "allergy_name": "새우"
      }
    ]
  },
  "comments": []
}
    */
  // 삭제 모달 제거
  const cancelDeleteConfirm = () => {
    setDeleteConfirmVisible(false);
  }

  // 삭제 확정
  const confirmDelete = async (mealHash: string) => {
    setDeleteConfirmVisible(false);

    try {
      const result = await deleteMealMutation.mutateAsync(mealHash);
      if (result.success) {
        toastSuccess('식단정보가 삭제되었습니다.', {
          onHide: () => navigation.navigate('MyProfile')
        });
      } else {
        toastError(result.error || '식단정보 삭제에 실패했습니다.');
      }
    } catch (error) {
      toastError('식단정보 삭제 중 오류가 발생했습니다.');
    }
  }

  const handleDelete = () => {
    setDeleteConfirmVisible(true);
  };

  const handleEdit = () => {
    navigation.navigate('FeedSave', { mealData });
  };

  const handleAiSummary = useCallback(() => {
    if (!mealData) return;

    const mappedTags = (mealData.tags || []).map((tag: any) => ({
      mapper_name: tag.mapped_tags,
      mapper_score: tag.mapped_score,
      mapper_id: String(tag.ingredient_id ?? ''),
    }));

    const ingredientList = mappedTags
      .filter((tag: any) => tag.mapper_id)
      .map((tag: any) => ({
        ingredient_id: parseInt(tag.mapper_id, 10),
        score: parseFloat(String(tag.mapper_score ?? 0)),
      }));

    analyzeMealMutation.mutate(
      {
        userHash: mealData.user?.user_hash || '',
        categoryCode: mealData.category_id || 0,
        input_date: mealData.input_date || mealData.created_at || '',
        childId: mealData.childs?.child_id || 0,
        mealStage: mealData.meal_stage || 0,
        mealStageDetail: mealData.meal_stage_detail || '',
        contents: (mealData.content || '').trim(),
        ingredients: ingredientList,
      },
      {
        onSuccess: (response: any) => {
          if (!response.success) {
            toastError(response.error || response.message || '영양 분석에 실패했습니다.');
            return;
          }

          const analysisResult = response.data;
          const totalScore = Number(analysisResult?.total_score ?? 0);
          const totalSummary = analysisResult?.total_summary ?? '';
          const suggestions = typeof analysisResult?.suggestion === 'string'
            ? analysisResult.suggestion.split('_AND_').filter((item: string) => item.trim().length > 0)
            : [];

          setAiSummaryData({
            totalScore,
            totalSummary,
            suggestions,
            ingredients: mappedTags,
            imageUrl: mealData.images?.[0] ? getStaticImage('medium', mealData.images[0]) : undefined,
            contents: mealData.content,
          });
          setAiSummaryVisible(true);
        },
        onError: () => {
          toastError('영양 분석에 실패했습니다.');
        },
      },
    );
  }, [mealData, analyzeMealMutation]);

  if (isLoading) {
    return (
      <LoadingPage title="식단정보를 불러오는 중"/>
    );
  }

  if (isError || !mealData) {
    return (
      <ErrorPage
        message="식단정보를 불러오는 중 오류가 발생했습니다."
        subMessage={error?.message}
        refetch={() => { navigation.replace('MealMyDetail', { mealHash, userHash }) }}
      />
    );
  }

  const condition = MEAL_CONDITION.find(v => v.value === mealData.meal_condition);
  const isMyFeed = user?.view_hash === mealData.user.user_hash;
  const images = (mealData.images || []).map((image: string) => getStaticImage('medium', image));
  const allergy_info = mealData.childs.allergies.map((allergy: any) => {
    return allergy.allergy_name;
  });

  return (
    <Layout>
      <View style={styles.container}>
        <Header
          title="식단정보"
          showBack={true}
          onBackPress={() => navigation.goBack()}
        />
        <ScrollView style={styles.scrollView}>
          {/* 사용자 정보 S */}
          <View style={styles.userSection}>
            <Image
              source={{
                uri: mealData.user?.profile_image ? getStaticImage('small', mealData.user.profile_image) : 'https://i.pravatar.cc/150',
              }}
              style={styles.userImage}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{mealData.user?.nickname}</Text>
              {mealData.childs && (
                <Text style={styles.timestamp}>
                  {diffMonthsFrom(mealData.childs.child_birth)} 개월 · {USER_CHILD_GENDER[mealData.childs.child_gender]}
                </Text>
              )}
              {allergy_info.length > 0 && (
                <View style={styles.allergiesContainer}>
                  {allergy_info.map((allergyName, index) => (
                    <View key={index} style={styles.allergyBadge}>
                      <Text style={styles.allergyBadgeText}>{allergyName}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            {mealData.category_name && (
              <View style={styles.categoryLabel}>
                <Text style={styles.categoryLabelText}>{mealData.category_name}</Text>
              </View>
            )}
          </View>
          {/* 사용자 정보 E */}

          {/* 이미지 섹션 */}
          {images.length > 0 && (
            <View style={styles.imageSection}>
              {images.map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image }}
                  style={styles.feedImage}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}

          {/* 내용 */}
          <View style={styles.contentSection}>
            <Text style={styles.content}>{mealData.content}</Text>
          </View>

          {/* 재료 */}
          {mealData.tags && mealData.tags.length > 0 && (
            <View style={styles.tagsSection}>
              {mealData.tags.map((tag, index) => (
                <View
                  key={index}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: getAmountColor(tag.mapped_score ?? 0.6),
                      borderColor: getBorderColor(tag.mapped_score ?? 0.6),
                    },
                  ]}
                >
                  <Text style={styles.tagText}>{tag.mapped_tags}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 통계 */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Ionicons name="heart" size={11} color="#FF9AA2" />
              <Text style={styles.statText}>도움이 되었어요</Text>
              <Text style={styles.statText}>{mealData.like_count || 0}</Text>
            </View>

            {/* 섭취 상태 - 나에게만 보이게 */}
            <View style={styles.statItem}>
              <Text style={styles.statText}>{condition ? condition.icon + " " + condition.name : ''}</Text>
            </View>
          </View>
        </ScrollView>

        {/* 액션 버튼 */}
        {isMyFeed && (
          <SafeAreaView>
            <View style={styles.actionSection}>
              {/* 영양분석 */}
              <TouchableOpacity
                style={styles.actionButtonFull}
                onPress={handleAiSummary}
                disabled={analyzeMealMutation.isPending}
              >
                <Ionicons name="sparkles" size={18} color="#FF9AA2" />
                {analyzeMealMutation.isPending && (
                  <ActivityIndicator size="small" color="#FF9AA2" style={{ marginLeft: 6 }} />
                )}
                <Text style={styles.actionButtonText}>
                  {analyzeMealMutation.isPending ? '분석 중...' : '✨영양분석'}
                </Text>
              </TouchableOpacity>

              {/* 편집 */}
              <TouchableOpacity
                style={styles.actionButtonFull}
                onPress={handleEdit}
              >
                <Ionicons name="pencil" size={18} color="#FF9AA2" />
                <Text style={styles.actionButtonText}>편집</Text>
              </TouchableOpacity>

              {/* 삭제 */}
              <TouchableOpacity
                style={[styles.actionButtonFull, styles.actionButtonDelete]}
                onPress={handleDelete}
              >
                <Ionicons name="trash" size={18} color="#FF6B6B" />
                <Text style={[styles.actionButtonText, styles.actionButtonDeleteText]}>삭제</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </View>

      <ConfirmPortal
        visible={deleteConfirmVisible}
        title="식단 제거"
        message="정말로 이 식단을 제거하시겠습니까?"
        onConfirm={() => confirmDelete(mealData.view_hash)}
        onCancel={cancelDeleteConfirm}
        confirmText="제거"
        cancelText="취소"
        confirmColor="#FF6B6B"
      />

      <AiSummaryMealModal
        visible={aiSummaryVisible}
        onClose={() => setAiSummaryVisible(false)}
        totalScore={aiSummaryData?.totalScore ?? 0}
        totalSummary={aiSummaryData?.totalSummary ?? ''}
        suggestions={aiSummaryData?.suggestions ?? []}
        ingredients={aiSummaryData?.ingredients ?? []}
        imageUrl={aiSummaryData?.imageUrl}
        contents={aiSummaryData?.contents}
      />
    </Layout>
  );
}