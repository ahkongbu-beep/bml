/*
 * 커뮤니티 등록
 * 제목(title), 내용(contents), 주제 그룹(categoryCode), 비밀글여부(isSecret) 선택
 * 비밀글은 나밖에 못보는 글 여부라는걸 가이드해줘
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { useCreateCommunity } from '../libs/hooks/useCommunities';
import { useCategoryCodes } from '../libs/hooks/useCategories';

export default function CommunityWriteScreen({ navigation }: any) {
  const { data: topicGroups, isLoading: topicGroupsLoading } = useCategoryCodes("TOPIC_GROUP");
  const createCommunity = useCreateCommunity();

  const [title, setTitle] = useState('');
  const [contents, setContents] = useState('');
  const [categoryCode, setCategoryCode] = useState<number | null>(null);
  const [isSecret, setIsSecret] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // 선택된 카테고리 이름 가져오기
  const getSelectedCategoryName = () => {
    if (!categoryCode || !topicGroups) return '주제를 선택해주세요';
    const selected = topicGroups.find((cat) => cat.id === categoryCode);
    return selected ? selected.value : '주제를 선택해주세요';
  };

  // 유효성 검사
  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('알림', '제목을 입력해주세요.');
      return false;
    }
    if (!contents.trim()) {
      Alert.alert('알림', '내용을 입력해주세요.');
      return false;
    }
    if (!categoryCode) {
      Alert.alert('알림', '주제를 선택해주세요.');
      return false;
    }

    return true;
  };

  // 등록하기
  const handleSubmit = () => {
    if (!validateForm()) return;

    const data = {
      category_code: categoryCode!,
      title: title.trim(),
      contents: contents.trim(),
      is_secret: isSecret ? 'Y' : 'N',
    };

    createCommunity.mutate(data, {
      onSuccess: (response) => {
        if (response.success) {
          Alert.alert('성공', '게시글이 등록되었습니다.', [
            {
              text: '확인',
              onPress: () => navigation.goBack(),
            },
          ]);
        } else {
          Alert.alert('오류', response.message || '게시글 등록에 실패했습니다.');
        }
      },
      onError: (error) => {
        console.error('Failed to create community:', error);
        Alert.alert('오류', '게시글 등록 중 오류가 발생했습니다.');
      },
    });
  };

  if (topicGroupsLoading) {
    return (
      <Layout>
        <Header title="커뮤니티 작성" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9AA2" />
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header title="커뮤니티 작성" showBackButton onBackPress={() => navigation.goBack()} />

      <ScrollView style={styles.container}>
        {/* 주제 선택 */}
        <View style={styles.section}>
          <Text style={styles.label}>주제 *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={[styles.selectButtonText, !categoryCode && styles.placeholderText]}>
              {getSelectedCategoryName()}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#868E96" />
          </TouchableOpacity>
        </View>

        {/* 제목 입력 */}
        <View style={styles.section}>
          <Text style={styles.label}>제목 *</Text>
          <TextInput
            style={styles.input}
            placeholder="제목을 입력해주세요"
            placeholderTextColor="#ADB5BD"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <Text style={styles.charCount}>{title.length}/100</Text>
        </View>

        {/* 내용 입력 */}
        <View style={styles.section}>
          <Text style={styles.label}>내용 *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="내용을 입력해주세요"
            placeholderTextColor="#ADB5BD"
            value={contents}
            onChangeText={setContents}
            multiline
            maxLength={2000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{contents.length}/2000</Text>
        </View>

        {/* 비밀글 설정 */}
        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.label}>비밀글</Text>
              <Text style={styles.helperText}>나만 볼 수 있는 게시글로 설정합니다</Text>
            </View>
            <Switch
              value={isSecret}
              onValueChange={setIsSecret}
              trackColor={{ false: '#DEE2E6', true: '#FFB3BA' }}
              thumbColor={isSecret ? '#FF9AA2' : '#F8F9FA'}
            />
          </View>
        </View>

        {/* 등록 버튼 */}
        <TouchableOpacity
          style={[styles.submitButton, createCommunity.isPending && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={createCommunity.isPending}
        >
          {createCommunity.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>등록하기</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* 주제 선택 모달 */}
      {showCategoryModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>주제 선택</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#343A40" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {topicGroups?.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryItem}
                  onPress={() => {
                    setCategoryCode(category.id);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.categoryItemText}>{category.value}</Text>
                  {categoryCode === category.id && (
                    <Ionicons name="checkmark" size={20} color="#FF9AA2" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343A40',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#868E96',
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#343A40',
    backgroundColor: '#F8F9FA',
  },
  textArea: {
    height: 200,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#ADB5BD',
    textAlign: 'right',
    marginTop: 4,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
  },
  selectButtonText: {
    fontSize: 14,
    color: '#343A40',
  },
  placeholderText: {
    color: '#ADB5BD',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabelContainer: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#FF9AA2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#DEE2E6',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343A40',
  },
  modalContent: {
    padding: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#343A40',
  },
});