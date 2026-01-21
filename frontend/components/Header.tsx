import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../libs/contexts/AuthContext';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showMenu?: boolean;
  onMenuPress?: () => void;
  leftButton?: {
    icon?: string;
    text?: string;
    onPress: () => void;
  };
  rightButton?: {
    icon?: string;
    text?: string;
    onPress: () => void;
  };
}

export default function Header({
  title,
  showBack = false,
  onBackPress,
  showMenu = false,
  onMenuPress,
  leftButton,
  rightButton
}: HeaderProps) {

  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 60, right: 16 });
  const menuButtonRef = useRef<TouchableOpacity>(null);
  const { user, logoutLocal } = useAuth();

  const handleMenuPress = () => {
    if (menuButtonRef.current) {
      menuButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setMenuPosition({
          top: pageY + height - 2,
          right: Dimensions.get('window').width - pageX - width,
        });
        setMenuVisible(!menuVisible);
        if (onMenuPress) {
          onMenuPress();
        }
      });
    } else {
      setMenuVisible(!menuVisible);
      if (onMenuPress) {
        onMenuPress();
      }
    }
  };

  const handleLogout = async () => {
    setMenuVisible(false);
    await logoutLocal();
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color="#FF9AA2" />
            </TouchableOpacity>
          )}
          {leftButton && (
            <TouchableOpacity onPress={leftButton.onPress} style={styles.iconButton}>
              {leftButton.icon && <Ionicons name={leftButton.icon as any} size={24} color="#FF9AA2" />}
              {leftButton.text && <Text style={styles.buttonText}>{leftButton.text}</Text>}
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.rightContainer}>
          {showMenu && (
            <TouchableOpacity ref={menuButtonRef} onPress={handleMenuPress} style={styles.iconButton}>
              <Ionicons name="menu" size={24} color="#FF9AA2" />
            </TouchableOpacity>
          )}
          {rightButton && (
            <TouchableOpacity onPress={rightButton.onPress} style={styles.iconButton}>
              {rightButton.icon && <Ionicons name={rightButton.icon as any} size={24} color="#FF9AA2" />}
              {rightButton.text && <Text style={styles.buttonText}>{rightButton.text}</Text>}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showMenu && menuVisible && (
        <View style={[
          styles.menuBox,
          { top: menuPosition.top, right: menuPosition.right }
        ]}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('MyPage' as never);
            }}
          >
            <Text style={styles.menuItemText}>프로필</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('FeedLikeList' as never);
            }}
          >
            <Text style={styles.menuItemText}>좋아요 목록</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('SummaryList' as never);
            }}
          >
            <Text style={styles.menuItemText}>AI 요약</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('DenyUser' as never);
            }}
          >
            <Text style={styles.menuItemText}>차단목록</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.lastMenuItem]}
            onPress={handleLogout}
          >
            <Text style={styles.menuItemText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#FFFBF7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE5E5',
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
    position: 'relative',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF9AA2',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  iconButton: {
    padding: 4,
  },
  menuBox: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 150,
    zIndex: 9999,
  },
  menuItem: {
    paddingRight: 14,
    paddingLeft: 14,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE5E5',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 16,
    color: '#4A4A4A',
  },
});
