import { Property } from '../contexts/PropertyContext';

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

  let filtered = [...properties];
  
  // Фильтрация по типу сделки (продажа/аренда)
  if (propertyType === 'sale') {
    filtered = filtered.filter(prop => prop.type === 'sale');
  } else if (propertyType === 'rent') {
    filtered = filtered.filter(prop => prop.type === 'rent');
  }
  
  // Фильтрация по категории недвижимости
  if (propertyCategory !== 'all') {
    filtered = filtered.filter(prop => 
      prop.property_type === propertyCategory
    );
  }
  
  // Фильтрация по городу
  if (selectedCity && selectedCity.id) {
    filtered = filtered.filter(prop => {
      try {
        // Безопасная проверка city_id
        if (prop.city_id === undefined || prop.city_id === null) {
          return false;
        }
        // Безопасное преобразование в строку
        return String(prop.city_id) === String(selectedCity.id);
      } catch (error) {
        console.error('Ошибка при фильтрации по городу:', error);
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
    
    // Фильтр по количеству комнат
    if (activeFilters.rooms.length > 0) {
      filtered = filtered.filter(prop => 
        prop.rooms !== undefined && activeFilters.rooms.includes(prop.rooms.toString())
      );
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
