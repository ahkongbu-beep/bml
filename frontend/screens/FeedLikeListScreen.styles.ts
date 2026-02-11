import { StyleSheet } from 'react-native';
import { commonStyles, colors, shadows } from './common.styles';

const styles = StyleSheet.create({
  // 공통 스타일 사용
  centerContainer: commonStyles.centerContainer,
  listContainer: commonStyles.listContainer,
  emptyText: commonStyles.emptyText,
  errorText: commonStyles.errorText,
  footerLoader: commonStyles.footerLoader,

  // 화면 특화 스타일
  feedItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    ...shadows.medium,
    alignItems: 'center',
  },
  feedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F5F5F5',
  },
  timestamp: {
    fontSize: 10,
    color: '#B0B0B0',
    marginTop: 3,
    opacity: 0.6,
  },
  feedContent: {
    flex: 1,
    justifyContent: 'center',
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  feedDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  feedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likedAtText: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginLeft: 4,
  },
  likeButton: {
    padding: 8,
    marginLeft: 4,
  },
  chevron: {
    marginLeft: 8,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default styles;