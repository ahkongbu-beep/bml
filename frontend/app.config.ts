import type { ExpoConfig } from 'expo/config';

const appJson = require('./app.json');

export default (): ExpoConfig => {
  const baseConfig = appJson.expo as ExpoConfig;
  const kakaoAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;

  return {
    ...baseConfig,
    android: {
      ...baseConfig.android,
      // EAS File env var path (preferred). Fallback to local file for local builds.
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || './google-services.json',
    },
    plugins: [
      ...(baseConfig.plugins || []),
      ...(kakaoAppKey
        ? [['@react-native-seoul/kakao-login', { kakaoAppKey }]]
        : []),
    ],
  };
};
