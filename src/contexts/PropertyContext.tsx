import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { propertyService } from '../services/propertyService';
import { Alert } from 'react-native';

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
  loadMoreProperties: (type?: 'all' | 'sale' | 'rent') => Promise<void>;
  hasMoreProperties: boolean;
  totalProperties: number;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
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
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const result = await propertyService.getProperties(1, pageSize);
      setProperties(result.data);
      setFilteredProperties(result.data);
      setHasMore({ ...hasMore, all: result.hasMore });
      setTotalCount({ ...totalCount, all: result.totalCount });
      setCurrentPage({ ...currentPage, all: 1 });
      console.log(`Данные успешно загружены из Supabase: ${result.data.length} из ${result.totalCount}`);
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
    } finally {
      setLoading(false);
    }
  };

  // Обновление списка объявлений
  const refreshProperties = async () => {
    try {
      setLoading(true);
      const result = await propertyService.getProperties(1, pageSize);
      if (result.data && result.data.length > 0) {
        console.log(`Данные успешно загружены из Supabase: ${result.data.length} из ${result.totalCount}`);
        setProperties(result.data);
        setFilteredProperties(result.data);
        setHasMore({ ...hasMore, all: result.hasMore });
        setTotalCount({ ...totalCount, all: result.totalCount });
        setCurrentPage({ ...currentPage, all: 1 });
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
      setLoading(false);
    }
  };

  // Получение объявлений по типу (продажа/аренда)
  const getPropertiesByType = async (type: 'sale' | 'rent', page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const result = await propertyService.getPropertiesByType(type, page, pageSize);
      if (result.data && result.data.length > 0) {
        // Обновляем состояние для соответствующего типа
        if (page === 1) {
          setCurrentPage({ ...currentPage, [type]: 1 });
        } else {
          setCurrentPage({ ...currentPage, [type]: page });
        }
        setHasMore({ ...hasMore, [type]: result.hasMore });
        setTotalCount({ ...totalCount, [type]: result.totalCount });
        return result;
      } else {
        setHasMore({ ...hasMore, [type]: false });
        setTotalCount({ ...totalCount, [type]: 0 });
        return { data: [], totalCount: 0, hasMore: false };
      }
    } catch (error) {
      console.error(`Ошибка при загрузке объявлений типа ${type}:`, error);
      Alert.alert('Ошибка', `Не удалось загрузить объявления типа ${type === 'sale' ? 'продажа' : 'аренда'}`);
      return { data: [], totalCount: 0, hasMore: false };
    } finally {
      setLoading(false);
    }
  };

  // Загрузка дополнительных объявлений при прокрутке
  const loadMoreProperties = async (type: 'all' | 'sale' | 'rent' = 'all') => {
    if (loading || !hasMore[type]) return;
    
    try {
      setLoading(true);
      console.log(`Загрузка дополнительных объявлений типа ${type}, страница ${currentPage[type] + 1}`);
      
      let result;
      if (type === 'all') {
        result = await propertyService.getProperties(currentPage.all + 1, pageSize);
      } else {
        result = await propertyService.getPropertiesByType(type, currentPage[type] + 1, pageSize);
      }
      
      if (result.data && result.data.length > 0) {
        if (type === 'all') {
          // Добавляем новые объявления к существующим
          setProperties([...properties, ...result.data]);
          setFilteredProperties([...filteredProperties, ...result.data]);
        }
        
        // Обновляем состояние пагинации
        setCurrentPage({ ...currentPage, [type]: currentPage[type] + 1 });
        setHasMore({ ...hasMore, [type]: result.hasMore });
        setTotalCount({ ...totalCount, [type]: result.totalCount });
        
        console.log(`Загружено дополнительно ${result.data.length} объявлений типа ${type}`);
      }
    } catch (error) {
      console.error(`Ошибка при загрузке дополнительных объявлений типа ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

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
        loadMoreProperties,
        hasMoreProperties: hasMore.all,
        totalProperties: totalCount.all
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
