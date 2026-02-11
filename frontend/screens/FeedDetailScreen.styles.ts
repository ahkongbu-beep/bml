import { StyleSheet } from 'react-native';
import { commonStyles, colors } from './common.styles';

const styles = StyleSheet.create({
  // 공통 스타일 사용
  container: commonStyles.container,
  scrollView: commonStyles.scrollView,
  loadingContainer: commonStyles.loadingContainer,

  // 화면 특화 스타일
  imageSection: {
    position: 'relative',
    paddingLeft: 16,
    paddingRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedImage: {
    width: 380,
    height: 380,
    borderRadius: 10,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  allergiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  allergyBadge: {
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE8B3',
  },
  allergyBadgeText: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '600',
  },
  categoryLabel: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  categoryLabelText: {
    fontSize: 13,
    color: '#FF9AA2',
    fontWeight: '700',
  },
  feedDate: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  titleSection: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    lineHeight: 28,
  },
  contentSection: {
    padding: 16,
    paddingTop: 8,
  },
  content: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 24,
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  tag: {
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#f3f3f3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 14,
    color: '#707070',
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: '#FFE5E5',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE8B3',
    borderRadius: 10,
    padding: 5,
    gap: 5,
  },
  statText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  actionSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFE5E5',
    backgroundColor: '#FFFFFF',
  },
  actionButtonFull: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F0',
    borderWidth: 1,
    borderColor: '#FFE5E5',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  actionButtonDelete: {
    backgroundColor: '#FFF5F5',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF9AA2',
  },
  actionButtonDeleteText: {
    color: '#FF6B6B',
  },
});

export default styles;
