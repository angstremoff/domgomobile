import React from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { Linking } from 'react-native';
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
import { supabase } from './src/lib/supabaseClient';
import './src/translations';

export default function App() {
  // Обработка глубоких ссылок (deep links) для подтверждения email
  React.useEffect(() => {
    // Обработчик для ссылок, по которым открывается приложение
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log('Получена ссылка:', url);
      
      // Проверяем, что это ссылка подтверждения email
      if (url.includes('domgomobile://auth/callback')) {
        // Извлекаем параметры из URL
        const params = new URL(url).searchParams;
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');
        
        console.log('Обработка подтверждения email. Тип:', type);
        
        if (accessToken && refreshToken) {
          // Устанавливаем сессию пользователя в Supabase
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Ошибка установки сессии:', error);
          } else {
            console.log('Сессия установлена успешно');
          }
        }
      }
      
      // Обработка ссылок на объявления
      // Варианты ссылок:
      // 1. https://domgo.info/property/123 (веб-ссылка)
      // 2. domgomobile://property/123 (нативная ссылка)
      let propertyId = null;
      
      // Проверяем разные форматы ссылок на объявления
      if (url.includes('domgo.info/property/') || url.includes('domgomobile://property/')) {
        try {
          // Пытаемся извлечь ID объявления из URL
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/');
          const idIndex = pathParts.indexOf('property') + 1;
          
          if (idIndex > 0 && idIndex < pathParts.length) {
            propertyId = pathParts[idIndex];
            console.log('Найден ID объявления в URL:', propertyId);
            
            // Тут можно добавить навигацию к конкретному объявлению
            // (будет реализовано через глобальное событие)
            globalThis.propertyDeepLinkId = propertyId;
            console.log('Установлен глобальный ID для открытия объявления:', propertyId);
          }
        } catch (error) {
          console.error('Ошибка при обработке URL объявления:', error);
        }
      }
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
  
  // Функция для проверки и установки обновлений
  React.useEffect(() => {
    async function checkForUpdates() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          console.log('Доступно обновление, загружаем...');
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        } else {
          console.log('Обновлений не найдено, используем текущую версию');
        }
      } catch (e) {
        console.log('Ошибка при проверке обновлений:', e);
      }
    }
    
    checkForUpdates();
  }, []);

  // Обработчик глобальных ошибок в приложении
  React.useEffect(() => {
    // Функция обработки непойманных ошибок
    const handleError = (error: Error) => {
      // Логируем ошибку в Sentry
      logError(error, { context: 'Global error handler' });
      console.error('Глобальная ошибка в приложении:', error);
    };

    // Функция обработки необработанных обещаний
    const handlePromiseRejection = (error: any) => {
      logError(error instanceof Error ? error : new Error('Unhandled Promise Rejection: ' + error), {
        context: 'Unhandled Promise rejection'
      });
      console.error('Необработанная ошибка в Promise:', error);
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
