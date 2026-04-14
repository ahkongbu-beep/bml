import { StyleSheet } from 'react-native';
import { commonStyles } from './common.styles';

const styles = StyleSheet.create({
  // 공통 스타일
  container: commonStyles.container,
  content: commonStyles.content,

  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // 섹션
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A4A4A',
    marginBottom: 12,
  },

  // 이미지 미리보기
  imageScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    gap: 4,
  },
  imageOverlayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helperText: {
    fontSize: 12,
    color: '#7A7A7A',
    marginTop: 8,
    lineHeight: 16,
  },

  // 날짜 선택
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    gap: 8,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  calendarContainer: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },

  // 카테고리 선택
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
  categoryIcon: {
    fontSize: 18,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A7A7A',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },

  // 입력 필드
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#4A4A4A',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#B0B0B0',
    textAlign: 'right',
    marginTop: 6,
  },

  // 안내 박스
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F0',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    gap: 10,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#7A7A7A',
    lineHeight: 20,
  },

  // 버튼
  submitButton: {
    backgroundColor: '#FF9AA2',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF9AA2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#E0E0E0',
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // 재료 선택
  ingredientCatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFE0E5',
    backgroundColor: '#FAFAFA',
  },
  ingredientCatChipActive: {
    backgroundColor: '#FF9AA2',
    borderColor: '#FF9AA2',
  },
  ingredientCatIcon: {
    fontSize: 13,
  },
  ingredientCatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
  },
  ingredientCatLabelActive: {
    color: '#FFFFFF',
  },
  ingredientListBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFE5E5',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 4,
  },
  ingredientSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFF8F9',
  },
  ingredientSearchInput: {
    flex: 1,
    fontSize: 12,
    color: '#2D2D2D',
    paddingVertical: 0,
  },
  ingredientListDivider: {
    height: 1,
    backgroundColor: '#FFE5E5',
  },
  ingredientScrollList: {
    maxHeight: 220,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FFF5F6',
  },
  ingredientRowSelected: {
    backgroundColor: '#FFF5F7',
  },
  ingredientCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#DDD',
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientCheckCircleActive: {
    backgroundColor: '#FF9AA2',
    borderColor: '#FF9AA2',
  },
  ingredientRowText: {
    flex: 1,
    fontSize: 12,
    color: '#4A4A4A',
    fontWeight: '500',
  },
  ingredientRowTextSelected: {
    color: '#FF6B7A',
    fontWeight: '700',
  },
  allergyBadge: {
    backgroundColor: '#FFF0E0',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FFD4A0',
  },
  allergyBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E07000',
  },
  ingredientEmptyRow: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  ingredientEmptyText: {
    fontSize: 12,
    color: '#C8C8C8',
  },

  // 재료 태그
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 10,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1.5,
    shadowColor: '#FF9AA2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  tagText: {
    fontSize: 11,
    color: '#FF6B7A',
    fontWeight: '700',
  },
  tagRemoveButton: {
    padding: 2,
  },

  // 재료 정량 모달
  amountModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  amountModalContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  amountModalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF6B7A',
    marginBottom: 8,
  },
  amountModalDescription: {
    fontSize: 12,
    color: '#4A4A4A',
    fontWeight: '600',
    marginBottom: 16,
  },
  amountButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  amountButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: '#FAFAFA',
  },
  amountButtonCircles: {
    fontSize: 12,
    marginBottom: 4,
  },
  amountButtonLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4A4A4A',
  },
  amountModalCancelButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  amountModalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
});

export default styles;
