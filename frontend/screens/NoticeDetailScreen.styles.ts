import { StyleSheet } from 'react-native';
import { commonStyles, colors, shadows } from './common.styles';

const styles = StyleSheet.create({
  // 공통 스타일 사용
  container: commonStyles.container,
  scrollView: commonStyles.scrollView,
  loadingContainer: commonStyles.loadingContainer,
  importantBadge: commonStyles.importantBadge,
  importantBadgeText: commonStyles.importantBadgeText,
  categoryBadge: commonStyles.categoryBadge,
  categoryText: commonStyles.categoryText,

  // 화면 특화 스타일
  content: {
    padding: 20,
  },
  headerSection: {
    marginBottom: 20,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  importantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  importantBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoryBadge: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9AA2',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    lineHeight: 30,
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#999',
  },
  divider: {
    height: 1,
    backgroundColor: '#FFE5E5',
    marginBottom: 20,
  },
  contentSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contentText: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 26,
  },
});

export default styles;