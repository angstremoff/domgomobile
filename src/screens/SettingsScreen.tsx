import { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Logger } from '../utils/logger';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/colors';
import CustomModal from '../components/CustomModal';
// Импортируем новый сервис обновлений
import { checkForUpdates, getCurrentVersion, showUpdateDialog } from '../services/UpdateService';

const SettingsScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { darkMode } = useTheme();
  const theme = darkMode ? Colors.dark : Colors.light;
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

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

  const checkForUpdatesFromGitHub = async () => {
    try {
      setIsCheckingUpdate(true);
      
      const currentVersion = getCurrentVersion();
      Logger.debug('Начинаем проверку обновлений...');
      Logger.debug('Текущая версия:', currentVersion);
      
      showModal(
        t('settings.update.checking') || 'Проверка обновлений', 
        `Проверка обновлений...\nТекущая версия: ${currentVersion}`
      );
      
      // Проверка обновлений через GitHub API
      const result = await checkForUpdates(
        true, // Принудительная проверка
        (latestVersion) => {
          // Callback для доступного обновления
          showUpdateDialog(latestVersion, t);
        },
        () => {
          // Callback для случая, когда обновлений нет
          showModal(
            t('settings.update.upToDate') || 'Обновлений нет', 
            t('settings.update.upToDateMessage') || 'У вас установлена последняя версия приложения.'
          );
        },
        (error) => {
          // Callback для обработки ошибок
          showModal(
            t('settings.update.error') || 'Ошибка', 
            `Ошибка при проверке обновлений: ${error.message || error}`
          );
        }
      );
      
      Logger.debug('Результат проверки:', result);
    } catch (error: any) {
      Logger.error('Ошибка при проверке обновлений:', error);
      showModal(
        t('settings.update.error') || 'Ошибка', 
        `Ошибка при проверке обновлений: ${error?.message || String(error)}`
      );
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
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
        
        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>{t('settings.messageNotifications')}</Text>
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
        
        <TouchableOpacity style={styles.settingItem} onPress={checkForUpdatesFromGitHub}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>{t('settings.version')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.settingValue, { color: theme.secondary }]}>
              {getCurrentVersion()}
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
  }
});

export default SettingsScreen;
