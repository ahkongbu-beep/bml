import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AiSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  userPrompt?: string;
}

const AiSummaryModal: React.FC<AiSummaryModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
  userPrompt = '',
}) => {
  const [prompt, setPrompt] = useState('');
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const fadeAnim = useState(new Animated.Value(1))[0];

  const loadingMessages = [
    '최적의 답변을 고민하고 있어요...',
    '이미지를 분석하는 중입니다...',
    '잠시만 기다려 주세요...',
    '거의 완료되었습니다...',
    '곧 답변을 받으실 수 있어요!',
  ];

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();

        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isLoading, fadeAnim]);

  const handleSubmit = () => {
    if (prompt.trim()) {
      onSubmit(prompt.trim());
      setPrompt('');
    }
  };

  const handleClose = () => {
    setPrompt('');
    onClose();
  };

  // 추천 프롬프트
  const suggestedPrompts = [
    '이 음식의 레시피를 알려줘',
    '이 음식의 칼로리와 영양 정보를 알려줘',
    '이 음식과 어울리는 음식을 추천해줘',
    '이 음식의 조리 팁을 알려줘',
  ];

  // 로딩 중일 때 세련된 로딩 화면
  if (isLoading) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.loadingContainer]}>
            <View style={styles.loadingIconContainer}>
              <Ionicons name="sparkles" size={48} color="#FF9AA2" />
              <ActivityIndicator
                size="large"
                color="#FF9AA2"
                style={styles.loadingSpinner}
              />
            </View>

            {/* 사용자 질문 표시 */}
            {userPrompt && (
              <View style={styles.userPromptContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FF9AA2" />
                <Text style={styles.userPromptLabel}>질문:</Text>
                <Text style={styles.userPromptText} numberOfLines={2}>
                  {userPrompt}
                </Text>
              </View>
            )}

            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.loadingTitle}>AI 분석 중</Text>
              <Text style={styles.loadingMessage}>
                {loadingMessages[loadingMessageIndex]}
              </Text>
            </Animated.View>
            <View style={styles.loadingDotsContainer}>
              {[0, 1, 2].map((dot) => (
                <View
                  key={dot}
                  style={[
                    styles.loadingDot,
                    { opacity: (loadingMessageIndex + dot) % 3 === 0 ? 1 : 0.3 },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                {/* 헤더 */}
                <View style={styles.header}>
                  <View style={styles.titleContainer}>
                    <Ionicons name="sparkles" size={24} color="#FF9AA2" />
                    <Text style={styles.title}>AI 요약</Text>
                  </View>
                  <TouchableOpacity onPress={handleClose} disabled={isLoading}>
                    <Ionicons name="close" size={28} color="#C0C0C0" />
                  </TouchableOpacity>
                </View>

                {/* 설명 */}
                <Text style={styles.description}>
                  이미지에 대해 궁금한 점을 물어보세요!
                </Text>

                {/* 추천 프롬프트 */}
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>추천 질문</Text>
                  <View style={styles.suggestionsGrid}>
                    {suggestedPrompts.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionChip}
                        onPress={() => setPrompt(suggestion)}
                        disabled={isLoading}
                      >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 입력 필드 */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="예: 이 음식의 레시피를 알려줘"
                    placeholderTextColor="#B0B0B0"
                    value={prompt}
                    onChangeText={setPrompt}
                    multiline
                    maxLength={200}
                    editable={!isLoading}
                  />
                  <Text style={styles.charCount}>{prompt.length}/200</Text>
                </View>

                {/* 버튼 */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleClose}
                    disabled={isLoading}
                  >
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.submitButton,
                      (!prompt.trim() || isLoading) && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={!prompt.trim() || isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="send" size={18} color="#FFFFFF" />
                        <Text style={styles.submitButtonText}>요청하기</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4A4A4A',
  },
  description: {
    fontSize: 14,
    color: '#7A7A7A',
    marginBottom: 20,
    lineHeight: 20,
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7A7A7A',
    marginBottom: 10,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  suggestionText: {
    fontSize: 12,
    color: '#FF9AA2',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#4A4A4A',
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  charCount: {
    fontSize: 12,
    color: '#B0B0B0',
    textAlign: 'right',
    marginTop: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  userPromptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 36,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    gap: 8,
    maxWidth: '100%',
  },
  userPromptLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9AA2',
  },
  userPromptText: {
    flex: 1,
    fontSize: 13,
    color: '#4A4A4A',
    lineHeight: 18,
  },
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    width: 80,
    height: 80,
  },
  loadingSpinner: {
    position: 'absolute',
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A4A4A',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingMessage: {
    fontSize: 15,
    color: '#7A7A7A',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  loadingDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9AA2',
  },
    color: '#7A7A7A',
  },
  submitButton: {
    backgroundColor: '#FF9AA2',
    shadowColor: '#FF9AA2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AiSummaryModal;
