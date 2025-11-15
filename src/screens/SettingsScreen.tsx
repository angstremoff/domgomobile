import { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  useWindowDimensions
} from 'react-native';
import { Logger } from '../utils/logger';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/colors';
import CustomModal from '../components/CustomModal';
// Импортируем новые сервисы для диагностики
import AppVersionManager from '../services/AppVersionManager';
import CacheDiagnostics from '../utils/CacheDiagnostics';

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
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const currentVersion = Constants.expoConfig?.version || '0.0.0';

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

  // Новая функция для диагностики кэша
  const runCacheDiagnostics = async () => {
    try {
      setIsDiagnosing(true);
      Logger.debug('Запуск полной диагностики кэша...');
      
      const diagnostics = await CacheDiagnostics.runFullDiagnostics();
      
      let message = `Платформа: ${diagnostics.diagnosticInfo.platform}\n`;
      message += `Ключей в AsyncStorage: ${diagnostics.diagnosticInfo.asyncStorageKeys.length}\n`;
      message += `Примерный размер: ${Math.round(diagnostics.diagnosticInfo.asyncStorageSize / 1024)} KB\n\n`;
      
      if (diagnostics.issues.hasIssues) {
        message += `Обнаружено проблем: ${diagnostics.issues.issues.length}\n`;
        message += diagnostics.issues.issues.join('\n') + '\n\n';
        
        if (diagnostics.autoFix) {
          if (diagnostics.autoFix.fixed) {
            message += `Автоматическое исправление: Успешно\n`;
            message += diagnostics.autoFix.actions.join('\n');
          } else {
            message += `Ошибки при исправлении:\n`;
            message += diagnostics.autoFix.errors.join('\n');
          }
        }
      } else {
        message += 'Проблем не обнаружено ✅';
      }
      
      showModal('Диагностика кэша', message);
      
    } catch (error) {
      Logger.error('Ошибка при диагностике кэша:', error);
      showModal('Ошибка', `Ошибка при выполнении диагностики: ${error}`);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Функция принудительной очистки кэша
  const forceClearCache = async () => {
    Alert.alert(
      'Очистка кэша',
      'Это очистит все локальные данные и кэши. Продолжить?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Очистить',
          style: 'destructive',
          onPress: async () => {
            try {
              await AppVersionManager.forceClearAll('Принудительная очистка из настроек');
              showModal('Успех', 'Кэш успешно очищен. Перезапустите приложение.');
            } catch (error) {
              Logger.error('Ошибка при очистке кэша:', error);
              showModal('Ошибка', `Ошибка при очистке кэша: ${error}`);
            }
          }
        }
      ]
    );
  };

  const checkForUpdatesFromExpo = async () => {
    try {
      setIsCheckingUpdate(true);
      showModal(
        t('settings.update.checking') || 'Проверка обновлений', 
        t('settings.update.checkingMessage') || 'Проверяем OTA обновления...'
      );

      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        showModal(
          t('settings.update.updateAvailable') || 'Доступно обновление',
          t('settings.update.updateMessage', { version: update.manifest?.version || '' }) ||
            'Обновление загружено. Приложение будет перезапущено.'
        );
        await Updates.reloadAsync();
      } else {
        showModal(
          t('settings.update.upToDate') || 'Обновлений нет', 
          t('settings.update.upToDateMessage') || 'У вас установлена последняя версия приложения.'
        );
      }
    } catch (error: any) {
      Logger.error('Ошибка при проверке обновлений (Expo):', error);
      showModal(
        t('settings.update.error') || 'Ошибка', 
        `Ошибка при проверке обновлений: ${error?.message || String(error)}`
      );
    } finally {
      setIsCheckingUpdate(false);
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
          
          {/* Диагностика кэша */}
          {!isWebDesktop && (
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={runCacheDiagnostics}
              disabled={isDiagnosing}
            >
              <Text style={[styles.settingLabel, { color: theme.text }]}>🔍 Диагностика кэша</Text>
              {isDiagnosing ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={theme.secondary} />
              )}
            </TouchableOpacity>
          )}
          
          {/* Очистка кэша */}
          {!isWebDesktop && (
            <TouchableOpacity style={styles.settingItem} onPress={forceClearCache}>
              <Text style={[styles.settingLabel, { color: '#EF4444' }]}>🗑️ Очистить кэш</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.secondary} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.settingItem} onPress={checkForUpdatesFromExpo}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>{t('settings.version')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.settingValue, { color: theme.secondary }]}>
                {currentVersion}
              </Text>
              {isCheckingUpdate && <ActivityIndicator size="small" color={theme.secondary} style={{ marginLeft: 8 }} />}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => showModal(t('settings.aboutApp.title'), t('settings.aboutApp.message'))}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>{t('settings.help')}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.secondary} />
          </TouchableOpacity>
          
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
  }
});

export default SettingsScreen;
