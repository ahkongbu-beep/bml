import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useAuth } from '../libs/contexts/AuthContext';
import { useMyFeeds } from '../libs/hooks/useFeeds';
import { useGetMyInfo } from '../libs/hooks/useUsers';
import MyFeedGrid from '../components/MyFeedGrid';

import Layout from '../components/Layout';

export default function MyPageScreen({ navigation }: any) {
  const { user, isLoading } = useAuth();
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');

  if (isLoading) {
    return (
      <Layout>
        <View style={styles.container}>
          <Header title="마이페이지" showMenu={true} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF9AA2" />
          </View>
        </View>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <View style={styles.container}>
          <Header title="마이페이지" showMenu={true} />
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>사용자 정보를 불러올 수 없습니다.</Text>
          </View>
        </View>
      </Layout>
    );
  }
  const { data: myFeedsData, isLoading: feedsLoading } = useMyFeeds(user?.view_hash);
  const { data: myInfoData, isLoading: myInfoLoading } = useGetMyInfo(user?.view_hash || '');
  const myFeeds = myFeedsData?.data || [];

  return (
    <Layout>
      <View style={styles.container}>
        <Header title="마이페이지" showMenu={true} />
        <ScrollView style={styles.content}>
          {/* 프로필 섹션 */}
          <View style={styles.profileSection}>
            <Image
              source={{
                uri: user.profile_image || 'https://i.pravatar.cc/200?img=5'
              }}
              style={styles.profileImage}
            />
            <Text style={styles.nickname}>{user.nickname || 'unknown'}</Text>
            <Text style={styles.email}>{user.email}</Text>
            {user.description && (
              <Text style={styles.description}>{user.description}</Text>
            )}

            {/* 통계 */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{myInfoLoading ? 0 : myInfoData.feed_count || 0}</Text>
                <Text style={styles.statLabel}>피드</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('FeedLikeList')}
                >
                    <Text style={styles.statNumber}>{myInfoLoading ? 0 : myInfoData.like_count || 0}</Text>
                    <Text style={styles.statLabel}>좋아요</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('MealPlan')}
                >
                  <Text style={styles.statNumber}>{myInfoLoading ? 0 : myInfoData.meal_count || 0}</Text>
                  <Text style={styles.statLabel}>식단</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 프로필 수정 버튼 */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={styles.editButtonText}>프로필 수정</Text>
            </TouchableOpacity>

            {/* 피드 작성 버튼 */}
            <TouchableOpacity
              style={styles.createFeedButton}
              onPress={() => navigation.navigate('FeedSave')}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.createFeedButtonText}>피드 작성하기</Text>
            </TouchableOpacity>
          </View>

          {/* 내 피드 섹션 */}
          <View style={styles.myFeedsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>내 피드</Text>
              <TouchableOpacity onPress={() => setViewType(viewType === 'grid' ? 'list' : 'grid')}>
                <Ionicons
                  name={viewType === 'grid' ? 'list-outline' : 'grid-outline'}
                  size={26}
                  color="#FF9AA2"
                />
              </TouchableOpacity>
            </View>

            <MyFeedGrid
              feeds={myFeeds}
              isLoading={feedsLoading}
              viewType={viewType}
              onFeedPress={(feedId) => navigation.navigate('FeedDetail', { feedId })}
            />
          </View>

          {/* 메뉴 섹션 */}
          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="help-circle-outline" size={26} color="#FF9AA2" />
              <Text style={styles.menuText}>고객센터</Text>
              <Ionicons name="chevron-forward" size={22} color="#C0C0C0" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#FFFBF7',
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#FFE5E5',
  },
  nickname: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF9AA2',
    marginBottom: 6,
  },
  email: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#7A7A7A',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#FFE5E5',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#FFE5E5',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF9AA2',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 13,
    color: '#B0B0B0',
    fontWeight: '500',
  },
  editButton: {
    width: '100%',
    height: 44,
    borderWidth: 2,
    borderColor: '#FFE5E5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF9AA2',
  },
  createFeedButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#FF9AA2',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF9AA2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createFeedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F5',
  },
  errorText: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  myFeedsSection: {
    backgroundColor: '#FFFBF7',
    padding: 20,
    marginBottom: 12,
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4A4A4A',
  },
  menuSection: {
    backgroundColor: '#FFFBF7',
    marginBottom: 12,
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE5E5',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#4A4A4A',
    marginLeft: 14,
    fontWeight: '500',
  },
});
