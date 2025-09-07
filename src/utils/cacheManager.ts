interface CacheItem<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheConfig {
  maxSize: number;
  ttl: number; // Time To Live в миллисекундах
  cleanupInterval: number; // Интервал очистки в миллисекундах
}

export class LRUCacheManager<T> {
  private cache = new Map<string, CacheItem<T>>();
  private accessOrder: string[] = [];
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 100,
      ttl: config.ttl || 5 * 60 * 1000, // 5 минут по умолчанию
      cleanupInterval: config.cleanupInterval || 2 * 60 * 1000 // 2 минуты
    };

    this.startCleanupTimer();
  }

  set(key: string, data: T): void {
    const now = Date.now();
    
    // Если элемент уже существует, удаляем его из старой позиции
    if (this.cache.has(key)) {
      this.removeFromAccessOrder(key);
    }

    // Если кэш переполнен, удаляем наименее используемый элемент
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    // Добавляем новый элемент
    this.cache.set(key, {
      data,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now
    });

    this.accessOrder.push(key);
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Проверяем TTL
    const now = Date.now();
    if (now - item.timestamp > this.config.ttl) {
      this.delete(key);
      return null;
    }

    // Обновляем статистику доступа
    item.accessCount++;
    item.lastAccessed = now;

    // Перемещаем элемент в конец списка доступа (как наиболее недавно использованный)
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);

    return item.data;
  }

  delete(key: string): boolean {
    this.removeFromAccessOrder(key);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  // Получение статистики кэша (полезно для мониторинга)
  getStats() {
    const now = Date.now();
    let validItems = 0;
    let expiredItems = 0;

    for (const [, item] of this.cache.entries()) {
      if (now - item.timestamp > this.config.ttl) {
        expiredItems++;
      } else {
        validItems++;
      }
    }

    return {
      totalItems: this.cache.size,
      validItems,
      expiredItems,
      maxSize: this.config.maxSize,
      fillPercentage: (this.cache.size / this.config.maxSize) * 100
    };
  }

  private evictLeastRecentlyUsed(): void {
    if (this.accessOrder.length === 0) return;
    
    const lruKey = this.accessOrder[0];
    this.delete(lruKey);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.config.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  // Важно для предотвращения memory leaks
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

// Предустановленные кэш-менеджеры для разных типов данных
export const propertyCache = new LRUCacheManager({
  maxSize: 50, // Максимум 50 объектов недвижимости в кэше
  ttl: 5 * 60 * 1000, // 5 минут
  cleanupInterval: 2 * 60 * 1000 // Очистка каждые 2 минуты
});

export const imageCache = new LRUCacheManager({
  maxSize: 100, // Больше изображений можем кэшировать
  ttl: 10 * 60 * 1000, // 10 минут для изображений
  cleanupInterval: 5 * 60 * 1000
});

export const apiCache = new LRUCacheManager({
  maxSize: 200, // API запросы
  ttl: 3 * 60 * 1000, // 3 минуты
  cleanupInterval: 1 * 60 * 1000
});