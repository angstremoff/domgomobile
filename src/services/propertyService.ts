import { supabase } from '../lib/supabaseClient';
import { Platform } from 'react-native';
import type { Database } from '../lib/database.types';
import { compressImage } from '../utils/imageCompression';
import { Buffer } from 'buffer';
import * as FileSystem from 'expo-file-system';

type PropertyInsert = Database['public']['Tables']['properties']['Insert'];

export const propertyService = {
  async getProperties(page = 1, pageSize = 10) {
    try {
      // Вычисляем начальную позицию для пагинации
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      console.log(`Загружаем объявления: страница ${page}, размер страницы ${pageSize}, диапазон ${from}-${to}`);
      
      const { data, error, count } = await supabase
        .from('properties')
        .select(`
          *,
          user:users(name, phone),
          city:cities(name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      
      console.log(`Загружено объявлений: ${data?.length || 0} из ${count || 'неизвестно'}`);
      return { 
        data: data || [], 
        totalCount: count || 0,
        hasMore: (count || 0) > to + 1
      };
    } catch (error) {
      console.error('Ошибка при получении объявлений:', error);
      return { data: [], totalCount: 0, hasMore: false };
    }
  },

  async getPropertyById(id: string) {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        user:users(name, phone),
        city:cities(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    console.log('Данные объявления из базы:', data);
    return data;
  },

  async getUserProperties() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          user:users(name, phone),
          city:cities(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Ошибка при получении объявлений пользователя:', error);
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Пользователь не авторизован');
      
      // Добавляем ID пользователя к данным объявления
      const fullData = {
        ...propertyData,
        user_id: user.id,
      };
      
      const { data, error } = await supabase
        .from('properties')
        .insert(fullData)
        .select();
        
      if (error) throw error;
      
      return data?.[0];
    } catch (error) {
      console.error('Ошибка при создании объявления:', error);
      throw error;
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
    const { error } = await supabase
      .from('properties')
      .update({ status: 'active' })
      .eq('id', id);
      
    if (error) throw error;
    return true;
  },
  
  async deleteProperty(propertyId: string) {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);
      
    if (error) throw error;
  },

  async getPropertiesByType(type: 'sale' | 'rent', page = 1, pageSize = 10) {
    try {
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
      
      console.log(`Загружено объявлений типа ${type}: ${data?.length || 0} из ${count || 'неизвестно'}`);
      return { 
        data: data || [], 
        totalCount: count || 0,
        hasMore: (count || 0) > to + 1
      };
    } catch (error) {
      console.error(`Ошибка при получении объявлений типа ${type}:`, error);
      return { data: [], totalCount: 0, hasMore: false };
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
    const { data, error } = await supabase
      .from('properties')
      .update(propertyData)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Ошибка при обновлении объявления:', error);
      throw error;
    }
    
    return data[0];
  },
  
  async getCities() {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Ошибка при получении списка городов:', error);
      throw error;
    }
    
    return data;
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
