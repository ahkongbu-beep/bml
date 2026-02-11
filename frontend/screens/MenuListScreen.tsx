/*
 * 메뉴 리스트 화면
 * 상단에는 로그인한 사람의 프로필 (영역의 오른쪽 상단에는 설정 아이콘 -> 프로필 수정 화면으로 이동)
 * 밑으로는 메뉴 리스트
  - 자녀정보
  - 좋아요 리스트
  - ai 요약 리스트
  - 이벤트
  - 공지사항
  - Q&A
  - 로그아웃
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import Layout from '../components/Layout';
import { useAuth } from '../libs/contexts/AuthContext';
import { getStaticImage } from '../libs/utils/common';
import { LoadingPage } from '../components/Loading';
import ConfirmPortal from '../components/ConfirmPortal';
import { toastError, toastSuccess } from '@/libs/utils/toast';

export default function MenuListScreen({ navigation }: any) {
  const { user, isLoading, logout, withdrawal } = useAuth();
  const [ logoutConfirmVisible, setLogoutConfirmVisible ] = React.useState(false);
  const [ withdrawalConfirmVisible, setWithdrawalConfirmVisible ] = React.useState(false);

  // 로그아웃
  const handleLogoutConfirm = () => {
    logout();
    toastSuccess('성공적으로 로그아웃되었습니다.');
    setLogoutConfirmVisible(false);
  };

  const handleLogout = () => {
    setLogoutConfirmVisible(true);
  };

  const handleWithdrawalConfirm = () => {
    withdrawal();
    toastSuccess('성공적으로 탈퇴처리되었습니다.');
    setWithdrawalConfirmVisible(false);
  };

  const handleWithdrawal = () => {
    setWithdrawalConfirmVisible(true);
  };

  if (isLoading) {
    return <LoadingPage title="메뉴를 불러오는 중" />;
  }

  if (!user) {
    return (
      <Layout>
        <View style={styles.container}>
          <Text style={styles.errorText}>사용자 정보를 불러올 수 없습니다.</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <ScrollView style={styles.container}>
        {/* 프로필 헤더 */}
        <View style={styles.profileHeader}>
          <View style={styles.profileInfo}>
            <Image
              source={{
                uri: getStaticImage('small', user.profile_image) || 'https://via.placeholder.com/60'
              }}
              style={styles.profileImage}
            />
            <View style={styles.profileText}>
              <Text style={styles.nickname}>{user.nickname || '사용자'}</Text>
              <Text style={styles.email}>{user.email}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="settings-outline" size={26} color="#4A4A4A" />
          </TouchableOpacity>
        </View>

        {/* 메뉴 리스트 */}
        <View style={styles.menuSection}>
          {/* 프로필 수정 */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="person-outline" size={24} color="#FF9AA2" />
              <Text style={styles.menuText}>프로필 수정</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#C0C0C0" />
          </TouchableOpacity>

          {/* 자녀정보 */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('RegistChild')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="people-outline" size={24} color="#FF9AA2" />
              <Text style={styles.menuText}>자녀정보</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#C0C0C0" />
          </TouchableOpacity>

          {/* 좋아요 리스트 */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('FeedLikeList')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="heart-outline" size={24} color="#FF9AA2" />
              <Text style={styles.menuText}>좋아요 리스트</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#C0C0C0" />
          </TouchableOpacity>

          {/* AI 요약 리스트 */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('SummaryList')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="sparkles-outline" size={24} color="#FF9AA2" />
              <Text style={styles.menuText}>AI 요약 리스트</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#C0C0C0" />
          </TouchableOpacity>

          {/* 이벤트 */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Alert.alert('알림', '준비중인 기능입니다.');
            }}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="gift-outline" size={24} color="#FF9AA2" />
              <Text style={styles.menuText}>이벤트</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#C0C0C0" />
          </TouchableOpacity>

          {/* 공지사항 */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Notice')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="megaphone-outline" size={24} color="#FF9AA2" />
              <Text style={styles.menuText}>공지사항</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#C0C0C0" />
          </TouchableOpacity>

          {/* Q&A */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Alert.alert('알림', '준비중인 기능입니다.');
            }}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="help-circle-outline" size={24} color="#FF9AA2" />
              <Text style={styles.menuText}>Q&A</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#C0C0C0" />
          </TouchableOpacity>

          {/* 고객센터 */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Alert.alert('알림', '준비중인 기능입니다.');
            }}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="help-circle-outline" size={24} color="#FF9AA2" />
              <Text style={styles.menuText}>고객센터</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#C0C0C0" />
          </TouchableOpacity>

          {/* 로그아웃 */}
          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
              <Text style={[styles.menuText, styles.logoutText]}>로그아웃</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleWithdrawal}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
              <Text style={[styles.menuText, styles.logoutText]}>회원탈퇴</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 로그아웃 및 퇴원탈퇴 확인 모달 */}
      <ConfirmPortal
        visible={logoutConfirmVisible}
        title="로그아웃"
        message="정말 로그아웃하시겠습니까?"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutConfirmVisible(false)}
        confirmText="로그아웃"
        cancelText="취소"
        confirmColor="#FF6B6B"
      />
      <ConfirmPortal
        visible={withdrawalConfirmVisible}
        title="회원탈퇴"
        message="정말 회원탈퇴하시겠습니까? \n모든 데이터가 삭제되며 복구할 수 없습니다."
        onConfirm={handleWithdrawalConfirm}
        onCancel={() => setWithdrawalConfirmVisible(false)}
        confirmText="회원탈퇴"
        cancelText="취소"
        confirmColor="#FF6B6B"
      />
    </Layout>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF7',
  },
  errorText: {
    fontSize: 16,
    color: '#7A7A7A',
    textAlign: 'center',
    marginTop: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE5E5',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  profileText: {
    flex: 1,
  },
  nickname: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A4A4A',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#7A7A7A',
  },
  settingsButton: {
    padding: 8,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuText: {
    fontSize: 16,
    color: '#4A4A4A',
    fontWeight: '500',
  },
  logoutItem: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  logoutText: {
    color: '#FF6B6B',
  },
});