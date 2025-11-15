import React from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { Linking, Platform } from 'react-native';
import AppVersionManager from './src/services/AppVersionManager';
import { AuthProvider } from './src/contexts/AuthContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { FavoritesProvider } from './src/contexts/FavoritesContext';
import { PropertyProvider } from './src/contexts/PropertyContext';
import AlertProvider from './src/components/AlertProvider';
import AlertInitializer from './src/components/AlertInitializer';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { logError } from './src/utils/sentry';
import { Logger } from './src/utils/logger';
import { supabase } from './src/lib/supabaseClient';
import { parseDeepLink } from './src/utils/deepLinkParser';
import './src/translations';

export default function App() {
  // Улучшенная система управления версиями и кэшированием
  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        Logger.debug('🚀 НАЧАЛО ИНИЦИАЛИЗАЦИИ ПРИЛОЖЕНИЯ...');
        
        // Получаем диагностическую информацию до очистки
        const diagnosticInfo = await AppVersionManager.getDiagnosticInfo();
        Logger.debug('🔍 ИНФОРМАЦИЯ О ВЕРСИЯХ:');
        Logger.debug('  - Текущая версия:', diagnosticInfo.current);
        Logger.debug('  - Сохранённая версия:', diagnosticInfo.stored);
        
        // Проверяем и очищаем кэш при необходимости
        const wasCleared = await AppVersionManager.checkAndClearIfNeeded();
        
        if (wasCleared) {
          Logger.debug('🧹 Кэш был очищен из-за изменения версии или других условий');
          
          // Получаем обновлённую информацию после очистки
          const updatedInfo = await AppVersionManager.getVersionInfo();
          Logger.debug('🔄 Обновлённая информация о версии:', updatedInfo);
        } else {
          Logger.debug('✅ Кэш не требует очистки');
        }
        
        Logger.debug('✨ ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ЗАВЕРШЕНА УСПЕШНО!');
        
      } catch (error) {
        Logger.error('❌ КРИТИЧЕСКАЯ ОШИБКА при инициализации приложения:', error);
        
        // При критической ошибке пытаемся очистить кэш для восстановления
        try {
          await AppVersionManager.forceClearAll(`Критическая ошибка инициализации: ${error}`);
          Logger.debug('⚙️ Кэш очищен для восстановления после ошибки');
        } catch (clearError) {
          Logger.error('❌ Не удалось очистить кэш после ошибки:', clearError);
        }
      }
    };
    
    initializeApp();
  }, []);

  // Обработка глубоких ссылок (deep links)
  React.useEffect(() => {
    // Обработчик для ссылок, по которым открывается приложение
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      Logger.debug('Получена ссылка:', url);
      const parsed = parseDeepLink(url);
      
      if (parsed.type === 'auth') {
        Logger.debug('Обработка подтверждения email');
        const { error } = await supabase.auth.setSession({
          access_token: parsed.accessToken,
          refresh_token: parsed.refreshToken
        });
        if (error) {
          Logger.error('Ошибка установки сессии:', error);
        } else {
          Logger.debug('Сессия установлена успешно');
        }
        return;
      }

      if (parsed.type === 'property') {
        const propertyId = parsed.propertyId;
        globalThis.propertyDeepLinkId = propertyId;
        Logger.debug('Открываем объявление по ID:', propertyId);
        // @ts-ignore
        globalThis.pendingPropertyNavigation = propertyId;
        
        // @ts-ignore
        if (globalThis.navigationRef && globalThis.navigationRef.current) {
          Logger.debug('Прямая навигация к экрану деталей объявления, ID:', propertyId);
          try {
            // @ts-ignore
            globalThis.navigationRef.current.navigate('PropertyDetails', { 
              propertyId: propertyId, 
              id: propertyId 
            });
            Logger.debug('Навигация к экрану PropertyDetails с ID:', propertyId);
          } catch (error) {
            Logger.error('Ошибка при прямой навигации:', error);
          }
        }
        return;
      }

      Logger.debug('Неизвестный deeplink, пропускаем');
    };
    
    // Подписываемся на событие открытия приложения по ссылке
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Проверяем, не было ли приложение открыто по ссылке
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url });
      }
    });
    
    return () => {
      // Отписываемся при размонтировании компонента
      subscription.remove();
    };
  }, []);
  
  // Функция для проверки и установки обновлений (не запускаем на Web)
  React.useEffect(() => {
    if (Platform.OS === 'web') return; // web: проверка обновлений отключена
    // Создаем проверку обновлений в самом начале работы приложения
    async function checkForUpdates() {
      try {
        // В режиме разработки обновления не работают
        if (__DEV__) {
          Logger.debug('Обновления отключены в режиме разработки');
          return;
        }

        Logger.debug('Проверка обновлений...');
        
        // Проверяем наличие обновлений
        const update = await Updates.checkForUpdateAsync();
        
        if (update.isAvailable) {
          Logger.debug('Доступно обновление, загружаем...');
          
          try {
            // Загружаем обновление
            await Updates.fetchUpdateAsync();
            
            // Перезапускаем приложение с новыми файлами
            Logger.debug('Обновление загружено, перезапускаем приложение');
            await Updates.reloadAsync();
          } catch (error) {
            Logger.error('Ошибка при загрузке обновления:', error);
            
            // Повторная попытка через 5 секунд
            setTimeout(async () => {
              try {
                Logger.debug('Повторная попытка загрузки обновления...');
                await Updates.fetchUpdateAsync();
                await Updates.reloadAsync();
              } catch (retryError) {
                Logger.error('Повторная загрузка не удалась:', retryError);
              }
            }, 5000);
          }
        } else {
          Logger.debug('Обновлений не найдено, используем текущую версию');
        }
      } catch (e) {
        Logger.error('Ошибка при проверке обновлений:', e);
      }
    }
    
    // Запускаем проверку обновлений при запуске приложения
    checkForUpdates();
    
    // Проверяем обновления каждый час, если приложение в фоне
    const intervalId = setInterval(() => {
      checkForUpdates();
    }, 60 * 60 * 1000); // Проверяем каждый час
    
    // Очищаем интервал при уничтожении компонента
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Обработчик глобальных ошибок в приложении
  React.useEffect(() => {
    // Функция обработки непойманных ошибок
    const handleError = (error: Error) => {
      // Логируем ошибку в Sentry
      logError(error, { context: 'Global error handler' });
      Logger.error('Глобальная ошибка в приложении:', error);
    };

    // Функция обработки необработанных обещаний
    const handlePromiseRejection = (error: any) => {
      logError(error instanceof Error ? error : new Error('Unhandled Promise Rejection: ' + error), {
        context: 'Unhandled Promise rejection'
      });
      Logger.error('Необработанная ошибка в Promise:', error);
    };

    // Для React Native используем глобальный обработчик ошибок
    const errorHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error, isFatal) => {
      // Логируем ошибку и передаем её в Sentry
      handleError(error);
    
      // Затем вызываем стандартный обработчик
      errorHandler(error, isFatal);
    });

    // Подписываемся на необработанные обещания
    const rejectionTracking = require('promise/setimmediate/rejection-tracking');
    
    if (rejectionTracking) {
      rejectionTracking.enable({
        allRejections: true,
        onUnhandled: handlePromiseRejection,
      });
    }

    return () => {
      // Восстанавливаем исходный обработчик
      ErrorUtils.setGlobalHandler(errorHandler);
      
      // Отключаем отслеживание обещаний
      if (rejectionTracking) {
        rejectionTracking.disable();
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <AlertProvider>
            <AlertInitializer />
            <AuthProvider>
              <FavoritesProvider>
                <PropertyProvider>
                  <AppNavigator />
                  <StatusBar style="auto" />
                </PropertyProvider>
              </FavoritesProvider>
            </AuthProvider>
          </AlertProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
