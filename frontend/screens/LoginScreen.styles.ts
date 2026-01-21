import { StyleSheet } from 'react-native';
import { commonStyles, colors, shadows } from './common.styles';

const styles = StyleSheet.create({
  // 공통 스타일 사용
  container: commonStyles.container,
  errorText: commonStyles.errorText,

  // 화면 특화 스타일
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 56,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A',
    marginTop: 8,
    letterSpacing: 1,
  },
  formContainer: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#4A4A4A',
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    ...shadows.large,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    color: '#4A4A4A',
    fontSize: 14,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: colors.text.light,
    marginHorizontal: 16,
  },
  snsContainer: {
    marginTop: 24,
  },
  snsTitle: {
    textAlign: 'center',
    color: '#4A4A4A',
    fontSize: 14,
    marginBottom: 16,
  },
  snsButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  snsButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
  },
  naverButton: {
    backgroundColor: '#03C75A',
  },
  googleButton: {
    marginTop: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  snsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
    textAlign: 'center',
  },
  googleIcon: {
    position: 'absolute',
    left: 16,
  },
});

export default styles;