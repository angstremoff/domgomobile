const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

const withAndroidUpdates = (config) => {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;
        const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);

        const channel = config.updates?.channel || 'production';
        const url = config.updates?.url || 'https://u.expo.dev/313d8153-28aa-426a-a0f3-b580238521e5';

        AndroidConfig.Manifest.addMetaDataItemToMainApplication(
            mainApplication,
            'expo.modules.updates.EXPO_UPDATES_CHANNEL',
            channel
        );

        AndroidConfig.Manifest.addMetaDataItemToMainApplication(
            mainApplication,
            'expo.modules.updates.EXPO_UPDATE_URL',
            url
        );

        // Legacy key
        AndroidConfig.Manifest.addMetaDataItemToMainApplication(
            mainApplication,
            'expo.modules.updates.EXPO_UPDATES_RELEASE_CHANNEL',
            channel
        );

        return config;
    });
};

module.exports = withAndroidUpdates;
