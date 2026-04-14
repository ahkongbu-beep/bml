import { StyleSheet } from 'react-native';
import { commonStyles, colors, shadows } from './common.styles';

const styles = StyleSheet.create({
  // 공통 스타일 사용
  container: commonStyles.container,
  scrollView: commonStyles.scrollView,
  loadingContainer: commonStyles.loadingContainer,
  emptyText: commonStyles.emptyText,
  importantBadge: commonStyles.importantBadge,
  importantBadgeText: commonStyles.importantBadgeText,
  categoryBadge: commonStyles.categoryBadge,
  categoryText: commonStyles.categoryText,

  // 화면 특화 스타일
  content: {
    padding: 16,
  },
  noticeCard: {
    ...commonStyles.card,
  },
  importantCard: {
    backgroundColor: '#FFF5F5',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
    lineHeight: 22,
  },
  noticeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noticeDate: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
});

export default styles;