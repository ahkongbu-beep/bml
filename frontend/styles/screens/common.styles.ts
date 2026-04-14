import { StyleSheet } from 'react-native';

/**
 * 공통 스타일 정의
 * 여러 화면에서 반복적으로 사용되는 스타일을 모아놓은 파일
 */
export const commonStyles = StyleSheet.create({
  // 컨테이너 스타일
  container: {
    flex: 1,
    backgroundColor: '#FFFBF7',
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  content: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  listContainer: {
    padding: 16,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 텍스트 스타일
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },

  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    marginBottom: 16,
    textAlign: 'center',
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4A4A4A',
    fontWeight: '500',
  },

  // 버튼 스타일
  retryButton: {
    marginTop: 24,
    backgroundColor: '#FF9AA2',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#FF9AA2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // 카드 스타일
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },

  // 프로필 이미지
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },

  // 배지 스타일
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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

  // Footer 스타일
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  // Divider
  divider: {
    height: 8,
    backgroundColor: '#F5F5F5',
  },
});

// 색상 상수
export const colors = {
  primary: '#FF9AA2',
  background: '#FFFBF7',
  white: '#FFFFFF',
  text: {
    primary: '#333333',
    secondary: '#666666',
    tertiary: '#999999',
    light: '#B0B0B0',
  },
  border: '#FFE5E5',
  error: '#FF6B6B',
  shadow: '#FFB6C1',
};

// 그림자 스타일
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  large: {
    shadowColor: '#FF9AA2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};

// 간격(Spacing) 상수
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

// 폰트 크기
export const fontSize = {
  xs: 12,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 22,
};

// 테두리 반경
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};
