import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Logger } from '../utils/logger';
import { propertyService } from './propertyService';
import { propertyCache, apiCache } from '../utils/cacheManager';

interface VersionInfo {
  appVersion: string;
  buildVersion: string;
  updateId?: string;
  lastClearTime: number;
  clearReason: string;
}

class AppVersionManager {
  private static instance: AppVersionManager;
  private readonly APP_VERSION_KEY = 'app_version_info';
  private readonly FORCE_CLEAR_KEY = 'force_clear_flag';
  
  private constructor() {}
  
  static getInstance(): AppVersionManager {
    if (!AppVersionManager.instance) {
      AppVersionManager.instance = new AppVersionManager();
    }
    return AppVersionManager.instance;
  }
  
  /**
   * Получает текущую версию приложения
   */
  private getCurrentVersion(): string {
    return (
      (Constants?.expoConfig as any)?.version ||
      '0.9.3' // Fallback версия из package.json
    );
  }
  
  /**
   * Получает текущую версию сборки/обновления
   */
  private getBuildVersion(): string {
    const runtimeVersion = Updates.runtimeVersion;
    if (typeof runtimeVersion === 'string') {
      return runtimeVersion;
    }
    
    const expoRuntimeVersion = Constants.expoConfig?.runtimeVersion;
    if (typeof expoRuntimeVersion === 'string') {
      return expoRuntimeVersion;
    }
    
    return '1.0.4'; // Fallback версия из app.json
  }
  
  /**
   * Получает ID текущего обновления Expo
   */
  private getUpdateId(): string | undefined {
    if (Platform.OS === 'web') return undefined;
    return Updates.updateId || undefined;
  }
  
  /**
   * Принудительная очистка всех кэшей
   */
  async forceClearAll(reason: string = 'Manual clear'): Promise<void> {
    Logger.debug(`🧹 ПРИНУДИТЕЛЬНАЯ ОЧИСТКА ВСЕХ КЭШЕЙ: ${reason}`);
    
    try {
      // 1. Точечно очищаем версионные артефакты, не трогая пользовательские токены/настройки
      Logger.debug('1. Очистка версионных ключей в AsyncStorage...');
      await AsyncStorage.removeItem(this.APP_VERSION_KEY);
      await AsyncStorage.removeItem(this.FORCE_CLEAR_KEY);
      Logger.debug('✅ Версионные ключи очищены');
      
      // 2. Очищаем FileSystem кэш
      Logger.debug('2. Очистка FileSystem кэша...');
      try {
        const cacheDir = FileSystem.cacheDirectory;
        if (cacheDir) {
          const cacheItems = await FileSystem.readDirectoryAsync(cacheDir);
          Logger.debug(`Найдено ${cacheItems.length} элементов в кэше FileSystem`);
          
          for (const item of cacheItems) {
            try {
              const itemPath = `${cacheDir}${item}`;
              const info = await FileSystem.getInfoAsync(itemPath);
              if (info.exists) {
                await FileSystem.deleteAsync(itemPath, { idempotent: true });
              }
            } catch (itemError) {
              Logger.warn(`Не удалось удалить ${item}:`, itemError);
            }
          }
          Logger.debug('✅ FileSystem кэш очищен');
        }
      } catch (fsError) {
        Logger.warn('⚠️ Частичная очистка FileSystem кэша:', fsError);
      }
      
      // 3. Очищаем in-memory кэши приложения
      Logger.debug('3. Очистка in-memory кэшей...');
      if (propertyService && typeof propertyService.clearCache === 'function') {
        propertyService.clearCache();
      }
      
      // 4. Очищаем LRU кэши
      propertyCache.clear();
      apiCache.clear();
      Logger.debug('✅ In-memory кэши очищены');
      
      // 5. Принудительная очистка JavaScript кэша (если возможно)
      Logger.debug('4. Попытка очистки JavaScript кэша...');
      try {
        // Очищаем require кэш для модулей
        if (typeof global !== 'undefined' && global.require && global.require.cache) {
          Object.keys(global.require.cache).forEach(key => {
            delete global.require.cache[key];
          });
          Logger.debug('✅ JavaScript require кэш очищен');
        }
      } catch (jsError) {
        Logger.warn('⚠️ Не удалось очистить JavaScript кэш:', jsError);
      }
      
      // 6. Сохраняем информацию о текущей версии
      Logger.debug('5. Сохранение информации о новой версии...');
      const versionInfo: VersionInfo = {
        appVersion: this.getCurrentVersion(),
        buildVersion: this.getBuildVersion(),
        updateId: this.getUpdateId(),
        lastClearTime: Date.now(),
        clearReason: reason
      };
      
      await AsyncStorage.setItem(this.APP_VERSION_KEY, JSON.stringify(versionInfo));
      Logger.debug('✅ Информация о версии сохранена:', versionInfo);
      
      Logger.debug('🎉 ВСЕ КЭШИ УСПЕШНО ОЧИЩЕНЫ!');
      
    } catch (error) {
      Logger.error('❌ КРИТИЧЕСКАЯ ОШИБКА при очистке кэшей:', error);
      throw error;
    }
  }
  
  /**
   * Принудительный перезапуск приложения после очистки кэшей
   */
  async forceRestart(reason: string = 'Cache cleared'): Promise<void> {
    Logger.debug(`🔄 ПРИНУДИТЕЛЬНЫЙ ПЕРЕЗАПУСК ПРИЛОЖЕНИЯ: ${reason}`);
    
    try {
      if (Platform.OS === 'web') {
        Logger.debug('Web платформа - перезагрузка страницы');
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
        return;
      }
      
      // Для React Native используем Updates.reloadAsync()
      if (Updates.isEnabled) {
        Logger.debug('Перезапуск через Expo Updates...');
        await Updates.reloadAsync();
      } else {
        Logger.warn('Expo Updates отключен - невозможно перезапустить приложение');
        // В dev режиме просто логируем
        if (__DEV__) {
          Logger.debug('Режим разработки - перезапуск не выполняется');
        }
      }
    } catch (error) {
      Logger.error('Ошибка при попытке перезапуска приложения:', error);
      throw error;
    }
  }

  /**
   * Комплексная очистка с принудительным перезапуском
   */
  async clearAndRestart(reason: string = 'Manual clear and restart'): Promise<void> {
    Logger.debug(`🚀 КОМПЛЕКСНАЯ ОЧИСТКА И ПЕРЕЗАПУСК: ${reason}`);
    
    try {
      // 1. Выполняем полную очистку кэшей
      await this.forceClearAll(reason);
      
      // 2. Ждем немного для завершения операций записи
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 3. Принудительно перезапускаем приложение
      await this.forceRestart('After cache clear');
      
    } catch (error) {
      Logger.error('Критическая ошибка при комплексной очистке и перезапуске:', error);
      throw error;
    }
  }
  async checkAndClearIfNeeded(): Promise<boolean> {
    if (Platform.OS === 'web') {
      Logger.debug('Web платформа - пропуск версионной проверки');
      return false;
    }
    
    try {
      const currentVersion = this.getCurrentVersion();
      const currentBuildVersion = this.getBuildVersion();
      const currentUpdateId = this.getUpdateId();
      
      // Проверяем флаг принудительной очистки
      const forceClearFlag = await AsyncStorage.getItem(this.FORCE_CLEAR_KEY);
      if (forceClearFlag === 'true') {
        await this.forceClearAll('Force clear flag detected');
        await AsyncStorage.removeItem(this.FORCE_CLEAR_KEY);
        return true;
      }
      
      // Получаем сохраненную информацию о версии
      const storedVersionInfoStr = await AsyncStorage.getItem(this.APP_VERSION_KEY);
      
      if (!storedVersionInfoStr) {
        // Первый запуск приложения
        Logger.debug('Первый запуск приложения - очистка кэшей');
        await this.forceClearAll('First app launch');
        return true;
      }
      
      const storedVersionInfo: VersionInfo = JSON.parse(storedVersionInfoStr);
      
      // Проверяем различные условия для очистки кэша
      let shouldClear = false;
      let clearReason = '';
      
      // 1. Изменилась версия приложения
      if (storedVersionInfo.appVersion !== currentVersion) {
        shouldClear = true;
        clearReason = `App version changed: ${storedVersionInfo.appVersion} → ${currentVersion}`;
      }
      
      // 2. Изменилась версия сборки
      else if (storedVersionInfo.buildVersion !== currentBuildVersion) {
        shouldClear = true;
        clearReason = `Build version changed: ${storedVersionInfo.buildVersion} → ${currentBuildVersion}`;
      }
      
      // 3. Изменился ID обновления Expo (OTA update)
      else if (currentUpdateId && storedVersionInfo.updateId !== currentUpdateId) {
        shouldClear = true;
        clearReason = `Update ID changed: ${storedVersionInfo.updateId} → ${currentUpdateId}`;
      }
      
      // 4. Проверка на коррупцию данных (отсутствие обязательных полей)
      else if (!storedVersionInfo.appVersion || !storedVersionInfo.buildVersion || !storedVersionInfo.lastClearTime) {
        shouldClear = true;
        clearReason = `Коррупция данных о версии - отсутствуют обязательные поля`;
      }
      
      if (shouldClear) {
        Logger.debug(`Обнаружена необходимость очистки кэша: ${clearReason}`);
        await this.forceClearAll(clearReason);
        return true;
      }
      
      Logger.debug('Версии совпадают, очистка кэша не требуется');
      return false;
      
    } catch (error) {
      Logger.error('Ошибка при проверке версии:', error);
      // В случае ошибки лучше очистить кэш для безопасности
      try {
        await this.forceClearAll(`Error during version check: ${error}`);
        return true;
      } catch (clearError) {
        Logger.error('Критическая ошибка при очистке кэша:', clearError);
        return false;
      }
    }
  }
  
  /**
   * Устанавливает флаг принудительной очистки для следующего запуска
   */
  async setForceClearFlag(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.FORCE_CLEAR_KEY, 'true');
      Logger.debug('Установлен флаг принудительной очистки кэша');
    } catch (error) {
      Logger.error('Ошибка при установке флага очистки:', error);
    }
  }
  
  /**
   * Получает информацию о текущей версии и последней очистке
   */
  async getVersionInfo(): Promise<VersionInfo | null> {
    try {
      const storedVersionInfoStr = await AsyncStorage.getItem(this.APP_VERSION_KEY);
      if (storedVersionInfoStr) {
        return JSON.parse(storedVersionInfoStr);
      }
      return null;
    } catch (error) {
      Logger.error('Ошибка при получении информации о версии:', error);
      return null;
    }
  }
  
  /**
   * Диагностическая информация для отладки
   */
  async getDiagnosticInfo(): Promise<{
    current: {
      appVersion: string;
      buildVersion: string;
      updateId?: string;
    };
    stored: VersionInfo | null;
    forceClearFlag: boolean;
  }> {
    const stored = await this.getVersionInfo();
    const forceClearFlag = (await AsyncStorage.getItem(this.FORCE_CLEAR_KEY)) === 'true';
    
    return {
      current: {
        appVersion: this.getCurrentVersion(),
        buildVersion: this.getBuildVersion(),
        updateId: this.getUpdateId(),
      },
      stored,
      forceClearFlag
    };
  }
}

export default AppVersionManager.getInstance();
