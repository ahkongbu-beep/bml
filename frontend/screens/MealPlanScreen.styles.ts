import { StyleSheet } from 'react-native';
import { commonStyles, colors } from './common.styles';

const styles = StyleSheet.create({
  // 공통 스타일 사용
  container: commonStyles.container,
  content: commonStyles.content,

  // 화면 특화 스타일
  viewModeContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  viewModeTextActive: {
    color: colors.white,
  },
  mealsSection: {
    padding: 16,
  },
  mealsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A4A4A',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  mealsContainer: {
    gap: 12,
  },
  emptyMeals: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyMealsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    marginTop: 12,
  },
  emptyMealsSubtext: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  guideContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  guideText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    marginTop: 16,
    textAlign: 'center',
  },
  guideSubtext: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownMenuModal: {
    position: 'absolute',
    backgroundColor: colors.white,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 10,
    minWidth: 120,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
});

export default styles;