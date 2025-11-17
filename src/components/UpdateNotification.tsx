import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import * as Updates from 'expo-updates';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/colors';
import { Logger } from '../utils/logger';

const UpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { darkMode } = useTheme();
  const theme = darkMode ? Colors.dark : Colors.light;

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      if (__DEV__) {
        Logger.debug('Проверка обновлений отключена в режиме разработки');
        return;
      }

      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Logger.debug('Доступно обновление!');
        setUpdateAvailable(true);
      }
    } catch (error) {
      Logger.error('Ошибка при проверке обновлений:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      setDownloading(true);
      Logger.debug('Загрузка обновления...');
      
      await Updates.fetchUpdateAsync();
      Logger.debug('Обновление загружено, перезапуск...');
      
      // Перезапускаем приложение с новой версией
      await Updates.reloadAsync();
    } catch (error) {
      Logger.error('Ошибка при загрузке обновления:', error);
      setDownloading(false);
      setUpdateAvailable(false);
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <Modal
      visible={updateAvailable}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.card }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="cloud-download-outline" size={48} color={theme.primary} />
          </View>
          
          <Text style={[styles.title, { color: theme.text }]}>
            Доступно обновление
          </Text>
          
          <Text style={[styles.message, { color: theme.secondary }]}>
            Новая версия приложения готова к установке. Обновление займет несколько секунд.
          </Text>
          
          {downloading ? (
            <View style={styles.downloadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.downloadingText, { color: theme.secondary }]}>
                Загрузка обновления...
              </Text>
            </View>
          ) : (
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.dismissButton, { borderColor: theme.border }]}
                onPress={handleDismiss}
              >
                <Text style={[styles.buttonText, { color: theme.secondary }]}>
                  Позже
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.updateButton, { backgroundColor: theme.primary }]}
                onPress={handleUpdate}
              >
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                  Обновить
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  downloadingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  downloadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButton: {
    borderWidth: 1,
  },
  updateButton: {
    // backgroundColor задается динамически
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UpdateNotification;
