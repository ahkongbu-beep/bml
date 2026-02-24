import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import Layout from '../components/Layout';
import Header from '../components/Header';
import ConfirmPortal from '../components/ConfirmPortal';
import styles from './FeedDetailScreen.styles';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../libs/contexts/AuthContext';
import { diffMonthsFrom, getStaticImage } from '@/libs/utils/common';
import { LoadingPage } from '../components/Loading';
import { useFeed, useDeleteFeed } from '../libs/hooks/useFeeds';
import { USER_CHILD_GENDER } from '../libs/utils/codes/UserChildCode';
import { MEAL_CONDITION } from '../libs/utils/codes/FeedMealCondition';
import { toastError, toastSuccess } from '@/libs/utils/toast';
import { ErrorPage } from '../components/ErrorPage';

export default function FeedDetailScreen({ route, navigation }: any) {
  const { feedId } = route.params;
  const { user } = useAuth();
  const { data: feed, isLoading, isError, error } = useFeed(feedId);
  const deleteFeedMutation = useDeleteFeed(feedId);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [ deleteConfirmVisible, setDeleteConfirmVisible ] = useState(false);

  // 삭제 모달 제거
  const cancelDeleteConfirm = () => {
    setDeleteConfirmVisible(false);
  }

  // 삭제 확정
  const confirmDelete = async (feedId: number) => {
    setDeleteConfirmVisible(false);

    try {
      const result = await deleteFeedMutation.mutateAsync(feedId);
      if (result.success) {
        toastSuccess('식단정보가 삭제되었습니다.', {
          onHide: () => navigation.navigate('MyPage')
        });
      } else {
        toastError(result.error || '식단정보 삭제에 실패했습니다.');
      }
    } catch (error) {
      toastError('식단정보 삭제 중 오류가 발생했습니다.');
    }
  }

  const handleDelete = (feedId) => {
    setDeleteConfirmVisible(true);
  };

  const handleEdit = () => {
    navigation.navigate('FeedSave', { feed });
  };

  if (isLoading) {
    return (
      <LoadingPage title="식단정보를 불러오는 중"/>
    );
  }

  if (isError || !feed) {
    return (
      <ErrorPage
        message="식단정보를 불러오는 중 오류가 발생했습니다."
        subMessage={error?.message}
        refetch={() => { navigation.replace('FeedDetail', { feedId }) }}
      />
    );
  }

  const condition = MEAL_CONDITION.find(v => v.value === feed.meal_condition);
  const isMyFeed = user?.view_hash === feed.user_hash;
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

            {/* 섭취 상태 - 나에게만 보이게 */}
            {isMyFeed && (
              <View style={styles.statItem}>
                <Text style={styles.statText}>{condition ? condition.icon + " " + condition.name : ''}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* 액션 버튼 */}
        {isMyFeed && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.actionButtonFull}
              onPress={handleEdit}
            >
              <Ionicons name="pencil" size={18} color="#FF9AA2" />
              <Text style={styles.actionButtonText}>편집</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButtonFull, styles.actionButtonDelete]}
              onPress={() => handleDelete(feed.id)}
            >
              <Ionicons name="trash" size={18} color="#FF6B6B" />
              <Text style={[styles.actionButtonText, styles.actionButtonDeleteText]}>삭제</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ConfirmPortal
        visible={deleteConfirmVisible}
        title="식단 제거"
        message="정말로 이 식단을 제거하시겠습니까?"
        onConfirm={() => confirmDelete(feed.id)}
        onCancel={cancelDeleteConfirm}
        confirmText="제거"
        cancelText="취소"
        confirmColor="#FF6B6B"
      />
    </Layout>
  );
}