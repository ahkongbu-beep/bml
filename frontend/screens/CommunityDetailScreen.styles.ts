import { StyleSheet } from 'react-native';
import { commonStyles, colors, shadows } from './common.styles';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343A40',
    marginBottom: 4,
  },
  authorDetail: {
    fontSize: 13,
    color: '#868E96',
  },
  categoryBadge: {
    backgroundColor: '#FFF0F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    margin: 16,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF8FA3',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#343A40',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  contents: {
    fontSize: 15,
    lineHeight: 24,
    color: '#495057',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  imageSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  contentImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#868E96',
  },
  divider: {
    height: 8,
    backgroundColor: '#F1F3F5',
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#DEE2E6',
  },
  actionText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  actionCount: {
    fontSize: 14,
    color: '#868E96',
  },
  commentSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
    minHeight: 200,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343A40',
    marginBottom: 16,
  },
  emptyComment: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyCommentText: {
    fontSize: 14,
    color: '#ADB5BD',
    marginTop: 12,
  },
  commentProfileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#F1F3F5', // 이미지 없을 때 배경색
  },
  commentInput: {
    fontSize: 14,
    color: '#495057',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  commentInputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#DEE2E6',
    padding: 12,
  },
  commentInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentInputPlaceholder: {
    fontSize: 14,
    color: '#ADB5BD',
  },
});

export default styles;