import * as Sentry from '@sentry/react-native';
import { SENTRY_DSN, APP_VERSION } from '@env';

/**
 * Инициализация Sentry для отслеживания ошибок
 * Эта функция должна вызываться один раз при запуске приложения
 */
export const initSentry = () => {
  Sentry.init({
    dsn: SENTRY_DSN, // DSN из переменных окружения
    debug: __DEV__, // Включаем отладку только в режиме разработки
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: 1.0, // Собираем 100% трассировок в начале для лучшей диагностики
    enabled: true, // Можно временно отключить в случае необходимости
    
    // Настраиваем правила для сбора данных
    beforeSend(event) {
      // Можно здесь фильтровать события перед отправкой
      // Например, исключать определённые типы ошибок
      return event;
    },
  });
  
  // Устанавливаем контекст пользователя (можно вызывать отдельно после авторизации)
  // Sentry.setUser({ id: 'userId', email: 'user@example.com' });
  
  // Устанавливаем теги для лучшей фильтрации ошибок
  Sentry.setTag('app.version', APP_VERSION || '0.3.1');
  
  console.log('Sentry успешно инициализирован');
};

/**
 * Функция для ручного логирования ошибок
 * @param error - Объект ошибки
 * @param context - Дополнительный контекст ошибки
 */
export const logError = (error: Error | string, context?: Record<string, any>) => {
  if (typeof error === 'string') {
    // Если передана строка, создаём объект ошибки
    Sentry.captureMessage(error, {
      level: 'error', // Используем строки вместо Severity enum
      contexts: context ? { additionalContext: context } : undefined,
    });
  } else {
    // Если передан объект ошибки
    Sentry.captureException(error, {
      contexts: context ? { additionalContext: context } : undefined,
    });
  }
};

/**
 * Функция для ручного логирования предупреждений
 * @param message - Текст предупреждения
 * @param context - Дополнительный контекст
 */
export const logWarning = (message: string, context?: Record<string, any>) => {
  Sentry.captureMessage(message, {
    level: 'warning', // Используем строки вместо Severity enum
    contexts: context ? { additionalContext: context } : undefined,
  });
};

// Хук для компонента ErrorBoundary
export const sentryErrorBoundary = Sentry.withErrorBoundary;
