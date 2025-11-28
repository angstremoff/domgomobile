// Типы API данных для приложения DomGo

// Координаты для карты
export interface Coordinates {
  lat: number;
  lng: number;
}

// Базовый объект недвижимости
export interface Property {
  id: string;
  title: string;
  type: 'sale' | 'rent';
  price: number;
  description?: string;
  rooms?: number;
  bathrooms?: number;
  area?: number;
  latitude?: string;
  longitude?: string;
  coordinates?: Coordinates | string;
  city_id?: string | number;
  district_id?: string | number | null;
  district?: {
    id: string | number;
    name: string;
    city_id?: string | number;
  } | null;
  address?: string;
  images?: string[];
  features?: string[];
  category?: 'apartment' | 'house' | 'commercial' | 'land';
  currency?: string;
  created_at?: string;
  updated_at?: string;
}

// Город
export interface City {
  id: string | number;
  name: string;
  name_en?: string;
  latitude?: string | number;
  longitude?: string | number;
  region_id?: string | number;
}

// Фильтры для поиска недвижимости
export interface PropertyFilters {
  type?: 'sale' | 'rent' | 'all';
  category?: 'apartment' | 'house' | 'commercial' | 'land' | 'all';
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  maxRooms?: number;
  minArea?: number;
  maxArea?: number;
  city_id?: string | number;
  features?: string[];
}

// Ответ API для списка объектов
export interface PropertiesResponse {
  data: Property[];
  meta?: {
    total: number;
    page: number;
    last_page: number;
  };
  success: boolean;
  message?: string;
}

// Ответ API для деталей объекта
export interface PropertyDetailsResponse {
  data: Property;
  success: boolean;
  message?: string;
}

// Ответ API для списка городов
export interface CitiesResponse {
  data: City[];
  success: boolean;
  message?: string;
}

// Данные пользователя
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role?: string;
  created_at?: string;
}

// Ответ API для данных пользователя
export interface UserResponse {
  data: User;
  success: boolean;
  message?: string;
  token?: string;
}

// Настройки приложения
export interface AppSettings {
  language: string;
  darkMode: boolean;
  notifications: boolean;
  currency: string;
}

// Список обновлений
export interface AppUpdate {
  version: string;
  runtimeVersion?: string;
  description?: string;
  mandatory?: boolean;
  releaseDate?: string;
}

// Ответ API на проверку обновлений
export interface UpdateCheckResponse {
  isAvailable: boolean;
  update?: AppUpdate;
  message?: string;
}
