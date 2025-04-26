import { supabase } from '../lib/supabaseClient';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from '../lib/database.types';
import { compressImage } from '../utils/imageCompression';
import { Buffer } from 'buffer';
import * as FileSystem from 'expo-file-system';
import { retry, withTimeout } from '../utils/apiHelpers';
import { logError } from '../utils/sentry';

// Тип для кэшированных данных
type CachedData = {
  data: any[];
  totalCount: number;
  timestamp: number;
  hasMore: boolean;
};

// Кэш для хранения результатов запросов и предотвращения дублирования
const requestCache: Record<string, CachedData> = {
  all: { data: [], totalCount: 0, timestamp: 0, hasMore: false },
  sale: { data: [], totalCount: 0, timestamp: 0, hasMore: false },
  rent: { data: [], totalCount: 0, timestamp: 0, hasMore: false }
};

// Таймштамп последнего обновления данных в БД
// Для отслеживания изменений и своевременной инвалидации кэша
const lastDataUpdate = { timestamp: Date.now() };

/**
 * Инвалидирует кэш для обновления данных после изменений
 * @param type - Тип кэша для инвалидации ('all', 'sale', 'rent') или undefined для всех типов
 * @param propertyId - ID объявления для инвалидации конкретного кэша деталей объявления
 */
export const invalidateCache = (type?: 'all' | 'sale' | 'rent', propertyId?: string) => {
  console.log(`Инвалидация кэша: ${type || 'все'} ${propertyId ? `для объявления ${propertyId}` : ''}`);
  
  // Если указан ID объявления, инвалидируем только его кэш
  if (propertyId) {
    if (requestCache[`detail-${propertyId}`]) {
      requestCache[`detail-${propertyId}`].timestamp = 0;
    }
  }
  
  // Инвалидируем кэш по указанному типу или все типы
  if (type) {
    if (requestCache[type]) {
      requestCache[type].timestamp = 0;
    }
  } else {
    // Инвалидируем все типы кэша
    ['all', 'sale', 'rent'].forEach(cacheType => {
      if (requestCache[cacheType]) {
        requestCache[cacheType].timestamp = 0;
      }
    });
    
    // Инвалидируем все кэши деталей объявлений
    Object.keys(requestCache).forEach(key => {
      if (key.startsWith('detail-')) {
        requestCache[key].timestamp = 0;
      }
    });
  }
};

// Флаги для отслеживания активных запросов
const activeRequests = {
  all: false,
  sale: false,
  rent: false,
  byId: new Set()
};

// Минимальный интервал между запросами в мс
// 5 минут для списков объявлений
const MIN_REQUEST_INTERVAL = 300000; // 5 минут = 300 секунд = 300000 мс

// 15 минут для детальной информации об объявлении
const MIN_DETAIL_REQUEST_INTERVAL = 900000; // 15 минут = 900 секунд = 900000 мс

type PropertyInsert = Database['public']['Tables']['properties']['Insert'];

/**
 * Полная очистка кэша объявлений
 * Вызывается после создания или изменения объявления
 */
const clearCache = () => {
  console.log('Полная очистка кэша объявлений');
  
  // Очищаем все кэши списков
  ['all', 'sale', 'rent'].forEach(cacheType => {
    if (requestCache[cacheType]) {
      requestCache[cacheType] = { data: [], totalCount: 0, timestamp: 0, hasMore: false };
    }
  });
  
  // Очищаем кэши деталей объявлений
  Object.keys(requestCache).forEach(key => {
    if (key.startsWith('detail-')) {
      delete requestCache[key];
    }
  });
  
  // Сбрасываем флаги активных запросов
  activeRequests.all = false;
  activeRequests.sale = false;
  activeRequests.rent = false;
  activeRequests.byId.clear();
  
  // Обновляем время последнего обновления
  lastDataUpdate.timestamp = Date.now();
};

export const propertyService = {
  clearCache,
  /**
   * Инвалидирует кэш для обновления данных после изменений
   * @param type - Тип кэша для инвалидации ('all', 'sale', 'rent') или undefined для всех типов
   * @param propertyId - ID объявления для инвалидации конкретного кэша деталей объявления
   */
  invalidateCache(type?: 'all' | 'sale' | 'rent', propertyId?: string) {
    invalidateCache(type, propertyId);
  },
  async getProperties(page = 1, pageSize = 10) {
    // Проверяем есть ли активный запрос
    if (activeRequests.all && page === 1) {
      console.log('Активный запрос getProperties уже выполняется, ожидаем...');
      // Возвращаем кэшированные данные, если они есть
      if (requestCache.all.data.length > 0) {
        console.log('Возвращаем кэшированные данные вместо нового запроса');
        return { 
          data: requestCache.all.data, 
          totalCount: requestCache.all.totalCount,
          hasMore: requestCache.all.hasMore
        };
      }
    }
    
    // Проверяем, не было ли уже недавнего запроса
    const now = Date.now();
    if (page === 1 && 
        requestCache.all.data.length > 0 && 
        now - requestCache.all.timestamp < MIN_REQUEST_INTERVAL) {
      console.log(`Недавний запрос (${Math.round((now - requestCache.all.timestamp)/1000)}с назад), возвращаем кэш`);
      return { 
        data: requestCache.all.data, 
        totalCount: requestCache.all.totalCount,
        hasMore: requestCache.all.hasMore
      };
    }
    
    try {
      activeRequests.all = true;
      
      // Вычисляем начальную позицию для пагинации
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      console.log(`Загружаем объявления: страница ${page}, размер страницы ${pageSize}, диапазон ${from}-${to}`);
      
      // Используем retry и withTimeout для улучшения надежности запросов
      const response = await retry<{
        data: any[] | null;
        error: any | null;
        count: number | null;
      }>(async () => {
        const promise = supabase
          .from('properties')
          .select(`
            *,
            user:users(name, phone),
            city:cities(name)
          `, { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to);
          
        return withTimeout(
          promise,
          15000, // 15 секунд таймаут
          'Превышено время ожидания запроса списка объявлений'
        );
      }, 3, 1000); // 3 попытки с интервалом 1 секунда
        
      const { data, error, count } = response as {
        data: any[] | null;
        error: any | null;
        count: number | null;
      };
      
      if (error) {
        logError(error, { context: 'getProperties', page, pageSize });
        throw error;
      }
      
      const result = { 
        data: data || [], 
        totalCount: count || 0,
        hasMore: (count || 0) > to + 1
      };
      
      // Обновляем кэш, если это первая страница
      if (page === 1) {
        requestCache.all = {
          data: result.data,
          totalCount: result.totalCount,
          hasMore: result.hasMore,
          timestamp: Date.now()
        };
      }
      
      console.log(`Загружено объявлений: ${data?.length || 0} из ${count || 'неизвестно'}`);
      return result;
    } catch (error) {
      console.error('Ошибка при получении объявлений:', error);
      logError(error as Error, { context: 'getProperties', page, pageSize });
      return { data: [], totalCount: 0, hasMore: false };
    } finally {
      activeRequests.all = false;
    }
  },

  async getPropertyById(id: string) {
    // Проверяем есть ли активный запрос на это объявление
    if (activeRequests.byId.has(id)) {
      console.log(`Активный запрос getPropertyById(${id}) уже выполняется, ожидаем...`);
      // Проверяем наличие кэша по ID
      if (requestCache[`detail-${id}`]?.data?.length > 0) {
        console.log(`Возвращаем кэшированные данные объявления ${id}`);
        return requestCache[`detail-${id}`].data[0];
      }
    }
    
    // Проверяем, не было ли уже недавнего запроса
    const now = Date.now();
    if (requestCache[`detail-${id}`]?.data?.length > 0 && 
        now - requestCache[`detail-${id}`].timestamp < MIN_DETAIL_REQUEST_INTERVAL) {
      console.log(`Недавний запрос объявления ${id} (${Math.round((now - requestCache[`detail-${id}`].timestamp)/1000)}с назад), возвращаем кэш`);
      return requestCache[`detail-${id}`].data[0];
    }
    
    try {
      // Помечаем запрос как активный
      activeRequests.byId.add(id);
      
      // Используем retry и withTimeout для улучшения надежности запроса
      const response = await retry<{
        data: any | null;
        error: any | null;
      }>(async () => {
        // Создаем запрос к Supabase
        const query = supabase
          .from('properties')
          .select(`
            *,
            user:users(name, phone),
            city:cities(name)
          `)
          .eq('id', id)
          .single();
          
        // Добавляем таймаут к запросу
        // Преобразуем в Promise для корректной типизации
        return withTimeout<{ data: any | null; error: any | null }>(
          Promise.resolve(query) as Promise<{ data: any | null; error: any | null }>,
          10000, // 10 секунд таймаут
          `Превышено время ожидания данных объявления ${id}`
        );
      }, 3, 1000); // 3 попытки с интервалом 1 секунда
        
      const { data, error } = response as {
        data: any | null;
        error: any | null;
      };
      
      if (error) {
        logError(error, { context: 'getPropertyById', propertyId: id });
        throw error;
      }
      
      // Сохраняем в кэш
      if (data) {
        requestCache[`detail-${id}`] = {
          data: [data],
          totalCount: 1,
          hasMore: false,
          timestamp: Date.now()
        };
      }
      
      console.log('Данные объявления из базы:', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Ошибка при получении объявления:', error);
      logError(error as Error, { context: 'getPropertyById', propertyId: id });
      return null;
    } finally {
      // Удаляем из списка активных запросов
      activeRequests.byId.delete(id);
    }
  },

  async getUserProperties() {
    try {
      // Получаем текущего пользователя с использованием retry
      const userResponse = await retry<{ data: { user: any | null }, error: any | null }>(async () => {
        return withTimeout(
          supabase.auth.getUser(),
          8000,
          'Превышено время ожидания данных пользователя'
        );
      }, 2);
      
      const { data: { user } } = userResponse;
      
      if (!user) return [];
      
      // Получаем объявления пользователя с использованием retry
      const response = await retry<{
        data: any[] | null;
        error: any | null;
      }>(async () => {
        const promise = supabase
          .from('properties')
          .select(`
            *,
            user:users(name, phone),
            city:cities(name)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        return withTimeout(
          promise,
          12000, // 12 секунд таймаут
          'Превышено время ожидания списка ваших объявлений'
        );
      }, 3, 1000);
        
      const { data, error } = response as {
        data: any[] | null;
        error: any | null;
      };
      
      if (error) {
        logError(error, { context: 'getUserProperties', userId: user.id });
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Ошибка при получении списка объявлений пользователя:', error);
      logError(error as Error, { context: 'getUserProperties' });
      return [];
    }
  },

  async getUserPropertiesCount() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return 0;
      
      const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('Ошибка при получении количества объявлений пользователя:', error);
      return 0;
    }
  },

  async createProperty(propertyData: any) {
    try {
      // Получение UUID пользователя
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Пользователь не авторизован');
      
      // Подготовка данных для вставки
      const propertyForInsert: PropertyInsert = {
        ...propertyData,
        user_id: user.id,
        // Добавляем пустой массив изображений, если он не предоставлен
        images: propertyData.images || [],
        status: 'active', // По умолчанию активное объявление
      };
      
      // Добавление объявления в базу данных
      const { data, error } = await supabase
        .from('properties')
        .insert(propertyForInsert)
        .select()
        .single();
        
      if (error) throw error;
      
      // Инвалидируем весь кэш после успешного создания
      invalidateCache(); // Обновляем все списки, т.к. добавлено новое объявление
      
      console.log('Объявление успешно создано:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Ошибка при создании объявления:', error);
      return { success: false, error };
    }
  },
  
  async markAsSold(propertyId: string) {
    const { error } = await supabase
      .from('properties')
      .update({ status: 'sold' })
      .eq('id', propertyId);
      
    if (error) throw error;
  },
  
  async markAsRented(propertyId: string) {
    const { error } = await supabase
      .from('properties')
      .update({ status: 'rented' })
      .eq('id', propertyId);
      
    if (error) throw error;
  },
  
  async markAsActive(id: string) {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: 'active' })
        .eq('id', id);
        
      if (error) throw error;
      
      // Инвалидируем кэш, т.к. изменился статус объявления
      invalidateCache(undefined, id);
      
      console.log('Статус объявления успешно обновлен на active:', id);
      return { success: true };
    } catch (error) {
      console.error('Ошибка при обновлении статуса объявления:', error);
      return { success: false, error };
    }
  },
  
  async deleteProperty(propertyId: string) {
    try {
      // Получаем текущего пользователя
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Пользователь не авторизован');
      }
      
      // Проверяем, является ли пользователь владельцем объявления
      const { data: property, error: checkError } = await supabase
        .from('properties')
        .select('user_id, images')
        .eq('id', propertyId)
        .single();
      
      if (checkError) throw checkError;
      
      // Если текущий пользователь не владелец объявления
      if (!property || property.user_id !== user.id) {
        console.error('Отказано в доступе: пользователь не является владельцем объявления');
        return { success: false, error: 'Отказано в доступе: вы не являетесь владельцем этого объявления' };
      }
      
      // Удаляем фотографии из хранилища, если они есть
      if (property.images && property.images.length > 0) {
        try {
          // Получаем имена файлов из полных URL
          const fileNames = property.images.map((imageUrl: string) => {
            // Извлекаем имя файла из URL
            const parts = imageUrl.split('/');
            return parts[parts.length - 1];
          });
          
          console.log('Удаление файлов из хранилища:', fileNames);
          
          // Удаляем все файлы из бакета property-images
          const { error: storageError } = await supabase
            .storage
            .from('property-images')
            .remove(fileNames);
          
          if (storageError) {
            console.error('Ошибка при удалении файлов из хранилища:', storageError);
            // Продолжаем удаление объявления даже если не удалось удалить фото
          } else {
            console.log('Все фотографии успешно удалены из хранилища');
          }
        } catch (storageError) {
          console.error('Ошибка при попытке удаления файлов:', storageError);
          // Продолжаем процесс удаления объявления даже если не удалось удалить фото
        }
      }
      
      // Продолжаем удаление объявления из базы данных
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);
        
      if (error) throw error;
      
      // Инвалидируем весь кэш после удаления объявления
      invalidateCache(); // Полностью обновляем все списки
      
      console.log('Объявление успешно удалено:', propertyId);
      return { success: true };
    } catch (error) {
      console.error('Ошибка при удалении объявления:', error);
      return { success: false, error };
    }
  },

  async getPropertiesByType(type: 'sale' | 'rent', page = 1, pageSize = 10) {
    // Проверяем есть ли активный запрос
    if (activeRequests[type] && page === 1) {
      console.log(`Активный запрос getPropertiesByType(${type}) уже выполняется, ожидаем...`);
      // Возвращаем кэшированные данные, если они есть
      if (requestCache[type].data.length > 0) {
        console.log(`Возвращаем кэшированные данные типа ${type} вместо нового запроса`);
        return { 
          data: requestCache[type].data, 
          totalCount: requestCache[type].totalCount,
          hasMore: requestCache[type].hasMore
        };
      }
    }
    
    // Проверяем, не было ли уже недавнего запроса
    const now = Date.now();
    if (page === 1 && 
        requestCache[type].data.length > 0 && 
        now - requestCache[type].timestamp < MIN_REQUEST_INTERVAL) {
      console.log(`Недавний запрос типа ${type} (${Math.round((now - requestCache[type].timestamp)/1000)}с назад), возвращаем кэш`);
      return { 
        data: requestCache[type].data, 
        totalCount: requestCache[type].totalCount,
        hasMore: requestCache[type].hasMore
      };
    }
    
    try {
      activeRequests[type] = true;
      
      // Вычисляем начальную позицию для пагинации
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      console.log(`Загружаем объявления типа ${type}: страница ${page}, размер страницы ${pageSize}, диапазон ${from}-${to}`);
      
      const { data, error, count } = await supabase
        .from('properties')
        .select(`
          *,
          user:users(name, phone),
          city:cities(name)
        `, { count: 'exact' })
        .eq('type', type)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      const result = { 
        data: data || [], 
        totalCount: count || 0,
        hasMore: (count || 0) > to + 1
      };
      
      // Обновляем кэш, если это первая страница
      if (page === 1) {
        requestCache[type] = {
          data: result.data,
          totalCount: result.totalCount,
          hasMore: result.hasMore,
          timestamp: Date.now()
        };
      }
      
      console.log(`Загружено объявлений типа ${type}: ${data?.length || 0} из ${count || 'неизвестно'}`);
      return result;
    } catch (error) {
      console.error(`Ошибка при получении объявлений типа ${type}:`, error);
      return { data: [], totalCount: 0, hasMore: false };
    } finally {
      activeRequests[type] = false;
    }
  },

  async toggleFavorite(propertyId: string) {
    const { data: session } = await supabase.auth.getSession();
    
    if (!session.session?.user) {
      throw new Error('Пользователь не авторизован');
    }

    // Проверяем, есть ли уже запись избранного
    const { data: existingFavorite, error: findError } = await supabase
      .from('favorites')
      .select()
      .eq('user_id', session.session.user.id)
      .eq('property_id', propertyId)
      .maybeSingle();

    if (findError) throw findError;

    if (existingFavorite) {
      // Если запись уже есть, удаляем её (удаляем из избранного)
      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .eq('id', existingFavorite.id);

      if (deleteError) throw deleteError;
      return false; // Возвращаем false, объект убран из избранного
    } else {
      // Если записи нет, создаём её (добавляем в избранное)
      const { error: insertError } = await supabase
        .from('favorites')
        .insert({
          user_id: session.session.user.id,
          property_id: propertyId
        });

      if (insertError) throw insertError;
      return true; // Возвращаем true, объект добавлен в избранное
    }
  },

  async getFavorites() {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) throw new Error('Пользователь не авторизован');
    
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        property_id,
        property:properties(
          *,
          user:users(name, phone),
          city:cities(name)
        )
      `)
      .eq('user_id', user.user.id);
    
    if (error) {
      console.error('Ошибка при получении избранных объявлений:', error);
      throw error;
    }
    
    return data.map((item: any) => item.property);
  },

  async updateProperty(id: string, propertyData: Partial<PropertyInsert>) {
    try {
      // Получаем текущего пользователя
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Пользователь не авторизован');
      }
      
      // Проверяем, является ли пользователь владельцем объявления
      const { data: propertyCheck, error: checkError } = await supabase
        .from('properties')
        .select('user_id')
        .eq('id', id)
        .single();
      
      if (checkError) throw checkError;
      
      // Если текущий пользователь не владелец объявления
      if (!propertyCheck || propertyCheck.user_id !== user.id) {
        console.error('Отказано в доступе: пользователь не является владельцем объявления');
        return { success: false, error: 'Отказано в доступе: вы не являетесь владельцем этого объявления' };
      }
      
      // Продолжаем обновление, если проверка пройдена
      const { data, error } = await supabase
        .from('properties')
        .update(propertyData)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      // Инвалидируем кэш после успешного обновления
      // Инвалидируем как общие списки, так и кэш детальной информации об объявлении
      invalidateCache(undefined, id);
      
      console.log('Объявление успешно обновлено:', data[0]);
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Ошибка при обновлении объявления:', error);
      return { success: false, error };
    }
  },
  
  async getCities() {
    // Время жизни кэша - 3 часа
    const CITIES_CACHE_TTL = 3 * 60 * 60 * 1000;
    const CITIES_CACHE_KEY = 'domgo_cities_cache';
    const now = Date.now();
    
    // Проверяем кэш
    try {
      const cachedData = await AsyncStorage.getItem(CITIES_CACHE_KEY);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (now - timestamp < CITIES_CACHE_TTL) {
          console.log('Возвращаем кэшированный список городов');
          return data;
        }
      }
      
      // Если кэш отсутствует или устарел, загружаем данные и обновляем кэш
      console.log('Загружаем актуальный список городов');
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Ошибка при получении списка городов:', error);
        throw error;
      }
      
      // Сохраняем в кэш
      await AsyncStorage.setItem(CITIES_CACHE_KEY, JSON.stringify({
        data,
        timestamp: now
      }));
      
      return data;
    } catch (e) {
      console.error('Ошибка при работе с кэшем городов:', e);
      
      // В случае ошибки пытаемся загрузить данные напрямую
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Ошибка при получении списка городов:', error);
        throw error;
      }
      
      return data;
    }
  },
  
  async uploadImage(uri: string, fileName: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      console.log('Загрузка изображения...');
      console.log('Исходный URI:', uri);
      
      // Нормализуем URI для совместимости с iOS и Android
      const normalizedUri = Platform.OS === 'ios' 
        ? uri.replace('file://', '') 
        : uri;
      
      console.log('Нормализованный URI:', normalizedUri);
      
      // Определяем тип файла из расширения
      const fileExt = fileName.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = fileExt === 'jpg' || fileExt === 'jpeg' 
        ? 'image/jpeg' 
        : `image/${fileExt}`;
      
      console.log('Тип файла:', mimeType);
      
      // Сжимаем изображение перед загрузкой
      const compressed = await compressImage(normalizedUri, 0.3);
      console.log('Сжатое изображение URI:', compressed.uri);
      
      const uniqueFileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `property-images/${uniqueFileName}`;
      console.log('Путь:', filePath);
      
      // Читаем файл как base64 вместо использования fetch
      const base64 = await FileSystem.readAsStringAsync(compressed.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('Файл прочитан как base64, размер:', base64.length);
      
      // Конвертируем base64 в ArrayBuffer
      const arrayBuffer = decode(base64);
      console.log('Конвертирован в ArrayBuffer');
      
      // Загружаем в Supabase Storage
      const { error } = await supabase.storage
        .from('properties')
        .upload(filePath, arrayBuffer, {
          contentType: mimeType,
          upsert: true
        });
      
      if (error) {
        console.error('Ошибка загрузки в Supabase:', error);
        throw error;
      }
      
      const { data } = supabase.storage
        .from('properties')
        .getPublicUrl(filePath);
      
      console.log('Успешно загружено, URL:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('Ошибка при загрузке изображения:', error);
      throw error;
    }
  },
  
  async uploadImageBase64(base64Data: string, fileExt: string) {
    try {
      // Проверяем авторизацию
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      // Создаем уникальное имя файла
      const uniqueFileName = `${Math.random().toString(36).substring(2)}.${fileExt.toLowerCase()}`;
      const filePath = `property-images/${uniqueFileName}`;
      
      console.log('Загрузка изображения base64...');
      console.log('Путь:', filePath);
      
      // Проверяем формат base64
      if (!base64Data) {
        throw new Error('Пустые данные base64');
      }
      
      // Преобразуем base64 в Uint8Array для Supabase
      const base64Str = base64Data.includes('base64,') 
        ? base64Data.split('base64,')[1] 
        : base64Data;
        
      if (!base64Str) {
        throw new Error('Некорректный формат base64');
      }
      
      try {
        const decoded = Buffer.from(base64Str, 'base64');
        console.log('Размер декодированных данных:', decoded.length, 'байт');
        
        // Загружаем в Supabase Storage
        const { error } = await supabase.storage
          .from('properties')
          .upload(filePath, decoded, {
            contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
            upsert: true
          });
        
        if (error) {
          console.error('Ошибка загрузки в Supabase:', error);
          throw error;
        }
        
        // Получаем публичный URL
        const { data } = supabase.storage
          .from('properties')
          .getPublicUrl(filePath);
        
        console.log('Успешно загружено, URL:', data.publicUrl);
        return data.publicUrl;
      } catch (decodeError) {
        console.error('Ошибка при декодировании или загрузке base64:', decodeError);
        throw decodeError;
      }
    } catch (error) {
      console.error('Ошибка при загрузке изображения base64:', error);
      throw error;
    }
  },

  async uploadSimple(fileBase64: string, fileName: string) {
    try {
      // Базовая проверка авторизации
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');
      
      // Генерируем имя файла как в веб-версии
      const fileExt = fileName.split('.').pop() || 'jpg';
      const uniqueFileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `property-images/${uniqueFileName}`;
      
      console.log('Загрузка через простой метод...');
      console.log('Путь:', filePath);
      
      // Для base64 нельзя использовать прямое сжатие через react-native-image-manipulator
      // Можно сначала декодировать base64, затем сжать и снова закодировать,
      // но это сложно и может вызвать ошибки
      
      // Загружаем файл напрямую
      const { error } = await supabase.storage
        .from('properties')
        .upload(filePath, fileBase64, {
          contentType: `image/${fileExt}`,
          upsert: true
        });
      
      if (error) {
        console.error('Ошибка загрузки в Supabase:', error);
        throw error;
      }
      
      // Получаем публичный URL
      const { data } = supabase.storage
        .from('properties')
        .getPublicUrl(filePath);
      
      console.log('Успешно загружено, URL:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('Ошибка при загрузке изображения:', error);
      throw error;
    }
  }
};

function decode(base64: string): ArrayBuffer {
  // Используем Buffer для декодирования base64 в React Native
  const buffer = Buffer.from(base64, 'base64');
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
}
