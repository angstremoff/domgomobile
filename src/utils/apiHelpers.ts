/**
/**
 * Утилиты для работы с API запросами
 */

import { Logger } from './logger';

/**
 * Функция для выполнения повторных попыток запроса при ошибках
 * @param operation - Асинхронная функция, которую нужно выполнить
 * @param retries - Максимальное количество попыток
 * @param delayMs - Задержка между попытками в миллисекундах
 * @param backoff - Множитель для увеличения времени задержки (экспоненциальная задержка)
 * @returns Результат асинхронной операции
 */
export async function retry<T>(
  operation: () => Promise<T> | PromiseLike<T>,
  retries = 3,
  delayMs = 500,
  backoff = 1.5
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries <= 1) {
      throw error;
    }
    
    Logger.debug(`Ошибка при выполнении запроса, повторная попытка через ${delayMs}мс...`);
    Logger.debug(`Осталось попыток: ${retries - 1}`);
    
    // Ждем перед повторной попыткой
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    // Рекурсивно вызываем с уменьшенным числом попыток
    return retry(operation, retries - 1, delayMs * backoff, backoff);
  }
}

/**
 * Функция для добавления таймаута к запросам Supabase
 * @param promise - Промис запроса Supabase или обычный Promise
 * @param timeoutMs - Время ожидания в миллисекундах
 * @param errorMessage - Сообщение об ошибке при таймауте
 * @returns Результат промиса или ошибка по таймауту
 */
export function withTimeout<T>(
  promise: Promise<T> | any,
  timeoutMs = 10000,
  errorMessage = 'Превышено время ожидания запроса'
): Promise<T> {
  // Создаем промис, который отклоняется после указанного таймаута
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  // Супабейз использует свой класс PostgrestFilterBuilder, обернем его в Promise, если необходимо
  const actualPromise = promise instanceof Promise ? promise : Promise.resolve(promise);

  // Возвращаем тот из промисов, который завершится первым
  return Promise.race([actualPromise, timeoutPromise]) as Promise<T>;
}

/**
 * Создает уникальный ключ кэша на основе параметров запроса
 * @param baseKey - Базовый ключ (например, имя метода API)
 * @param params - Параметры запроса
 * @returns Строковый ключ для кэширования
 */
export function createCacheKey(baseKey: string, params: Record<string, any> = {}): string {
  const sortedParams = Object.entries(params)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join('&');
  
  return `${baseKey}${sortedParams ? `:${sortedParams}` : ''}`;
}
