import React from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { Linking } from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { propertyService } from './src/services/propertyService';
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
  // Одноразовая миграция/очистка кэша при смене версии (боремся с восстановлением данных Android)
  React.useEffect(() => {
    const APP_VERSION_KEY = 'app_version';
    (async () => {
      try {
        // Получаем версию надёжно для продакшена
        const currentVersion =
          Application.nativeApplicationVersion ||
          Constants.expoConfig?.version ||
          // как крайний случай — runtimeVersion, чтобы хотя бы менялось при bump-е
          (Updates.runtimeVersion as string | undefined) ||
          '0';
        const storedVersion = await AsyncStorage.getItem(APP_VERSION_KEY);
        if (storedVersion !== currentVersion) {
          console.log('Версия приложения изменилась, выполняем очистку локального кэша');
          try {
            // Полная очистка предотвращает влияние любых неизвестных ключей
            await AsyncStorage.clear();
          } catch (e) {
            console.warn('Ошибка при очистке AsyncStorage:', e);
          }
          try {
            // Чистим внутренний кэш сервисов на всякий случай
            if (propertyService && typeof propertyService.clearCache === 'function') {
              propertyService.clearCache();
            }
          } catch (e) {
            console.warn('Ошибка при очистке in-memory кэша:', e);
          }
          await AsyncStorage.setItem(APP_VERSION_KEY, currentVersion);
          console.log('Локальное хранилище и кэши очищены. Установлена версия:', currentVersion);
        }
      } catch (e) {
        console.warn('Ошибка миграции версии приложения:', e);
      }
    })();
  }, []);

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
      // 3. https://angstremoff.github.io/domgomobile/deeplink-handler.html?id=123 (обработчик ссылок)
      
      // Проверяем разные форматы ссылок на объявления
      try {
        let propertyId = null;
        let urlObj;
        
        // Исправление: URL API не всегда корректно обрабатывает кастомные схемы
        // Преобразуем domgomobile:// ссылки в понятный формат для разбора
        try {
          urlObj = new URL(url);
        } catch (urlError) {
          console.error('Ошибка при создании URL объекта:', urlError);
          
          // Если это кастомная схема, обрабатываем вручную
          if (url.startsWith('domgomobile://')) {
            // Преобразуем domgomobile:// в https:// для корректного разбора URL
            let tempUrl = url.replace('domgomobile://', 'https://domgo-temp.com/');
            try {
              urlObj = new URL(tempUrl);
            } catch (e) {
              console.error('Не удалось парсить даже после преобразования:', e);
              return; // Некорректный URL, прекращаем обработку
            }
          } else {
            return; // Некорректный URL, прекращаем обработку
          }
        }
        
        // Проверка разных форматов ссылок
        if (url.startsWith('domgomobile://')) {
          // Проверка формата domgomobile://property и его вариаций
          if (url.startsWith('domgomobile://property')) {
            // СНАЧАЛА проверяем формат с путём - domgomobile://property/XXX
            if (url.startsWith('domgomobile://property/')) {
              // Защита от пустых путей
              if (urlObj && urlObj.pathname) {
                const pathParts = urlObj.pathname.split('/');
                const filteredParts = pathParts.filter(part => part.trim() !== '');
                
                if (filteredParts.length > 0) {
                  propertyId = filteredParts[filteredParts.length - 1];
                  console.log('Получена прямая ссылка на объявление (path):', propertyId);
                } else {
                  console.warn('Путь в URL пустой, ID не найден');
                }
              } else {
                // Прямой парсинг URL, если объект URL не содержит pathname
                const parts = url.split('domgomobile://property/');
                if (parts.length > 1 && parts[1].trim() !== '') {
                  propertyId = parts[1].trim();
                  console.log('Получена прямая ссылка на объявление (ручной парсинг):', propertyId);
                }
              }
            }
            // Если не нашли в пути, проверяем формат domgomobile://property?id=XXX
            else {
              if (urlObj && urlObj.searchParams) {
                const queryParams = urlObj.searchParams;
                const queryId = queryParams.get('id');
                if (queryId) {
                  propertyId = queryId;
                  console.log('Получена прямая ссылка на объявление (query):', propertyId);
                } else {
                  // Прямой парсинг query параметров, если URL API не работает
                  if (url.includes('?id=')) {
                    const parts = url.split('?id=');
                    if (parts.length > 1 && parts[1].trim() !== '') {
                      propertyId = parts[1].trim();
                      console.log('Получена прямая ссылка на объявление (ручной парсинг query):', propertyId);
                    }
                  }
                }
              } else {
                // Прямой парсинг query параметров, если URL API не работает
                if (url.includes('?id=')) {
                  const parts = url.split('?id=');
                  if (parts.length > 1 && parts[1].trim() !== '') {
                    propertyId = parts[1].trim();
                    console.log('Получена прямая ссылка на объявление (ручной парсинг query):', propertyId);
                  }
                }
              }
            }
          }
        }
        // Проверка формата https://domgo.rs/property/123
        else if (url.includes('domgo.rs/property/')) {
          const pathParts = urlObj.pathname.split('/');
          const idIndex = pathParts.indexOf('property') + 1;
          
          if (idIndex > 0 && idIndex < pathParts.length) {
            propertyId = pathParts[idIndex];
            console.log('Получена веб-ссылка на объявление:', propertyId);
          }
        }
        // Проверка формата ссылок через обработчик Netlify или GitHub Pages
        else if (url.includes('domgo-deep-links.windsurf.build') || 
                 url.includes('angstremoff.github.io/domgomobile/deeplink-handler.html') ||
                 url.includes('angstremoff.github.io/domgomobile/property.html')) {
          propertyId = urlObj.searchParams.get('id');
          console.log('Получена ссылка из обработчика deep links:', propertyId);
        }
        
        // Если удалось получить ID объявления, сохраняем его для открытия
        if (propertyId) {
          // Сохраняем ID в глобальном объекте
          globalThis.propertyDeepLinkId = propertyId;
          
          // Отправляем событие для всех компонентов, которые могут его обработать
          console.log('Открываем объявление по ID:', propertyId);
          
          // Добавляем интерфейс для TypeScript
          // Устанавливаем отложенную навигацию и позволяем AppNavigator обработать ее
          console.log('Устанавливаем отложенную навигацию для ID:', propertyId);
          // @ts-ignore - Игнорируем ошибки TypeScript для глобальных переменных
          globalThis.pendingPropertyNavigation = propertyId;
          
          // Прямая навигация, если приложение уже запущено
          // @ts-ignore - Игнорируем ошибки TypeScript
          if (globalThis.navigationRef && globalThis.navigationRef.current) {
            console.log('Прямая навигация к экрану деталей объявления, ID:', propertyId);
            try {
              // Очень важно: PropertyDetails ожидает параметр propertyId
              // @ts-ignore - Игнорируем ошибки TypeScript
              // Исправление: Используем navigate вместо reset
              globalThis.navigationRef.current.navigate('PropertyDetails', { 
                propertyId: propertyId, 
                id: propertyId 
              });
              console.log('Навигация к экрану PropertyDetails с ID:', propertyId);
            } catch (error) {
              console.error('Ошибка при прямой навигации:', error);
            }
          }
        }
      } catch (error) {
        console.error('Ошибка при обработке URL объявления:', error);
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
    // Создаем проверку обновлений в самом начале работы приложения
    async function checkForUpdates() {
      try {
        // В режиме разработки обновления не работают
        if (__DEV__) {
          console.log('Обновления отключены в режиме разработки');
          return;
        }

        console.log('Проверка обновлений...');
        
        // Проверяем наличие обновлений
        const update = await Updates.checkForUpdateAsync();
        
        if (update.isAvailable) {
          console.log('Доступно обновление, загружаем...');
          
          try {
            // Загружаем обновление
            await Updates.fetchUpdateAsync();
            
            // Перезапускаем приложение с новыми файлами
            console.log('Обновление загружено, перезапускаем приложение');
            await Updates.reloadAsync();
          } catch (error) {
            console.error('Ошибка при загрузке обновления:', error);
            
            // Повторная попытка через 5 секунд
            setTimeout(async () => {
              try {
                console.log('Повторная попытка загрузки обновления...');
                await Updates.fetchUpdateAsync();
                await Updates.reloadAsync();
              } catch (retryError) {
                console.error('Повторная загрузка не удалась:', retryError);
              }
            }, 5000);
          }
        } else {
          console.log('Обновлений не найдено, используем текущую версию');
        }
      } catch (e) {
        console.error('Ошибка при проверке обновлений:', e);
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
