/* eslint-env node */
import 'dotenv/config';

const pkg = require('./package.json');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const APP_VERSION = process.env.APP_VERSION || pkg.version;

export default ({ config }) => {
  const expoConfig = {
    name: 'DomGoMobile',
    slug: 'DomGoMobile',
    version: APP_VERSION,
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    jsEngine: 'hermes',
    updates: {
      enabled: true,
      fallbackToCacheTimeout: 0,
      url: 'https://u.expo.dev/313d8153-28aa-426a-a0f3-b580238521e5',
      channel: 'production'
    },
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.anonymous.DomGoMobile'
    },
    android: {
      allowBackup: false,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: 'com.anonymous.DomGoMobile',
      config: {
        googleMaps: {
          apiKey: GOOGLE_MAPS_API_KEY
        }
      },
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'domgomobile',
              host: 'property',
              pathPrefix: '/'
            }
          ],
          category: ['BROWSABLE', 'DEFAULT']
        }
      ]
    },
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: '313d8153-28aa-426a-a0f3-b580238521e5'
      }
    },
    runtimeVersion: '1.0.4',
    owner: 'angstremoff'
  };

  // Import standalone plugin
  const withAndroidUpdates = require('./plugins/withAndroidUpdates');

  // Apply the plugin
  return withAndroidUpdates({ ...config, ...expoConfig });
};
