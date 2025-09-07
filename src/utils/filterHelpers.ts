import { Property } from '../contexts/PropertyContext';
import { Logger } from './logger';

/**
 * Универсальная функция применения фильтров к списку объектов недвижимости
 * @param properties - массив объектов недвижимости
 * @param propertyType - тип сделки (продажа/аренда/все)
 * @param propertyCategory - категория недвижимости
 * @param selectedCity - выбранный город
 * @param activeFilters - активные фильтры
 * @returns отфильтрованный массив объектов
 */
export const applyPropertyFilters = (
  properties: Property[],
  propertyType: 'all' | 'sale' | 'rent', 
  propertyCategory: string,
  selectedCity: { id: string | number } | null,
  activeFilters: {
    propertyTypes: string[];
    price: number[];
    rooms: string[];
    areas: string[] | number[];
    features: string[];
  }
): Property[] => {
  if (properties.length === 0) {
    return [];
  }

  // Базовая фильтрация по типу (продажа/аренда)
  let filtered = properties.filter(prop =>
    propertyType === 'all' ? true : (prop && prop.type === propertyType)
  );

  // Фильтрация по категории (квартира/дом/коммерческая/земля)
  if (propertyCategory && propertyCategory !== 'all') {
    filtered = filtered.filter(prop =>
      prop && prop.property_type === propertyCategory
    );
  }

  // Фильтрация по городу - с улучшенной защитой от ошибок
  if (selectedCity && selectedCity?.id !== undefined && selectedCity?.id !== null) {
    // Для избежания многократного преобразования, сохраняем ID города в строку один раз
    let cityIdStr;
    try {
      cityIdStr = selectedCity.id.toString();
    } catch (e) {
      Logger.error('Ошибка при преобразовании ID города:', e);
      return filtered; // Возвращаем список без фильтрации по городу в случае ошибки
    }
    
    filtered = filtered.filter(prop => {
      try {
        // Проверки на null/undefined
        if (!prop || prop.city_id === undefined || prop.city_id === null) {
          return false;
        }

        // Безопасное преобразование в строку
        let propCityIdStr;
        try {
          propCityIdStr = prop.city_id.toString();
        } catch (e) {
          Logger.error('Ошибка при преобразовании city_id объекта:', prop, e);
          return false;
        }

        // Сравниваем строки
        return propCityIdStr === cityIdStr;
      } catch (error) {
        Logger.error('Ошибка при фильтрации по городу:', error);
        return false;
      }
    });
  }
  
  // Применение дополнительных фильтров
  if (propertyType === 'rent' || propertyType === 'sale') {
    // Фильтр по типу недвижимости
    if (activeFilters.propertyTypes.length > 0) {
      filtered = filtered.filter(prop => 
        activeFilters.propertyTypes.includes(prop.property_type || '')
      );
    }
    
    // Фильтр по количеству комнат (учёт варианта "5+")
    if (activeFilters.rooms.length > 0) {
      filtered = filtered.filter(prop => {
        const r = prop.rooms;
        if (r === undefined || r === null) return false;
        const exactMatch = activeFilters.rooms.some(v => /^(\d+)$/.test(v) && Number(v) === r);
        const fivePlus = activeFilters.rooms.includes('5+') && r >= 5;
        return exactMatch || fivePlus;
      });
    }
    
    // Фильтр по площади
    if (activeFilters.areas.length > 0) {
      filtered = filtered.filter(prop => {
        if (prop.area === undefined) return false;
        const area = prop.area;
        
        if (activeFilters.areas.length === 2 && typeof activeFilters.areas[0] === 'number') {
          // Если это массив чисел (из RangeSlider)
          const minArea = Number(activeFilters.areas[0]);
          const maxArea = Number(activeFilters.areas[1]);
          return area >= minArea && (maxArea === 0 || area <= maxArea);
        }
        
        // Если это массив строк с диапазонами
        return activeFilters.areas.some(range => {
          if (!range) return false;
          const [min, max] = range.toString().split('-').map(Number);
          return area >= min && (max === 0 || area <= max);
        });
      });
    }
    
    // Фильтр по особенностям (facilities)
    if (activeFilters.features.length > 0) {
      filtered = filtered.filter(prop => 
        prop.features !== undefined && 
        activeFilters.features.every(feature => prop.features?.includes(feature))
      );
    }
    
    // Фильтр по цене
    if (activeFilters.price.length > 0) {
      const [minPrice, maxPrice] = activeFilters.price;
      filtered = filtered.filter(prop => {
        if (prop.price === undefined) return false;
        return prop.price >= minPrice && (maxPrice === 0 || prop.price <= maxPrice);
      });
    }
  }
  
  return filtered;
};
