import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { propertyService } from '../services/propertyService';
import { Alert } from 'react-native';
import { debounce } from '../utils/debounce';
import { supabase } from '../lib/supabaseClient';

// Тип для свойства
export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency?: string;
  area?: number;
  rooms?: number;
  bathrooms?: number;
  type: 'sale' | 'rent';
  rentType?: 'rent' | 'sale';
  property_type?: 'apartment' | 'house' | 'commercial' | 'land';
  status?: 'active' | 'sold' | 'rented' | null;
  features?: string[];
  latitude?: string;
  longitude?: string;
  coordinates?: { lat: number; lng: number } | string; // Координаты из Supabase в формате JSON объекта или строки JSON
  address?: string;
  location?: string;
  city_id?: string;
  city?: { name: string };
  user_id: string;
  user?: { 
    name: string | null;
    phone: string | null;
  };
  contact?: {
    name?: string;
    phone?: string;
  };
  images?: string[];
  created_at?: string;
}

// Тип для города
export interface City {
  id: number;
  name: string;
  latitude?: string;
  longitude?: string;
  coordinates?: { lat: number; lng: number } | null;
}

interface PropertyContextType {
  properties: Property[];
  filteredProperties: Property[];
  loading: boolean;
  selectedCity: City | null;
  setSelectedCity: (city: City | null) => void;
  getPropertiesByType: (type: 'sale' | 'rent', page?: number, pageSize?: number) => Promise<{
    data: Property[];
    totalCount: number;
    hasMore: boolean;
  }>;
  setFilteredProperties: (properties: Property[]) => void;
  refreshProperties: () => Promise<void>;
  loadMoreProperties: (type?: 'all' | 'sale' | 'rent') => void; // Изменен тип с Promise<void> на void из-за debounce
  invalidateCache: () => Promise<void>; // Добавлен новый метод для обновления кэша
  hasMoreProperties: boolean;
  totalProperties: number;
  cities: City[];
  loadCities: () => Promise<City[]>;
  citiesLoading: boolean;
  fetchPropertyById: (id: string) => Promise<Property | null>; // Добавлен метод для загрузки объявления по ID
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<{
    all: number;
    sale: number;
    rent: number;
  }>({
    all: 1,
    sale: 1,
    rent: 1
  });
  const [hasMore, setHasMore] = useState<{
    all: boolean;
    sale: boolean;
    rent: boolean;
  }>({
    all: true,
    sale: true,
    rent: true
  });
  const [totalCount, setTotalCount] = useState<{
    all: number;
    sale: number;
    rent: number;
  }>({
    all: 0,
    sale: 0,
    rent: 0
  });
  const pageSize = 10; // Размер страницы для пагинации

  // Загрузка объявлений при первом рендере
  useEffect(() => {
    // Добавляем проверку, чтобы избежать ненужных запросов
    if (properties.length === 0) {
      fetchProperties();
    }
  }, []);

  // Флаг для отслеживания текущих запросов, чтобы избежать параллельных запросов
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const requestInProgress = React.useRef({
    all: false,
    sale: false,
    rent: false
  });

  // Кэш последних запросов для предотвращения дублирования
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const lastFetchTime = React.useRef({
    all: 0,
    sale: 0,
    rent: 0
  });
  
  // Минимальный интервал между запросами (в миллисекундах)
  const MIN_FETCH_INTERVAL = 300000; // 5 минут = 300 секунд = 300000 мс

  const fetchProperties = async () => {
    // Проверяем, идет ли уже запрос или был недавний запрос
    const now = Date.now();
    if (requestInProgress.current.all || 
        (now - lastFetchTime.current.all < MIN_FETCH_INTERVAL && properties.length > 0)) {
      console.log('Запрос уже выполняется или данные были недавно загружены, пропускаем');
      return;
    }
    
    try {
      requestInProgress.current.all = true;
      setLoading(true);
      
      const result = await propertyService.getProperties(1, pageSize);
      setProperties(result.data);
      setFilteredProperties(result.data);
      setHasMore({ ...hasMore, all: result.hasMore });
      setTotalCount({ ...totalCount, all: result.totalCount });
      setCurrentPage({ ...currentPage, all: 1 });
      lastFetchTime.current.all = Date.now();
      
      console.log(`Данные успешно загружены из Supabase: ${result.data.length} из ${result.totalCount}`);
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
    } finally {
      requestInProgress.current.all = false;
      setLoading(false);
    }
  };

  // Обновление списка объявлений (для пользовательского pull-to-refresh)
  // Сохраняем последний активный тип сделки
  const activePropertyTypeRef = React.useRef<'all' | 'sale' | 'rent'>('all');

  // Обновлённая функция refreshProperties с учётом активного типа
  const refreshProperties = async () => {
    // Пропускаем обновление, если уже идет запрос
    if (requestInProgress.current.all) {
      console.log('Обновление пропущено: уже выполняется запрос');
      return;
    }
    
    try {
      requestInProgress.current.all = true;
      setLoading(true);
      
      const result = await propertyService.getProperties(1, pageSize);
      if (result.data && result.data.length > 0) {
        console.log(`Данные успешно загружены из Supabase: ${result.data.length} из ${result.totalCount}`);
        
        // Сохраняем все объявления
        setProperties(result.data);
        
        // Применяем фильтрацию в зависимости от последнего выбранного типа
        const activeType = activePropertyTypeRef.current;
        if (activeType !== 'all') {
          console.log(`Применяем фильтр по типу сделки: ${activeType}`);
          const filtered = result.data.filter(prop => prop.type === activeType);
          setFilteredProperties(filtered);
        } else {
          // Если тип 'all', показываем все объявления
          setFilteredProperties(result.data);
        }
        
        setHasMore({ ...hasMore, all: result.hasMore });
        setTotalCount({ ...totalCount, all: result.totalCount });
        setCurrentPage({ ...currentPage, all: 1 });
        lastFetchTime.current.all = Date.now();
      } else {
        console.log('Нет данных из Supabase');
        setProperties([]);
        setFilteredProperties([]);
        setHasMore({ ...hasMore, all: false });
        setTotalCount({ ...totalCount, all: 0 });
        Alert.alert('Внимание', 'Нет доступных объявлений');
      }
    } catch (error) {
      console.error('Ошибка при загрузке объявлений:', error);
      setProperties([]);
      setFilteredProperties([]);
      setHasMore({ ...hasMore, all: false });
      setTotalCount({ ...totalCount, all: 0 });
      Alert.alert('Ошибка', 'Не удалось подключиться к серверу. Проверьте соединение.');
    } finally {
      requestInProgress.current.all = false;
      setLoading(false);
    }
  };

  // Тип для результатов кэша
  type TypeCacheResult = {
    data: Property[];
    totalCount: number;
    hasMore: boolean;
    timestamp: number;
  };
  
  // Кэш для хранения последних результатов запросов по типу
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const typeCache = React.useRef<Record<'sale' | 'rent', TypeCacheResult>>({
    sale: { data: [], totalCount: 0, hasMore: false, timestamp: 0 },
    rent: { data: [], totalCount: 0, hasMore: false, timestamp: 0 }
  });
  
  // Получение объявлений по типу (продажа/аренда) с кэшированием
  const getPropertiesByType = async (type: 'sale' | 'rent', page = 1, pageSize = 10) => {
    // Сохраняем текущий тип сделки для использования в refreshProperties
    activePropertyTypeRef.current = type;
    // Проверяем существование ключа в typeCache
    if (!typeCache.current[type]) {
      console.log(`Инициализация кэша для типа ${type}`);
      typeCache.current[type] = { data: [], totalCount: 0, hasMore: false, timestamp: 0 };
    }
    
    // Обрабатываем случай, когда запрос уже выполняется
    if (requestInProgress.current[type]) {
      console.log(`Запрос ${type} уже выполняется, возвращаем кэшированные данные`);
      return typeCache.current[type];
    }
    
    // Используем кэш, если запрос был недавно
    const now = Date.now();
    const cachedData = typeCache.current[type];
    
    if (page === 1 && 
        cachedData && 
        cachedData.data && 
        cachedData.data.length > 0 && 
        now - cachedData.timestamp < MIN_FETCH_INTERVAL) {
      console.log(`Возвращаем кэшированные данные для типа ${type}, обновлены ${Math.round((now - cachedData.timestamp)/1000)}с назад`);
      return cachedData;
    }
    
    try {
      requestInProgress.current[type] = true;
      setLoading(true);
      
      const result = await propertyService.getPropertiesByType(type, page, pageSize);
      if (result.data && result.data.length > 0) {
        // Для первой страницы обновляем состояние приложения
        if (page === 1) {
          setCurrentPage({ ...currentPage, [type]: 1 });
          // Проверяем существование ключа в typeCache перед обновлением
          if (!typeCache.current[type]) {
            typeCache.current[type] = { data: [], totalCount: 0, hasMore: false, timestamp: 0 };
          }
          // Обновляем кэш для данного типа
          typeCache.current[type] = {
            data: result.data,
            totalCount: result.totalCount,
            hasMore: result.hasMore,
            timestamp: Date.now()
          };
        } else {
          setCurrentPage({ ...currentPage, [type]: page });
        }
        
        setHasMore({ ...hasMore, [type]: result.hasMore });
        setTotalCount({ ...totalCount, [type]: result.totalCount });
        lastFetchTime.current[type] = Date.now();
        
        return result;
      } else {
        setHasMore({ ...hasMore, [type]: false });
        setTotalCount({ ...totalCount, [type]: 0 });
        return { data: [], totalCount: 0, hasMore: false };
      }
    } catch (error) {
      console.error(`Ошибка при загрузке объявлений типа ${type}:`, error);
      // Показываем Alert только если это первая страница
      if (page === 1) {
        Alert.alert('Ошибка', `Не удалось загрузить объявления типа ${type === 'sale' ? 'продажа' : 'аренда'}`);
      }
      
      // Проверяем существование и наличие данных в кэше
      const cachedData = typeCache.current[type];
      if (!cachedData) {
        typeCache.current[type] = { data: [], totalCount: 0, hasMore: false, timestamp: 0 };
      }
      
      // Возвращаем кэш или пустой результат, если кэша нет
      return (typeCache.current[type] && typeCache.current[type].data && typeCache.current[type].data.length > 0) 
        ? typeCache.current[type] 
        : { data: [], totalCount: 0, hasMore: false, timestamp: 0 };
    } finally {
      requestInProgress.current[type] = false;
      setLoading(false);
    }
  };

  // Загрузка дополнительных объявлений при прокрутке (пагинация)
  const loadMoreProperties = async (type: 'all' | 'sale' | 'rent' = 'all') => {
    // Не загружаем, если идет загрузка, нет больше данных, или уже выполняется запрос
    if (loading || !hasMore[type] || requestInProgress.current[type as 'all' | 'sale' | 'rent']) return;
    
    try {
      requestInProgress.current[type as 'all' | 'sale' | 'rent'] = true;
      setLoading(true);
      console.log(`Загрузка дополнительных объявлений типа ${type}, страница ${currentPage[type] + 1}`);
      
      let result;
      if (type === 'all') {
        result = await propertyService.getProperties(currentPage.all + 1, pageSize);
      } else {
        result = await propertyService.getPropertiesByType(type, currentPage[type] + 1, pageSize);
      }
      
      if (result.data && result.data.length > 0) {
        // Критически важно: используем функциональный апдейт состояния для всех случаев
        if (type === 'all') {
          // Добавляем новые объявления к существующим
          setProperties(prev => [...prev, ...result.data]);
          if (activePropertyTypeRef.current === 'all') {
            setFilteredProperties(prev => [...prev, ...result.data]);
          }
        } else {
          // Для типов 'sale' или 'rent' обновляем основной список properties
          // и фильтрованный список, если этот тип сейчас выбран
          // Обновляем общий список объявлений
          setProperties(prev => {
            // Фильтруем, чтобы избежать дубликатов
            const existingIds = new Set(prev.map(p => p.id));
            const newItems = result.data.filter(item => !existingIds.has(item.id));
            return [...prev, ...newItems];
          });
          
          // Обновляем только если активный тип совпадает с типом загруженных данных
          if (activePropertyTypeRef.current === type) {
            setFilteredProperties(prev => {
              // Фильтруем, чтобы избежать дубликатов
              const existingIds = new Set(prev.map(p => p.id));
              const newItems = result.data.filter(item => !existingIds.has(item.id));
              return [...prev, ...newItems];
            });
          }
        }
        
        // Обновляем состояние пагинации
        setCurrentPage(prev => ({ ...prev, [type]: prev[type] + 1 }));
        setHasMore(prev => ({ ...prev, [type]: result.hasMore }));
        setTotalCount(prev => ({ ...prev, [type]: result.totalCount }));
        
        console.log(`Загружено дополнительно ${result.data.length} объявлений типа ${type}`);
      }
    } catch (error) {
      console.error(`Ошибка при загрузке дополнительных объявлений типа ${type}:`, error);
      Alert.alert('Ошибка', 'Не удалось загрузить дополнительные объявления');
    } finally {
      requestInProgress.current[type as 'all' | 'sale' | 'rent'] = false;
      setLoading(false);
    }
  };

  // Создаем дебаунсированную версию loadMoreProperties
  const debouncedLoadMoreProperties = useCallback(
    debounce(loadMoreProperties, 300), // 300ms задержка
    [currentPage, properties, filteredProperties, hasMore, totalCount]
  );

  // Функция для принудительного обновления кэша после добавления объявления
  const invalidateCache = useCallback(async () => {
    // Очищаем кэш в propertyService
    propertyService.clearCache();
    
    // Сбрасываем текущее состояние
    setCurrentPage({
      all: 1,
      sale: 1,
      rent: 1
    });
    
    // Перезагружаем данные
    await refreshProperties();
    
    console.log('Кэш объявлений обновлен после создания нового объявления');
  }, [refreshProperties]);

  // Загрузка списка городов с кэшированием
  const loadCities = useCallback(async () => {
    if (cities.length > 0) {
      // Если города уже загружены, возвращаем их из кэша
      return cities;
    }
    
    setCitiesLoading(true);
    try {
      const { data: citiesData, error } = await supabase
        .from('cities')
        .select('*');

      if (error) {
        console.error('Error fetching cities:', error);
        setCitiesLoading(false);
        return [];
      }

      if (citiesData) {
        // Добавляем координаты для городов
        const citiesWithCoordinates = citiesData.map(city => ({
          ...city,
          latitude: city.latitude || '45.267136',
          longitude: city.longitude || '19.833549',
          coordinates: city.coordinates || { lat: parseFloat(city.latitude || '45.267136'), lng: parseFloat(city.longitude || '19.833549') }
        }));
        
        setCities(citiesWithCoordinates);
        setCitiesLoading(false);
        return citiesWithCoordinates;
      }
    } catch (error) {
      console.error('Error in loadCities:', error);
      setCitiesLoading(false);
    }
    return [];
  }, [cities]);
  
  // Загрузка объявления по ID для открытия по ссылке
  const fetchPropertyById = useCallback(async (id: string): Promise<Property | null> => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          user:user_id (*),
          city:city_id (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Ошибка при загрузке объявления по ID:', error);
        return null;
      }

      if (!data) {
        return null;
      }
      
      // Преобразуем данные в формат Property
      const formattedProperty = {
        ...data,
        images: data.images || []
      } as Property;

      return formattedProperty;
    } catch (error) {
      console.error('Ошибка при загрузке объявления:', error);
      return null;
    }
  }, []);

  return (
    <PropertyContext.Provider 
      value={{
        properties,
        filteredProperties,
        loading,
        selectedCity,
        setSelectedCity,
        getPropertiesByType,
        setFilteredProperties,
        refreshProperties,
        loadMoreProperties: debouncedLoadMoreProperties,
        invalidateCache,
        hasMoreProperties: hasMore.all,
        totalProperties: totalCount.all,
        cities,
        loadCities,
        citiesLoading,
        fetchPropertyById
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperties() {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error('useProperties должен использоваться внутри PropertyProvider');
  }
  return context;
}
