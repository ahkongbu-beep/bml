// 차단 목록 페이지
// frontend/screens/DenyUserScreen.tsx

// 스타일 임포트
import styles from './DenyUserScreen.styles';

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { useAuth } from '../libs/contexts/AuthContext';
import { useDenyUsers, useUnblockUser } from '../libs/hooks/useDenyUsers';
import { formatDate } from '../libs/utils/common';
import { DenyUser } from '../libs/types/DenyUserType';

export default function DenyUserScreen({ navigation }: any) {
  const { view_hash } = useAuth();
  const { data: denyUsers, isLoading } = useDenyUsers();
  const unBlockUserMutation = useUnblockUser(); // 파라미터 없이 호출
  const denyUsersData = denyUsers;

  const handleUnblock = (user_hash: string, nickname: string) => {
    Alert.alert(
      '차단 해제',
      `${nickname}님의 차단을 해제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '해제',
          onPress: () => {
            unBlockUserMutation.mutate({ deny_user_hash: user_hash }, {
              onSuccess: () => {
                Alert.alert('완료', `${nickname}님의 차단을 해제했습니다.`);
              },
              onError: (error) => {
                Alert.alert('오류', '차단 해제에 실패했습니다. 다시 시도해주세요.');
              }
            });
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: DenyUser }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        {item.profile_image ? (
          <Image
            source={{ uri: item.profile_image }}
            style={styles.profileImage}
          />
        ) : (
          <View style={[styles.profileImage, styles.noImage]}>
            <Ionicons name="person" size={24} color="#FFB7C5" />
          </View>
        )}
        <View style={styles.userDetails}>
          <Text style={styles.nickname}>{item.nickname}</Text>
          <Text style={styles.blockedDate}>
            차단일: {formatDate(item.blocked_at)}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblock(item.user_hash, item.nickname)}
      >
        <Text style={styles.unblockButtonText}>차단 해제</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color="#FFB7C5" />
      <Text style={styles.emptyText}>차단한 사용자가 없습니다</Text>
      <Text style={styles.emptySubText}>
        차단한 사용자의 게시물은 보이지 않습니다
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <Layout>
        <View style={styles.container}>
          <Header
            title="차단 목록"
            showBack={true}
            onBackPress={() => navigation.goBack()}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF9AA2" />
          </View>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header
        title="차단 목록"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />
      <View style={styles.container}>
        <FlatList
          data={denyUsersData}
          renderItem={renderItem}
          keyExtractor={(item) => item.user_hash.toString()}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={
            denyUsersData.length === 0 ? styles.emptyListContainer : styles.listContainer
          }
        />
      </View>
    </Layout>
  );
}