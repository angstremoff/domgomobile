const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

const withAndroidUpdates = (config) => {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;
        const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);

        // Remove existing keys to avoid duplicates (though addMetaDataItemToMainApplication handles this usually)
        // We want to be absolutely sure we are setting the correct values.

        // Force EXPO_UPDATES_CHANNEL
        AndroidConfig.Manifest.addMetaDataItemToMainApplication(
            mainApplication,
            'expo.modules.updates.EXPO_UPDATES_CHANNEL',
            config.updates?.channel || 'production'
        );

        // Force EXPO_UPDATE_URL
        AndroidConfig.Manifest.addMetaDataItemToMainApplication(
            mainApplication,
            'expo.modules.updates.EXPO_UPDATE_URL',
            config.updates?.url || 'https://u.expo.dev/313d8153-28aa-426a-a0f3-b580238521e5'
        );

        // Also add the deprecated one just in case older expo-updates versions need it
        AndroidConfig.Manifest.addMetaDataItemToMainApplication(
            mainApplication,
            'expo.modules.updates.EXPO_UPDATES_RELEASE_CHANNEL',
            config.updates?.channel || 'production'
        );

        return config;
    });
};

module.exports = withAndroidUpdates;
