import { StyleSheet } from 'react-native';
import { commonStyles, colors, shadows } from './common.styles';

const styles = StyleSheet.create({
  // 공통 스타일 사용
  container: commonStyles.container,
  scrollView: commonStyles.scrollView,

  // 화면 특화 스타일
  content: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A4A4A',
    marginBottom: 12,
  },
  required: {
    color: '#FF6B6B',
  },
  imageSection: {
    marginBottom: 24,
  },
  imageList: {
    flexDirection: 'row',
    gap: 12,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#FFF5F0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  addImageButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#FFF5F0',
    borderWidth: 2,
    borderColor: '#FFE5E5',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 13,
    color: '#FFB6C1',
    marginTop: 8,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 24,
  },
  titleInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE5E5',
    borderRadius: 12,
    padding: 16,
  },
  contentInput: {
    fontSize: 16,
    color: '#4A4A4A',
    minHeight: 200,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE5E5',
    borderRadius: 12,
    padding: 16,
    lineHeight: 24,
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  categoryScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFE5E5',
    backgroundColor: '#FFFFFF',
    marginRight: 10,
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: '#FF9AA2',
    borderColor: '#FF9AA2',
  },
  tagsSection: {
    marginBottom: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE5E5',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  tagsInput: {
    flex: 1,
    fontSize: 14,
    color: '#4A4A4A',
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE5E5',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 150,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE5E5',
  },
  suggestionText: {
    fontSize: 14,
    color: '#FF9AA2',
    fontWeight: '600',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#FF9AA2',
    fontWeight: '600',
  },
  publicSection: {
    marginBottom: 24,
  },
  publicButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  publicButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFE5E5',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  publicButtonActive: {
    backgroundColor: '#FF9AA2',
    borderColor: '#FF9AA2',
  },
  publicButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF9AA2',
  },
  publicButtonTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#FFE5E5',
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButton: {
    backgroundColor: '#FF9AA2',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF9AA2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default styles;