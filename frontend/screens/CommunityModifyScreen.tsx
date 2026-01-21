/*
 * 커뮤니티 수정
 * 제목(title), 내용(contents), 비밀글여부(isSecret) 수정 가능
 * 주제 그룹(categoryCode) 은 수정 불가
 * 비밀글은 나밖에 못보는 글 여부라는걸 가이드해줘
 */

import React, { useEffect, useState } from 'react';
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
import { useGetDetailCommunity, useUpdateCommunity } from '../libs/hooks/useCommunities';
import { useCategoryCodes } from '../libs/hooks/useCategories';
import { LoadingPage } from '../components/Loading';

export default function CommunityModifyScreen({ route, navigation }: any) {
  const { viewHash } = route.params || {};
  const { data: topicGroups, isLoading: topicGroupsLoading } = useCategoryCodes("TOPIC_GROUP");
  const getDetailCommunity = useGetDetailCommunity();
  const updateCommunity = useUpdateCommunity();

  // 변수 초기화
  const [title, setTitle] = useState('');
  const [contents, setContents] = useState('');
  const [categoryCode, setCategoryCode] = useState<number | null>(null);
  const [isSecret, setIsSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 기존 데이터 불러오기
  useEffect(() => {
    if (viewHash) {
      getDetailCommunity.mutate(viewHash, {
        onSuccess: (response) => {
          if (response.success && response.data) {
            setTitle(response.data.title);
            setContents(response.data.contents);
            setCategoryCode(response.data.category_code);
            setIsSecret(response.data.is_secret === 'Y');
          } else {
            Alert.alert('오류', response.error || '게시글을 불러올 수 없습니다.');
            navigation.goBack();
          }
          setIsLoading(false);
        },
        onError: (error) => {
          console.error('Failed to load community:', error);
          Alert.alert('오류', '게시글을 불러오는 중 오류가 발생했습니다.');
          navigation.goBack();
        },
      });
    }
  }, [viewHash]);

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
    return true;
  };

  // 수정하기
  const handleSubmit = () => {
    if (!validateForm()) return;

    const data = {
      title: title.trim(),
      contents: contents.trim(),
      is_secret: isSecret ? 'Y' : 'N',
    };

    updateCommunity.mutate({ view_hash: viewHash, data }, {
      onSuccess: (response) => {
        if (response.success) {
          Alert.alert('성공', '게시글이 수정되었습니다.', [
            {
              text: '확인',
              onPress: () => navigation.navigate('Community'),
            },
          ]);
        } else {
          Alert.alert('오류', response.message || '게시글 수정에 실패했습니다.');
        }
      },
      onError: (error) => {
        console.error('Failed to update community:', error);
        Alert.alert('오류', '게시글 수정 중 오류가 발생했습니다.');
      },
    });
  };

  if (topicGroupsLoading || isLoading) {
    return (
      <LoadingPage title="화면을 구성하는 중입니다."/>
    );
  }

  return (
    <Layout>
      <Header title="커뮤니티 수정" showBackButton onBackPress={() => navigation.goBack()} />

      <ScrollView style={styles.container}>
        {/* 주제 (수정 불가) */}
        <View style={styles.section}>
          <Text style={styles.label}>주제 (수정 불가)</Text>
          <View style={[styles.selectButton, styles.selectButtonDisabled]}>
            <Text style={styles.selectButtonText}>
              {getSelectedCategoryName()}
            </Text>
            <Ionicons name="lock-closed" size={18} color="#ADB5BD" />
          </View>
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

        {/* 수정 버튼 */}
        <TouchableOpacity
          style={[styles.submitButton, updateCommunity.isPending && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={updateCommunity.isPending}
        >
          {updateCommunity.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>수정하기</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  selectButtonDisabled: {
    backgroundColor: '#E9ECEF',
    opacity: 0.6,
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