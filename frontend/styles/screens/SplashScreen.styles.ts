import { StyleSheet } from 'react-native';
import { colors } from './common.styles';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 72,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 4,
    textShadowColor: colors.border,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#4A4A4A',
    marginTop: 12,
    letterSpacing: 2,
  },
  loader: {
    marginTop: 20,
  },
});

export default styles;