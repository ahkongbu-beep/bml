import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ChildSelectItem {
  id: number;
  child_name: string;
  child_birth: string;
  child_gender: 'M' | 'W';
  is_agent: string;
}

interface Props {
  visible: boolean;
  children: ChildSelectItem[];
  onSelect: (childId: number) => void;
  onClose: () => void;
}

export default function GrowthChildSelectModal({ visible, children, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>어떤 아이의 기록인가요?</Text>

          {children.map((child) => (
            <TouchableOpacity
              key={child.id}
              style={styles.childItem}
              activeOpacity={0.8}
              onPress={() => onSelect(child.id)}
            >
              <View style={[
                styles.genderBadge,
                child.child_gender === 'M' ? styles.genderM : styles.genderW,
              ]}>
                <Text style={styles.genderText}>
                  {child.child_gender === 'M' ? '남' : '여'}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.childName}>{child.child_name}</Text>
                <Text style={styles.childBirth}>{child.child_birth}</Text>
              </View>

              {child.is_agent === 'Y' && (
                <View style={styles.agentBadge}>
                  <Text style={styles.agentBadgeText}>대표</Text>
                </View>
              )}

              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    gap: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3A3A3A',
    marginBottom: 8,
    textAlign: 'center',
  },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F3F3',
  },
  genderBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderM: { backgroundColor: '#EEF5FF' },
  genderW: { backgroundColor: '#FFF0F3' },
  genderText: { fontSize: 13, fontWeight: '700', color: '#4A4A4A' },
  childName: { fontSize: 15, fontWeight: '700', color: '#3A3A3A' },
  childBirth: { fontSize: 12, color: '#999', marginTop: 2 },
  agentBadge: {
    backgroundColor: '#FFF0E0',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  agentBadgeText: { fontSize: 11, fontWeight: '700', color: '#E07B00' },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#888' },
});
