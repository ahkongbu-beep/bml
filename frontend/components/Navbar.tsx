import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export default function Navbar({ currentRoute, onNavigate }: NavbarProps) {
  const insets = useSafeAreaInsets();
  const navItems = [
    { name: 'MealPlan', icon: 'calendar', label: '식단' },
    { name: 'FeedList', icon: 'home', label: '피드' },
    { name: 'Community', icon: 'people', label: '커뮤니티' },
    { name: 'Notice', icon: 'create', label: '공지사항' },
    { name: 'MyPage', icon: 'person', label: '마이' },
  ];

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {navItems.map((item) => {
        const isActive = currentRoute === item.name;
        return (
          <TouchableOpacity
            key={item.name}
            style={styles.navItem}
            onPress={() => onNavigate(item.name)}
          >
            <Ionicons
              name={isActive ? item.icon : `${item.icon}-outline`}
              size={24}
              color={isActive ? '#FF6B6B' : '#999'}
            />
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  activeLabel: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
});
