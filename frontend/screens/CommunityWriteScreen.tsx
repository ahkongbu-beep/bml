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
import styles from './CommunityWriteScreen.styles';

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
          Alert.alert('성공', '게시글이 등록되었습니다.', [{
              text: '확인',
              onPress: () => navigation.goBack(),
          }]);
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
