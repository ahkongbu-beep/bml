import type { ExpoConfig } from 'expo/config';

const appJson = require('./app.json');

export default (): ExpoConfig => {
  const baseConfig = appJson.expo as ExpoConfig;

  return {
    ...baseConfig,
    android: {
      ...baseConfig.android,
      // EAS File env var path (preferred). Fallback to local file for local builds.
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || './google-services.json',
    },
  };
};
