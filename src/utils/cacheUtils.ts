/**
 * Утилиты для работы с кэшем приложения
 */

/**
 * Дата-класс для хранения кэшированных данных
 */
export type CachedData<T = any> = {
  data: T[];
  totalCount: number;
  timestamp: number;
  hasMore: boolean;
};

/**
 * Проверяет, актуален ли кэш
 * @param timestamp Время последнего обновления кэша
 * @param maxAge Максимальное время жизни кэша в мс (по умолчанию 5 минут)
 * @returns true, если кэш ещё актуальный
 */
export const isCacheValid = (timestamp: number, maxAge: number = 300000): boolean => {
  if (!timestamp) return false;
  return Date.now() - timestamp < maxAge;
};

/**
 * Проверяет, нужно ли принудительно инвалидировать кэш
 * @param lastWriteTimestamp Время последней записи в базу
 * @param cacheTimestamp Время последнего обновления кэша
 * @returns true, если кэш нужно инвалидировать
 */
export const shouldInvalidateCache = (lastWriteTimestamp: number, cacheTimestamp: number): boolean => {
  return lastWriteTimestamp > cacheTimestamp;
};
