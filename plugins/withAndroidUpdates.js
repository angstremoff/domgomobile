const { withAndroidManifest, withStringsXml, AndroidConfig } = require('@expo/config-plugins');

const withAndroidUpdates = (config) => {
    // 1. Force Manifest Metadata
    config = withAndroidManifest(config, async (config) => {
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

    // 2. Force Strings.xml (Alternative source for some versions)
    config = withStringsXml(config, async (config) => {
        const strings = config.modResults;
        const channel = config.updates?.channel || 'production';
        const url = config.updates?.url || 'https://u.expo.dev/313d8153-28aa-426a-a0f3-b580238521e5';

        // Helper to set string
        const setString = (name, value) => {
            const existing = strings.resources.string.find(s => s.$.name === name);
            if (existing) {
                existing._ = value;
            } else {
                strings.resources.string.push({ $: { name }, _: value });
            }
        };

        setString('expo_updates_channel', channel);
        setString('expo_update_url', url);
        setString('expo_updates_release_channel', channel);

        return config;
    });

    return config;
};

module.exports = withAndroidUpdates;
