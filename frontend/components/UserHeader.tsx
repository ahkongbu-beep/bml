import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { User } from '../libs/types/UserType';
import { getStaticImage } from '../libs/utils/common';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface UserHeaderProps {
  user: User | null;
  viewType?: "all" | "mine"; // 선택된 뷰 타입
  onChangeViewType?: (viewType: "all" | "mine") => void; // 뷰 타입 변경 함수
}

export default function UserHeader({ user, viewType, onChangeViewType }: UserHeaderProps) {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.userHeaderSection}>
      <View style={styles.userGreeting}>
        <Image
          source={{ uri: user?.profile_image ? getStaticImage('small', user.profile_image) : 'https://via.placeholder.com/50' }}
          style={styles.userProfileImage}
        />
        <View style={styles.greetingText}>
          <Text style={styles.helloText}>Hello</Text>
          <Text style={styles.userNameText}>{user?.nickname || '사용자'}님</Text>
        </View>
        <TouchableOpacity
          style={styles.myFeedButton}
          onPress={() => onChangeViewType && onChangeViewType(viewType === 'all' ? 'mine' : 'all')}
          activeOpacity={0.7}
        >
          <Ionicons name={viewType === 'all' ? 'albums' : 'person-circle'} size={14} color="#FFFFFF" />
          <Text style={styles.myFeedButtonText}>
            {viewType === 'all' ? '내 식단 보기' : '전체 식단 보기'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userHeaderSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE5E5',
  },
  userGreeting: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userProfileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFE5E5',
  },
  greetingText: {
    flex: 1,
  },
  helloText: {
    fontSize: 14,
    color: '#B0B0B0',
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A4A4A',
    marginTop: 2,
  },

  myFeedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFD4DB',
    backgroundColor: '#FF8C42',
  },
  myFeedButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
