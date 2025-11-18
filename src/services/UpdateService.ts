import { Alert, Linking } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from '../utils/logger';

// Константы для сервиса обновлений
const GITHUB_API_URL = 'https://api.github.com/repos/angstremoff/domgomobile/releases/latest';
const GITHUB_RELEASE_URL = 'https://github.com/angstremoff/domgomobile/releases/latest/download/domgo.apk';
const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
const LAST_UPDATE_CHECK_KEY = 'last_update_check';

// Получаем текущую версию из Constants или package.json
export const getCurrentVersion = (): string => {
  return Constants.expoConfig?.version || '0.9.6'; // Используем версию из package.json как резерв
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
  let controller: AbortController | null = null;
  let timeoutId: NodeJS.Timeout | null = null;

  try {
    Logger.debug('Начинаем проверку обновлений...');
    
    // Проверяем, не слишком ли часто проверяем обновления
    if (!force) {
      try {
        const lastCheckStr = await AsyncStorage.getItem(LAST_UPDATE_CHECK_KEY);
        if (lastCheckStr) {
          const lastCheck = parseInt(lastCheckStr, 10);
          const now = Date.now();
          
          if (now - lastCheck < UPDATE_CHECK_INTERVAL) {
            Logger.debug('Слишком рано для новой проверки обновлений');
            onNoUpdateAvailable?.();
            return { isUpdateAvailable: false, latestVersion: getCurrentVersion() };
          }
        }
      } catch (storageError) {
        Logger.warn('Ошибка при проверке AsyncStorage:', storageError);
        // Продолжаем проверку даже если была ошибка с хранилищем
      }
    }
    
    // Устанавливаем таймаут для запроса (15 секунд)
    controller = new AbortController();
    const signal = controller.signal;
    
    timeoutId = setTimeout(() => {
      if (controller) {
        controller.abort();
        Logger.debug('Запрос на проверку обновлений прерван по таймауту');
      }
    }, 15000); // 15 секунд на запрос (увеличено с 5 до 15 секунд для слабых соединений)
    
    // Сохраняем время проверки
    try {
      await AsyncStorage.setItem(LAST_UPDATE_CHECK_KEY, Date.now().toString());
    } catch (storageError) {
        Logger.warn('Ошибка при сохранении времени проверки:', storageError);
    }
    
    Logger.debug('Отправляем запрос к GitHub API:', GITHUB_API_URL);
    Logger.debug('User-Agent:', `DomGoMobile/${getCurrentVersion()}`);
    
    // Функция запроса с повторными попытками
    const fetchWithRetry = async (url: string, options: any, retries = 2, delay = 2000): Promise<Response> => {
      try {
        return await fetch(url, options);
      } catch (err) {
        if (retries <= 0) throw err;
        await new Promise(resolve => setTimeout(resolve, delay));
        Logger.debug(`Повторная попытка запроса (осталось ${retries})`);
        return fetchWithRetry(url, options, retries - 1, delay);
      }
    }
    
    // Запрашиваем последнюю версию с GitHub с поддержкой повторных попыток
    const response = await fetchWithRetry(GITHUB_API_URL, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': `DomGoMobile/${getCurrentVersion()}` // Добавляем User-Agent для улучшения запросов
      },
      signal // Передаем сигнал для возможности прерывания запроса
    }, 2, 2000); // 2 повторные попытки с задержкой 2 секунды
    
    // Очищаем таймер, так как запрос завершен
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    if (!response.ok) {
      Logger.error(`GitHub API вернул статус ${response.status}`);
      throw new Error(`GitHub API вернул статус ${response.status}`);
    }
    
    Logger.debug('Получен ответ от GitHub API');
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      Logger.error('Ошибка при парсинге JSON:', jsonError);
      throw new Error('Ошибка при парсинге ответа GitHub API');
    }
    
    if (!data || !data.tag_name) {
      Logger.error('Отсутствует поле tag_name в ответе GitHub API:', data);
      throw new Error('Некорректный формат ответа GitHub API');
    }
    
    // Получаем строку версии из тега (удаляем 'v' в начале, если есть)
    const latestVersion = data.tag_name.replace(/^v/, '');
    const currentVersion = getCurrentVersion();
    
    Logger.debug(`Текущая версия: ${currentVersion}, Последняя версия: ${latestVersion}`);
    
    // Проверяем, есть ли обновление
    const isUpdateAvailable = compareVersions(currentVersion, latestVersion);
    
    Logger.debug(`Доступно обновление: ${isUpdateAvailable ? 'Да' : 'Нет'}`);
    
    if (isUpdateAvailable) {
      onUpdateAvailable?.(latestVersion);
    } else {
      onNoUpdateAvailable?.();
    }
    
    return { isUpdateAvailable, latestVersion };
  } catch (error: any) {
    // Очищаем таймер, если он еще существует
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    // Обработка ошибки прерывания
    if (error.name === 'AbortError') {
    Logger.error('Запрос на проверку обновлений был прерван');
      const timeoutError = new Error('Время ожидания истекло. Проверьте подключение к интернету и попробуйте снова.');
      onError?.(timeoutError);
      return { isUpdateAvailable: false, latestVersion: getCurrentVersion() };
    }

    // Обработка ошибок сети
    if (error.message && error.message.includes('Network request failed')) {
    Logger.error('Ошибка сети при проверке обновлений');
      const networkError = new Error('Не удалось подключиться к серверу. Проверьте подключение к интернету.');
      onError?.(networkError);
      return { isUpdateAvailable: false, latestVersion: getCurrentVersion() };
    }
    
    // Улучшенный лог ошибки
    Logger.error('Ошибка при проверке обновлений:', error);
    Logger.error('Тип ошибки:', error?.name);
    Logger.error('Сообщение:', error?.message);
    Logger.error('Stack:', error?.stack);
    
    // Преобразуем ошибку в понятное для пользователя сообщение
    const userFriendlyError = new Error(
      `Не удалось проверить обновления: ${error?.message || 'Неизвестная ошибка'}`
    );
    onError?.(userFriendlyError);
    return { isUpdateAvailable: false, latestVersion: getCurrentVersion() };
  }
};

// Показать диалог обновления
export const showUpdateDialog = (latestVersion: string, t: any) => {
  Alert.alert(
    t('settings.update.updateAvailable') || 'Доступно обновление',
    t('settings.update.updateMessage', { version: latestVersion }) || `Доступна новая версия приложения: ${latestVersion}`,
    [
      {
        text: t('settings.update.skip') || 'Пропустить',
        style: 'cancel',
      },
      {
        text: t('settings.update.download') || 'Скачать',
        onPress: () => Linking.openURL(GITHUB_RELEASE_URL),
      },
    ],
    { cancelable: true }
  );
  
  // Логируем ссылку на загрузку
  Logger.debug('Ссылка на загрузку:', GITHUB_RELEASE_URL);
};
