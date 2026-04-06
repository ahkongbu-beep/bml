import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import Layout from '../components/Layout';
import Header from '../components/Header';
import ConfirmPortal from '../components/ConfirmPortal';
import styles from './MealMyDetailScreen.style';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../libs/contexts/AuthContext';
import { diffMonthsFrom, getStaticImage } from '@/libs/utils/common';
import { LoadingPage } from '../components/Loading';
import { useUserMealDetail } from '../libs/hooks/useMeals';
import { useDeleteFeed } from '../libs/hooks/useFeeds';
import { USER_CHILD_GENDER } from '../libs/utils/codes/UserChildCode';
import { MEAL_CONDITION } from '../libs/utils/codes/FeedMealCondition';
import { toastError, toastSuccess } from '@/libs/utils/toast';
import { ErrorPage } from '../components/ErrorPage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MealUserDetailScreen({ route, navigation }: any) {
  const { mealHash, userHash } = route.params || {};
  console.log('MealUserDetailScreen에 전달된 params - mealHash:', mealHash, 'userHash:', userHash);
  const resolvedUserHash = userHash;
  const { user } = useAuth();
  const { data: feed, isLoading, isError, error } = useUserMealDetail(resolvedUserHash, mealHash);
  const deleteFeedMutation = useDeleteFeed(mealHash);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [ deleteConfirmVisible, setDeleteConfirmVisible ] = useState(false);

  if (isLoading) {
    return (
      <LoadingPage
        title="식단정보를 불러오는 중"
      />
    );
  }

  if (isError || !feed) {
    return (
      <ErrorPage
        message="식단정보를 불러오는 중 오류가 발생했습니다."
        subMessage={error?.message}
        refetch={() => { navigation.replace('MealUserDetail', { mealHash, userHash: resolvedUserHash }) }}
      />
    );
  }

  const condition = MEAL_CONDITION.find(v => v.value === feed.meal_condition);
  const isMyFeed = user?.view_hash === feed.user.user_hash;
  const images = (feed.images || []).map((image: string) => getStaticImage('medium', image));
  const allergy_info = feed.childs.allergies.map((allergy: any) => {
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
                uri: feed.user?.profile_image ? getStaticImage('small', feed.user.profile_image) : 'https://i.pravatar.cc/150',
              }}
              style={styles.userImage}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{feed.user?.nickname}</Text>
              {feed.childs && (
                <Text style={styles.timestamp}>
                  {diffMonthsFrom(feed.childs.child_birth)} 개월 · {USER_CHILD_GENDER[feed.childs.child_gender]}
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
            {feed.category_name && (
              <View style={styles.categoryLabel}>
                <Text style={styles.categoryLabelText}>{feed.category_name}</Text>
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
            <Text style={styles.content}>{feed.content}</Text>
          </View>

          {/* 태그 */}
          {feed.tags && feed.tags.length > 0 && (
            <View style={styles.tagsSection}>
              {feed.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 통계 */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Ionicons name="heart" size={11} color="#FF9AA2" />
              <Text style={styles.statText}>도움이 되었어요</Text>
              <Text style={styles.statText}>{feed.like_count || 0}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Layout>
  );
}