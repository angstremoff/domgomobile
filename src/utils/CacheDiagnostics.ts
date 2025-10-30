import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from './logger';
import AppVersionManager from '../services/AppVersionManager';
import { Platform } from 'react-native';

interface CacheDiagnosticInfo {
  asyncStorageKeys: string[];
  asyncStorageSize: number;
  versionInfo: any;
  platform: string;
  timestamp: number;
}

class CacheDiagnostics {
  private static instance: CacheDiagnostics;
  
  private constructor() {}
  
  static getInstance(): CacheDiagnostics {
    if (!CacheDiagnostics.instance) {
      CacheDiagnostics.instance = new CacheDiagnostics();
    }
    return CacheDiagnostics.instance;
  }
  
  /**
   * Собирает диагностическую информацию о состоянии кэшей
   */
  async getDiagnosticInfo(): Promise<CacheDiagnosticInfo> {
    try {
      // Получаем все ключи из AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      
      // Подсчитываем приблизительный размер данных в AsyncStorage
      let totalSize = 0;
      const sampleKeys = keys.slice(0, 10); // Проверяем первые 10 ключей для примерной оценки
      
      for (const key of sampleKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        } catch (error) {
          Logger.warn(`Ошибка при получении размера для ключа ${key}:`, error);
        }
      }
      
      // Экстраполируем размер на все ключи
      const estimatedTotalSize = Math.round((totalSize / sampleKeys.length) * keys.length);
      
      // Получаем информацию о версии
      const versionInfo = await AppVersionManager.getDiagnosticInfo();
      
      return {
        asyncStorageKeys: [...keys],
        asyncStorageSize: estimatedTotalSize,
        versionInfo,
        platform: Platform.OS,
        timestamp: Date.now()
      };
      
    } catch (error) {
      Logger.error('Ошибка при сборе диагностической информации:', error);
      return {
        asyncStorageKeys: [],
        asyncStorageSize: 0,
        versionInfo: null,
        platform: Platform.OS,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Выводит диагностическую информацию в лог
   */
  async logDiagnosticInfo(): Promise<void> {
    const info = await this.getDiagnosticInfo();
    
    Logger.debug('=== ДИАГНОСТИКА КЭША ===');
    Logger.debug(`Платформа: ${info.platform}`);
    Logger.debug(`Время: ${new Date(info.timestamp).toLocaleString()}`);
    Logger.debug(`Количество ключей в AsyncStorage: ${info.asyncStorageKeys.length}`);
    Logger.debug(`Примерный размер AsyncStorage: ${info.asyncStorageSize} символов`);
    
    if (info.asyncStorageKeys.length > 0) {
      Logger.debug('Ключи в AsyncStorage:', info.asyncStorageKeys.join(', '));
    }
    
    if (info.versionInfo) {
      Logger.debug('Информация о версиях:', info.versionInfo);
    }
    
    Logger.debug('=== КОНЕЦ ДИАГНОСТИКИ ===');
  }
  
  /**
   * Проверяет, есть ли признаки проблем с кэшированием
   */
  async checkForCacheIssues(): Promise<{
    hasIssues: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const info = await this.getDiagnosticInfo();
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Проверка 1: Слишком много ключей в AsyncStorage
    if (info.asyncStorageKeys.length > 100) {
      issues.push(`Слишком много ключей в AsyncStorage: ${info.asyncStorageKeys.length}`);
      recommendations.push('Рекомендуется очистка устаревших данных');
    }
    
    // Проверка 2: Слишком большой размер AsyncStorage
    if (info.asyncStorageSize > 1000000) { // > 1MB
      issues.push(`Большой размер AsyncStorage: ~${Math.round(info.asyncStorageSize / 1024)} KB`);
      recommendations.push('Рекомендуется очистка больших данных или их оптимизация');
    }
    
    // Проверка 3: Устаревшие ключи кэша
    const oldCacheKeys = info.asyncStorageKeys.filter(key => 
      key.includes('cache') || key.includes('temp') || key.includes('old_')
    );
    
    if (oldCacheKeys.length > 10) {
      issues.push(`Найдено много устаревших ключей кэша: ${oldCacheKeys.length}`);
      recommendations.push('Рекомендуется очистка устаревших ключей кэша');
    }
    
    // Проверка 4: Несоответствие версий
    if (info.versionInfo && info.versionInfo.stored && info.versionInfo.current) {
      const stored = info.versionInfo.stored;
      const current = info.versionInfo.current;
      
      if (stored.appVersion !== current.appVersion) {
        issues.push(`Несоответствие версий приложения: ${stored.appVersion} vs ${current.appVersion}`);
        recommendations.push('Рекомендуется принудительная очистка кэша');
      }
      
      if (stored.buildVersion !== current.buildVersion) {
        issues.push(`Несоответствие версий сборки: ${stored.buildVersion} vs ${current.buildVersion}`);
        recommendations.push('Рекомендуется принудительная очистка кэша');
      }
    }
    
    return {
      hasIssues: issues.length > 0,
      issues,
      recommendations
    };
  }
  
  /**
   * Автоматическое исправление обнаруженных проблем
   */
  async autoFixIssues(): Promise<{
    fixed: boolean;
    actions: string[];
    errors: string[];
  }> {
    const actions: string[] = [];
    const errors: string[] = [];
    
    try {
      const issueCheck = await this.checkForCacheIssues();
      
      if (!issueCheck.hasIssues) {
        return { fixed: false, actions: ['Проблем не обнаружено'], errors: [] };
      }
      
      Logger.debug('Обнаружены проблемы с кэшем, пытаемся исправить...');
      
      // Исправление: принудительная очистка кэша
      try {
        await AppVersionManager.forceClearAll('Auto-fix cache issues');
        actions.push('Выполнена принудительная очистка всех кэшей');
      } catch (error) {
        errors.push(`Ошибка при очистке кэша: ${error}`);
      }
      
      return {
        fixed: errors.length === 0,
        actions,
        errors
      };
      
    } catch (error) {
      Logger.error('Ошибка при автоматическом исправлении проблем:', error);
      return {
        fixed: false,
        actions: [],
        errors: [`Критическая ошибка: ${error}`]
      };
    }
  }
  
  /**
   * Мгновенная принудительная очистка (для использования в UI)
   */
  async emergencyCacheClear(): Promise<{
    success: boolean;
    message: string;
    details?: string[];
  }> {
    try {
      Logger.debug('🚑 МГНОВЕННАЯ ОЧИСТКА КЭША!');
      
      const details: string[] = [];
      
      // Используем AppVersionManager для полной очистки
      await AppVersionManager.forceClearAll('Принудительная очистка через интерфейс');
      details.push('Все кэши успешно очищены');
      
      return {
        success: true,
        message: 'Кэши успешно очищены!',
        details
      };
      
    } catch (error) {
      Logger.error('Ошибка при мгновенной очистке кэша:', error);
      return {
        success: false,
        message: `Ошибка при очистке: ${error}`,
      };
    }
  }
  async runFullDiagnostics(): Promise<{
    diagnosticInfo: CacheDiagnosticInfo;
    issues: { hasIssues: boolean; issues: string[]; recommendations: string[] };
    autoFix?: { fixed: boolean; actions: string[]; errors: string[] };
  }> {
    const diagnosticInfo = await this.getDiagnosticInfo();
    const issues = await this.checkForCacheIssues();
    
    const result: any = {
      diagnosticInfo,
      issues
    };
    
    // Если есть проблемы, пытаемся их исправить
    if (issues.hasIssues) {
      result.autoFix = await this.autoFixIssues();
    }
    
    return result;
  }
}

export default CacheDiagnostics.getInstance();