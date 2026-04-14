import { StyleSheet } from 'react-native';
import { commonStyles, colors, shadows } from './common.styles';

const styles = StyleSheet.create({
  // 공통 스타일 사용
  centerContainer: commonStyles.centerContainer,
  loadingText: commonStyles.loadingText,
  errorText: commonStyles.errorText,
  retryButton: commonStyles.retryButton,
  retryButtonText: commonStyles.retryButtonText,

  // 화면 특화 스타일
  errorSubText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.text.light,
    textAlign: 'center',
  },
  feedDivider: {
    height: 8,
    backgroundColor: '#F5F5F5',
  },
});

export default styles;