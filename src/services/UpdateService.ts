import { Alert, Linking } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Константы для сервиса обновлений
const GITHUB_API_URL = 'https://api.github.com/repos/angstremoff/domgors/releases/latest';
const GITHUB_RELEASE_URL = 'https://github.com/angstremoff/domgors/releases/latest';
const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
const LAST_UPDATE_CHECK_KEY = 'last_update_check';

// Получаем текущую версию из Constants или package.json
export const getCurrentVersion = (): string => {
  return Constants.expoConfig?.version || '0.8.1.5'; // Используем версию из package.json как резерв
};

// Функция для сравнения версий
export const compareVersions = (currentVersion: string, latestVersion: string): boolean => {
  const current = currentVersion.split('.').map(Number);
  const latest = latestVersion.split('.').map(Number);
  
  // Сравниваем каждый сегмент версии
  for (let i = 0; i < Math.max(current.length, latest.length); i++) {
    const currentSegment = current[i] || 0;
    const latestSegment = latest[i] || 0;
    
    if (currentSegment < latestSegment) {
      return true; // Есть обновление
    } else if (currentSegment > latestSegment) {
      return false; // Текущая версия новее
    }
  }
  
  return false; // Версии равны
};

// Проверка наличия обновлений
export const checkForUpdates = async (
  force: boolean = false, 
  onUpdateAvailable?: (version: string) => void,
  onNoUpdateAvailable?: () => void,
  onError?: (error: any) => void
): Promise<{ isUpdateAvailable: boolean; latestVersion: string }> => {
  try {
    // Проверяем, не слишком ли часто проверяем обновления
    if (!force) {
      const lastCheckStr = await AsyncStorage.getItem(LAST_UPDATE_CHECK_KEY);
      if (lastCheckStr) {
        const lastCheck = parseInt(lastCheckStr, 10);
        const now = Date.now();
        
        if (now - lastCheck < UPDATE_CHECK_INTERVAL) {
          console.log('Слишком рано для новой проверки обновлений');
          onNoUpdateAvailable?.();
          return { isUpdateAvailable: false, latestVersion: getCurrentVersion() };
        }
      }
    }
    
    // Сохраняем время проверки
    await AsyncStorage.setItem(LAST_UPDATE_CHECK_KEY, Date.now().toString());
    
    // Запрашиваем последнюю версию с GitHub
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API вернул статус ${response.status}`);
    }
    
    const data = await response.json();
    
    // Получаем строку версии из тега (удаляем 'v' в начале, если есть)
    const latestVersion = data.tag_name.replace(/^v/, '');
    const currentVersion = getCurrentVersion();
    
    console.log(`Текущая версия: ${currentVersion}, Последняя версия: ${latestVersion}`);
    
    // Проверяем, есть ли обновление
    const isUpdateAvailable = compareVersions(currentVersion, latestVersion);
    
    if (isUpdateAvailable) {
      onUpdateAvailable?.(latestVersion);
    } else {
      onNoUpdateAvailable?.();
    }
    
    return { isUpdateAvailable, latestVersion };
  } catch (error) {
    console.error('Ошибка при проверке обновлений:', error);
    onError?.(error);
    return { isUpdateAvailable: false, latestVersion: getCurrentVersion() };
  }
};

// Показать диалог обновления
export const showUpdateDialog = (latestVersion: string, t: any) => {
  Alert.alert(
    t('settings.update.available'),
    t('settings.update.newVersionAvailable', { version: latestVersion }),
    [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('settings.update.downloadNow'),
        onPress: () => Linking.openURL(GITHUB_RELEASE_URL),
      },
    ],
    { cancelable: true }
  );
};
