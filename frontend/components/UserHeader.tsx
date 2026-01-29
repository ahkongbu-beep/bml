import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { User } from '../libs/types/UserType';
import { getStaticImage } from '../libs/utils/common';

interface UserHeaderProps {
  user: User | null;
}

export default function UserHeader({ user }: UserHeaderProps) {

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
});
