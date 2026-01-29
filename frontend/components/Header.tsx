import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

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

  const handleMenuPress = () => {
    navigation.navigate('MenuList' as never);
    if (onMenuPress) {
      onMenuPress();
    }
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
            <TouchableOpacity onPress={handleMenuPress} style={styles.iconButton}>
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
});
