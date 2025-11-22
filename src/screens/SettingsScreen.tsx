import { useState, useEffect } from 'react';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Platform,
  useWindowDimensions,
  Alert
} from 'react-native';
import { Logger } from '../utils/logger';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/colors';
import CustomModal from '../components/CustomModal';

// Импортируем версию напрямую из package.json
const packageJson = require('../../package.json');

const SettingsScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { darkMode } = useTheme();
  const theme = darkMode ? Colors.dark : Colors.light;
  const isWeb = Platform.OS === 'web';
  const { width } = useWindowDimensions();
  const isWebDesktop = isWeb && width >= 1024;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [otaLog, setOtaLog] = useState<string>('');

  // Показываем актуальную версию из package.json (версия кода)
  // а не версию APK, так как OTA обновления не меняют версию APK
  const codeVersion = packageJson.version;
  const [updateInfo, setUpdateInfo] = useState<string>('');

  useEffect(() => {
    // Получаем информацию об обновлении
    const getUpdateInfo = async () => {
      try {
        if (!__DEV__ && Updates.channel) {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            setUpdateInfo(' (обновление доступно)');
          }
        }
      } catch (error) {
        Logger.debug('Не удалось проверить обновление:', error);
      }
    };
    getUpdateInfo();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      showModal(t('settings.logoutSuccess.title'), t('settings.logoutSuccess.message'));
    } catch (error) {
      Logger.error('Ошибка при выходе из аккаунта:', error);
      showModal(t('settings.logoutError.title'), t('settings.logoutError.message'));
    }
  };

  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(otaLog);
    Alert.alert('Скопировано', 'Лог скопирован в буфер обмена');
  };

  const handleManualUpdate = async () => {
    try {
      const runtimeVersion = Updates.runtimeVersion;
      const updateId = Updates.updateId;
      const channel = Updates.channel;
      // @ts-ignore
      const releaseChannel = Updates.releaseChannel;
      const isEmbeddedLaunch = Updates.isEmbeddedLaunch;
      const checkAutomatically = Updates.checkAutomatically;
      const emergencyLaunchException = (Updates as any).emergencyLaunchException;

      const updateUrl = (Updates.manifest as any)?.extra?.expoClient?.updateUrl ||
        (Updates as any)?.manifest?.extra?.expoClient?.updateUrl ||
        'undefined';

      // Get config from Constants
      const configChannel = Constants.expoConfig?.updates?.channel || 'undefined (Constants)';
      const configUrl = Constants.expoConfig?.updates?.url || 'undefined (Constants)';
      const configExtra = JSON.stringify(Constants.expoConfig?.extra || {}, null, 2);

      let logMsg = `=== DIAGNOSTIC LOG ===\n`;
      logMsg += `Date: ${new Date().toISOString()}\n`;
      logMsg += `\n--- Runtime (Updates Native) ---\n`;
      logMsg += `Channel: ${channel}\n`;
      logMsg += `ReleaseChannel: ${releaseChannel}\n`;
      logMsg += `UpdateUrl: ${updateUrl}\n`;
      logMsg += `UpdateId: ${updateId}\n`;
      logMsg += `RuntimeVersion: ${runtimeVersion}\n`;
      logMsg += `IsEmbedded: ${isEmbeddedLaunch}\n`;
      logMsg += `CheckAuto: ${checkAutomatically}\n`;
      logMsg += `EmergencyException: ${emergencyLaunchException}\n`;

      logMsg += `\n--- Config (Constants JS) ---\n`;
      logMsg += `Channel: ${configChannel}\n`;
      logMsg += `URL: ${configUrl}\n`;
      logMsg += `Extra: ${configExtra}\n`;

      logMsg += `\n--- Action ---\n`;
      logMsg += `Checking for updates...\n`;

      setOtaLog(logMsg);

      try {
        const res = await Updates.checkForUpdateAsync();
        const isAvailable = res?.isAvailable;
        const manifest = JSON.stringify(res?.manifest ?? {}, null, 2);

        logMsg += `\n--- Result ---\n`;
        logMsg += `IsAvailable: ${isAvailable}\n`;
        logMsg += `Manifest: ${manifest}\n`;
        setOtaLog(logMsg);

        if (isAvailable) {
          logMsg += `\nFetching update...\n`;
          setOtaLog(logMsg);
          await Updates.fetchUpdateAsync();
          logMsg += `\nUpdate fetched. Reloading...\n`;
          setOtaLog(logMsg);
          await Updates.reloadAsync();
        } else {
          setModalTitle('OTA');
          setModalMessage('Обновлений нет');
          setModalVisible(true);
        }
      } catch (e: any) {
        logMsg += `\n--- ERROR ---\n`;
        logMsg += `Code: ${e.code}\n`;
        logMsg += `Message: ${e.message}\n`;
        logMsg += `Stack: ${e.stack}\n`;
        setOtaLog(logMsg);

        setModalTitle('OTA Error');
        setModalMessage(e.message);
        setModalVisible(true);
      }
    } catch (error: any) {
      setOtaLog((prev) => `${prev}\nCRITICAL ERROR: ${error?.message || error}`);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={isWebDesktop ? styles.webContentContainer : undefined}
    >
      <View style={[styles.contentWrapper, isWebDesktop && styles.webContentWrapper]}>
        <Text style={[styles.title, { color: theme.text }]}>{t('settings.title')}</Text>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('settings.notifications')}</Text>

          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>{t('settings.newPropertyNotifications')}</Text>
            <Switch
              value={true}
              onValueChange={() => showModal(t('settings.notificationNote.title'), t('settings.notificationNote.message'))}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
              ios_backgroundColor="#3e3e3e"
              style={{ transform: [{ scale: 1.0 }], borderWidth: 0 }}
            />
          </View>
        </View>

        {user && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('settings.account')}</Text>

            <TouchableOpacity
              style={[styles.logoutButton, {
                backgroundColor: theme.cardBackground,
                borderWidth: 1,
                borderColor: theme.border
              }]}
              onPress={handleLogout}
            >
              <Text style={[styles.logoutText, { color: theme.text }]}>{t('common.logout')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('settings.about')}</Text>

          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>{t('settings.version')}</Text>
            <Text style={[styles.settingValue, { color: theme.secondary }]}>
              {codeVersion}{updateInfo}
            </Text>
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={() => showModal(t('settings.aboutApp.title'), t('settings.aboutApp.message'))}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>{t('settings.help')}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleManualUpdate}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Проверить OTA / Логи
            </Text>
            <Ionicons name="refresh" size={20} color={theme.primary} />
          </TouchableOpacity>

          {otaLog ? (
            <View style={[styles.otaLogContainer, { borderColor: theme.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.otaLogTitle, { color: theme.text }]}>OTA лог</Text>
                <TouchableOpacity onPress={copyToClipboard} style={{ padding: 4 }}>
                  <Ionicons name="copy-outline" size={18} color={theme.primary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.otaLogText, { color: theme.secondary }]}>{otaLog}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.settingItem} onPress={() => showModal(t('settings.contactInfo.title'), t('settings.contactInfo.message'))}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>{t('settings.contactUs')}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.secondary} />
          </TouchableOpacity>

          {/* Условия размещения объявлений */}
          <TouchableOpacity style={styles.settingItem} onPress={() => showModal(t('settings.listingTerms.title'), t('settings.listingTerms.message'))}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>{t('settings.listingTerms.title')}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.secondary} />
          </TouchableOpacity>
        </View>

        <CustomModal
          visible={modalVisible}
          title={modalTitle}
          message={modalMessage}
          onClose={() => setModalVisible(false)}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  contentWrapper: {
    width: '100%'
  },
  webContentWrapper: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%'
  },
  webContentContainer: {
    flexGrow: 1,
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  section: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 16,
  },
  logoutButton: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 8,
    marginVertical: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  versionNote: {
    fontSize: 12,
    marginTop: 2,
  },
  otaLogContainer: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  otaLogTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  otaLogText: {
    fontSize: 12,
    lineHeight: 16,
  }
});

export default SettingsScreen;
