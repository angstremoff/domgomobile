import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import PropertyCard from '../components/PropertyCard';
import PropertyCardCompact from '../components/PropertyCardCompact';
import type { Property } from '../contexts/PropertyContext';
import FilterModal from '../components/FilterModal';
import PropertyMapView from '../components/PropertyMapView';
import { useFavorites } from '../contexts/FavoritesContext';
import { useProperties } from '../contexts/PropertyContext';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/colors';
import { applyPropertyFilters } from '../utils/filterHelpers';

const HomeScreen = ({ navigation }: any) => {
  // Вернулись к использованию стандартного компонента PropertyCard
  const { t } = useTranslation();
  const { favorites, isLoading: favoritesLoading } = useFavorites();
  const { 
    properties, 
    filteredProperties, 
    setFilteredProperties, 
    refreshProperties, 
    loading: propertiesLoading, 
    selectedCity,
    loadMoreProperties,
    hasMoreProperties,
    getPropertiesByType
  } = useProperties();
  const [propertyType, setPropertyType] = useState<'all' | 'sale' | 'rent'>('all');
  const [propertyCategory, setPropertyCategory] = useState<string>('all');
  const { darkMode } = useTheme();
  const theme = darkMode ? Colors.dark : Colors.light;
  const [loadingMore, setLoadingMore] = useState(false);
  const [compactView, setCompactView] = useState(false); // Состояние для переключения режима отображения
  const [filtersAppliedSale, setFiltersAppliedSale] = useState(false); // Флаг для отслеживания применения фильтров продажи
  const [filtersAppliedRent, setFiltersAppliedRent] = useState(false); // Флаг для отслеживания применения фильтров аренды

  // Состояние для фильтров аренды
  const [rentFilters, setRentFilters] = useState<{
    propertyTypes: string[];
    price: number[];
    rooms: string[];
    areas: string[];
    features: string[];
  }>({
    propertyTypes: [],
    price: [0, 3000],
    rooms: [],
    areas: [],
    features: []
  });

  // Состояние для фильтров продажи
  const [saleFilters, setSaleFilters] = useState<{
    propertyTypes: string[];
    price: number[];
    rooms: string[];
    areas: string[];
    features: string[];
  }>({
    propertyTypes: [],
    price: [0, 500000],
    rooms: [],
    areas: [],
    features: []
  });

  // Активные фильтры в зависимости от выбранной вкладки
  const [activeFilters, setActiveFilters] = useState<{
    propertyTypes: string[];
    price: number[];
    rooms: string[];
    areas: string[];
    features: string[];
  }>({
    propertyTypes: [],
    price: [0, 3000],
    rooms: [],
    areas: [],
    features: []
  });

  // Состояние для модального окна фильтров
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [tempFilters, setTempFilters] = useState<{
    propertyTypes: string[];
    price: number[];
    rooms: string[];
    areas: string[];
    features: string[];
  }>({
    propertyTypes: [],
    price: [0, 3000],
    rooms: [],
    areas: [],
    features: []
  });

  // Обновляем свойства только при существенных изменениях в избранном
  // Добавляем useRef для предотвращения повторных запросов
  const previousFavoritesLength = React.useRef(0);
  
  useEffect(() => {
    // Обновляем только если количество избранных изменилось
    if (!favoritesLoading && favorites && previousFavoritesLength.current !== favorites.length) {
      console.log(`Количество избранных изменилось: ${previousFavoritesLength.current} -> ${favorites.length}`);
      previousFavoritesLength.current = favorites.length;
      refreshProperties();
    }
  }, [favorites, favoritesLoading, refreshProperties]);

  // Мемоизированная функция для фильтрации объектов недвижимости
  // использует вынесенную логику из filterHelpers.ts
  const applyFilters = useCallback(() => {
    if (properties.length > 0) {
      const filtered = applyPropertyFilters(
        properties,
        propertyType,
        propertyCategory,
        selectedCity,
        activeFilters
      );
      
      setFilteredProperties(filtered);
    }
  }, [propertyType, propertyCategory, selectedCity, properties, activeFilters]);
  
  // Используем debounce для applyFilters, чтобы не вызывать фильтрацию слишком часто
  const debounceTimeout = React.useRef<NodeJS.Timeout | null>(null);
  
  // Применяем фильтры при изменении зависимостей с debounce
  useEffect(() => {
    // Очищаем предыдущий таймер, если он был установлен
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Устанавливаем новый таймер для фильтрации с задержкой
    debounceTimeout.current = setTimeout(() => {
      applyFilters();
    }, 300); // 300ms задержка перед применением фильтров
    
    // Очистка таймера при размонтировании компонента
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [applyFilters]);

  useEffect(() => {
    if (propertyType === 'rent') {
      setActiveFilters(rentFilters);
      setTempFilters(rentFilters);
      setFiltersAppliedRent(true);
    } else if (propertyType === 'sale') {
      setActiveFilters(saleFilters);
      setTempFilters(saleFilters);
      setFiltersAppliedSale(true);
    } else {
      // Для вкладки "Все" используем пустые фильтры
      setActiveFilters({
        propertyTypes: [],
        price: [0, 3000],
        rooms: [],
        areas: [],
        features: []
      });
      setTempFilters({
        propertyTypes: [],
        price: [0, 3000],
        rooms: [],
        areas: [],
        features: []
      });
      setFiltersAppliedSale(false);
      setFiltersAppliedRent(false);
    }
  }, [propertyType, rentFilters, saleFilters]);

  // Предотвращаем множественные запросы в handleCombinedFilter
  // Используем useRef для отслеживания последнего запроса
  const lastFilterRequest = React.useRef({ type: '', category: '', timestamp: 0 });
  const FILTER_THROTTLE_MS = 300; // 300ms задержка между запросами

  const handleCombinedFilter = async (type: 'sale' | 'rent', category: string) => {
    const now = Date.now();
    
    // Пропускаем частые запросы с одинаковыми параметрами
    if (lastFilterRequest.current.type === type && 
        lastFilterRequest.current.category === category &&
        now - lastFilterRequest.current.timestamp < FILTER_THROTTLE_MS) {
      console.log(`Пропускаем дублирующий запрос фильтра: ${type} - ${category}`);
      return;
    }
    
    // Обновляем данные о последнем запросе
    lastFilterRequest.current = { type, category, timestamp: now };
    
    setPropertyType(type);
    setPropertyCategory(category);
    
    // Синхронизация с обычными фильтрами
    if (category !== 'all') {
      if (type === 'sale') {
        const updatedFilters = {
          ...saleFilters,
          propertyTypes: [category]
        };
        setSaleFilters(updatedFilters);
        setActiveFilters(updatedFilters);
      } else if (type === 'rent') {
        const updatedFilters = {
          ...rentFilters,
          propertyTypes: [category]
        };
        setRentFilters(updatedFilters);
        setActiveFilters(updatedFilters);
      }
    }
    
    setLoadingMore(true);
    
    try {
      // Загружаем объявления выбранного типа (первая страница)
      const { data } = await getPropertiesByType(type, 1, 10);
      
      // Проверяем, не устарел ли наш запрос (другой мог стартовать пока этот выполнялся)
      if (lastFilterRequest.current.type !== type || 
          lastFilterRequest.current.category !== category) {
        console.log('Запрос устарел, пропускаем обработку результатов');
        return;
      }
      
      let filtered = [...data];
      
      // Фильтрация по категории
      if (category !== 'all') {
        filtered = filtered.filter(prop => 
          prop.property_type === category
        );
      }
      
      // Фильтрация по городу - с максимальной защитой от ошибок
      if (selectedCity && selectedCity?.id) {
        // Заранее преобразуем id города в строку один раз
        const cityIdStr = String(selectedCity.id);
        
        filtered = filtered.filter(prop => {
          // Проверяем все возможные случаи null/undefined
          if (!prop || prop.city_id === undefined || prop.city_id === null) {
            return false;
          }
          
          try {
            // Преобразуем id свойства в строку
            const propCityIdStr = String(prop.city_id);
            return propCityIdStr === cityIdStr;
          } catch (error) {
            console.error('Ошибка при фильтрации по городу:', error);
            return false;
          }
        });
      }
      
      // Применение активных фильтров только если они были явно применены
      if (activeFilters && Object.keys(activeFilters).length > 0) {
        filtered = applyActiveFilters(filtered, type);
      } else if (type === 'sale' || type === 'rent') {
        // Если фильтры не были применены, просто фильтруем по типу
        filtered = filtered.filter(prop => prop.type === type);
      }
      
      setFilteredProperties(filtered);
    } catch (error) {
      console.error('Ошибка при фильтрации:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const applyActiveFilters = (properties: any[], type: 'all' | 'sale' | 'rent') => {
    // Получаем активные фильтры в зависимости от типа
    const filters = type === 'rent' ? rentFilters : 
                   type === 'sale' ? saleFilters : 
                   activeFilters;
    
    // Проверяем, были ли применены фильтры для данного типа
    const filtersApplied = type === 'rent' ? filtersAppliedRent : 
                           type === 'sale' ? filtersAppliedSale : 
                           false;
    
    // Если фильтры не были явно применены, возвращаем только фильтрацию по типу
    if (!filtersApplied && type !== 'all') {
      return properties.filter(prop => prop.type === type);
    }
    
    // Оптимизированная фильтрация с одним проходом по всем свойствам
    return properties.filter(prop => {
      // Фильтрация по типу, если не all
      if (type !== 'all' && prop.type !== type) {
        return false;
      }
      
      // Фильтрация по типу недвижимости
      if (filters.propertyTypes.length > 0 && 
          !filters.propertyTypes.includes(prop.property_type || '')) {
        return false;
      }
      
      // Фильтрация по цене
      const price = prop.price || 0;
      if (price < filters.price[0] || price > filters.price[1]) {
        return false;
      }
      
      // Фильтрация по количеству комнат
      if (filters.rooms.length > 0) {
        if (!prop.rooms) return false;
        const roomsStr = String(prop.rooms);
        if (!filters.rooms.includes(roomsStr)) {
          return false;
        }
      }
      
      // Фильтрация по площади
      if (filters.areas.length > 0) {
        if (!prop.area) return false;
        
        // Проверяем, попадает ли площадь в один из выбранных диапазонов
        let matchesAreaFilter = false;
        for (const areaRange of filters.areas) {
          const [min, max] = areaRange.split('-').map(Number);
          if (prop.area >= min && prop.area <= max) {
            matchesAreaFilter = true;
            break;
          }
        }
        
        if (!matchesAreaFilter) {
          return false;
        }
      }
      
      // Фильтрация по особенностям
      if (filters.features.length > 0) {
        if (!prop.features || prop.features.length === 0) return false;
        
        // Проверяем, содержит ли объявление все выбранные особенности
        for (const feature of filters.features) {
          if (!prop.features.includes(feature)) {
            return false;
          }
        }
      }
      
      // Объект прошел все фильтры
      return true;
    });
  };

  const handleClearFilters = () => {
    // Сбрасываем все фильтры
    if (propertyType === 'sale') {
      setSaleFilters({
        propertyTypes: [],
        price: [0, 500000],
        rooms: [],
        areas: [],
        features: []
      });
      setActiveFilters({
        propertyTypes: [],
        price: [0, 500000],
        rooms: [],
        areas: [],
        features: []
      });
      setFiltersAppliedSale(false);
    } else if (propertyType === 'rent') {
      setRentFilters({
        propertyTypes: [],
        price: [0, 3000],
        rooms: [],
        areas: [],
        features: []
      });
      setActiveFilters({
        propertyTypes: [],
        price: [0, 3000],
        rooms: [],
        areas: [],
        features: []
      });
      setFiltersAppliedRent(false);
    }
    
    // Сбрасываем категорию недвижимости
    setPropertyCategory('all');
    
    // Применяем фильтрацию заново
    if (properties.length > 0) {
      let filtered = [...properties];
      
      if (propertyType === 'sale') {
        filtered = filtered.filter(prop => prop.type === 'sale');
      } else if (propertyType === 'rent') {
        filtered = filtered.filter(prop => prop.type === 'rent');
      }
      
      if (selectedCity && selectedCity?.id) {
        // Заранее преобразуем id города в строку один раз
        const cityIdStr = String(selectedCity.id);
        
        filtered = filtered.filter(prop => {
          // Проверяем все возможные случаи null/undefined
          if (!prop || prop.city_id === undefined || prop.city_id === null) {
            return false;
          }
          
          try {
            // Преобразуем id свойства в строку
            const propCityIdStr = String(prop.city_id);
            return propCityIdStr === cityIdStr;
          } catch (error) {
            console.error('Ошибка при фильтрации по городу:', error);
            return false;
          }
        });
      }
      
      setFilteredProperties(filtered);
    }
  };

  const handleTempFiltersChange = (newFilters: {
    propertyTypes: string[];
    price: number[];
    rooms: string[];
    areas: string[];
    features: string[];
  }) => {
    setTempFilters(newFilters);
  };

  const handleOpenFilterModal = () => {
    // Загружаем текущие фильтры в зависимости от выбранной вкладки
    if (propertyType === 'rent') {
      setTempFilters({...rentFilters});
    } else if (propertyType === 'sale') {
      setTempFilters({...saleFilters});
    } else {
      setTempFilters({
        propertyTypes: [],
        price: [0, 3000],
        rooms: [],
        areas: [],
        features: []
      });
    }
    setFilterModalVisible(true);
  };
  
  const handleCloseFilterModal = () => {
    setFilterModalVisible(false);
  };
  
  const handleApplyFilters = () => {
    // Закрываем модальное окно
    setFilterModalVisible(false);
    
    // Обновляем активные фильтры в зависимости от выбранной вкладки
    if (propertyType === 'sale') {
      setSaleFilters(tempFilters);
      setActiveFilters(tempFilters);
      setFiltersAppliedSale(true);
      
      // Синхронизация с быстрыми фильтрами
      if (tempFilters.propertyTypes.length === 1) {
        setPropertyCategory(tempFilters.propertyTypes[0]);
      } else {
        setPropertyCategory('all');
      }
    } else if (propertyType === 'rent') {
      setRentFilters(tempFilters);
      setActiveFilters(tempFilters);
      setFiltersAppliedRent(true);
      
      // Синхронизация с быстрыми фильтрами
      if (tempFilters.propertyTypes.length === 1) {
        setPropertyCategory(tempFilters.propertyTypes[0]);
      } else {
        setPropertyCategory('all');
      }
    }
    
    // Применяем фильтрацию
    if (properties.length > 0) {
      const filtered = applyActiveFilters(properties, propertyType);
      setFilteredProperties(filtered);
    }
  };

  const areFiltersApplied = () => {
    // Проверяем, выбрана ли категория (отличная от 'all')
    if (propertyCategory !== 'all') {
      return true;
    }
    
    if (propertyType === 'rent') {
      // Проверяем, отличаются ли текущие фильтры от значений по умолчанию
      return (
        rentFilters.propertyTypes.length > 0 ||
        rentFilters.rooms.length > 0 ||
        rentFilters.areas.length > 0 ||
        rentFilters.features.length > 0 ||
        rentFilters.price[0] !== 0 ||
        rentFilters.price[1] !== 3000
      );
    } else if (propertyType === 'sale') {
      // Проверяем, отличаются ли текущие фильтры от значений по умолчанию
      return (
        saleFilters.propertyTypes.length > 0 ||
        saleFilters.rooms.length > 0 ||
        saleFilters.areas.length > 0 ||
        saleFilters.features.length > 0 ||
        saleFilters.price[0] !== 0 ||
        saleFilters.price[1] !== 500000
      );
    }
    return false;
  };

  const loading = propertiesLoading || favoritesLoading;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton, 
            { backgroundColor: theme.card, borderColor: theme.border },
            propertyType === 'all' && [styles.activeFilter, { backgroundColor: theme.primary }]
          ]}
          onPress={async () => {
            setPropertyType('all');
            setPropertyCategory('all');
            // Сбрасываем активные фильтры при переключении на вкладку "Все"
            setActiveFilters({
              propertyTypes: [],
              price: [0, 3000],
              rooms: [],
              areas: [],
              features: []
            });
            setFiltersAppliedSale(false);
            setFiltersAppliedRent(false);
            
            // Загружаем все объявления
            await refreshProperties();
            // Показываем все объявления
            setFilteredProperties(properties);
          }}
        >
          <Text style={[
            styles.filterText, 
            { color: theme.text },
            propertyType === 'all' && [styles.activeFilterText, { color: theme.headerText }]
          ]}>
            {t('common.all')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton, 
            { backgroundColor: theme.card, borderColor: theme.border },
            propertyType === 'sale' && [styles.activeFilter, { backgroundColor: theme.primary }]
          ]}
          onPress={async () => {
            setPropertyType('sale');
            setPropertyCategory('all');
            // Загружаем фильтры для вкладки "Продажа"
            setActiveFilters(saleFilters);
            setFiltersAppliedSale(true);
            
            // Получаем свойства по типу "sale" - это обновит activePropertyTypeRef
            try {
              const result = await getPropertiesByType('sale');
              if (result && result.data) {
                setFilteredProperties(result.data);
              }
            } catch (error) {
              console.error('Ошибка при загрузке объявлений для продажи:', error);
            }
          }}
        >
          <Text style={[
            styles.filterText, 
            { color: theme.text },
            propertyType === 'sale' && [styles.activeFilterText, { color: theme.headerText }]
          ]}>
            {t('common.sale')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton, 
            { backgroundColor: theme.card, borderColor: theme.border },
            propertyType === 'rent' && [styles.activeFilter, { backgroundColor: theme.primary }]
          ]}
          onPress={async () => {
            setPropertyType('rent');
            setPropertyCategory('all');
            // Загружаем фильтры для вкладки "Аренда"
            setActiveFilters(rentFilters);
            setFiltersAppliedRent(true);
            
            // Получаем свойства по типу "rent" - это обновит activePropertyTypeRef
            try {
              const result = await getPropertiesByType('rent');
              if (result && result.data) {
                setFilteredProperties(result.data);
              }
            } catch (error) {
              console.error('Ошибка при загрузке объявлений для аренды:', error);
            }
          }}
        >
          <Text style={[
            styles.filterText, 
            { color: theme.text },
            propertyType === 'rent' && [styles.activeFilterText, { color: theme.headerText }]
          ]}>
            {t('common.rent')}
          </Text>
        </TouchableOpacity>

        {propertyType !== 'all' && (
          <TouchableOpacity
            style={[
              styles.clearFilterButton, 
              { backgroundColor: theme.card, borderColor: theme.border },
              !areFiltersApplied() && styles.disabledButton
            ]}
            onPress={handleClearFilters}
            disabled={!areFiltersApplied()}
          >
            <View style={styles.clearFilterIconContainer}>
              <FontAwesome5 name="filter" size={16} color={areFiltersApplied() ? theme.primary : theme.secondary} />
              <Ionicons name="close" size={14} color={areFiltersApplied() ? theme.primary : theme.secondary} style={styles.closeIcon} />
            </View>
          </TouchableOpacity>
        )}
        
        {/* Кнопка переключения режима отображения */}
        <TouchableOpacity
          style={[styles.viewModeButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => setCompactView(!compactView)}
        >
          <Ionicons 
            name={compactView ? "grid-outline" : "list-outline"} 
            size={20} 
            color={theme.primary} 
          />
        </TouchableOpacity>
      </View>
      
      {propertyType !== 'all' && (
        <View style={[styles.categorySection, { backgroundColor: theme.background }]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={[styles.categoryFilterContainer, { zIndex: 10 }]}
            contentContainerStyle={styles.categoryFilterContent}
          >
            {(propertyType === 'rent') && (
              <TouchableOpacity
                style={[
                  styles.propertyTypeCard, 
                  { backgroundColor: theme.card, borderColor: theme.border },
                  (propertyType === 'rent' && propertyCategory === 'apartment') && styles.activeCard
                ]}
                onPress={() => handleCombinedFilter('rent', 'apartment')}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="business-outline" size={18} color={theme.primary} />
                </View>
                <Text style={[styles.propertyTypeText, { color: theme.text }]}>
                  {t('property.rentApartment')}
                </Text>
              </TouchableOpacity>
            )}

            {(propertyType === 'rent') && (
              <TouchableOpacity
                style={[
                  styles.propertyTypeCard, 
                  { backgroundColor: theme.card, borderColor: theme.border },
                  (propertyType === 'rent' && propertyCategory === 'house') && styles.activeCard
                ]}
                onPress={() => handleCombinedFilter('rent', 'house')}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="home-outline" size={18} color={theme.primary} />
                </View>
                <Text style={[styles.propertyTypeText, { color: theme.text }]}>
                  {t('property.rentHouse')}
                </Text>
              </TouchableOpacity>
            )}

            {(propertyType === 'rent') && (
              <TouchableOpacity
                style={[
                  styles.propertyTypeCard, 
                  { backgroundColor: theme.card, borderColor: theme.border },
                  (propertyType === 'rent' && propertyCategory === 'commercial') && styles.activeCard
                ]}
                onPress={() => handleCombinedFilter('rent', 'commercial')}
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons name="storefront" size={18} color={theme.primary} />
                </View>
                <Text style={[styles.propertyTypeText, { color: theme.text }]}>
                  {t('property.rentCommercial')}
                </Text>
              </TouchableOpacity>
            )}

            {(propertyType === 'sale') && (
              <TouchableOpacity
                style={[
                  styles.propertyTypeCard, 
                  { backgroundColor: theme.card, borderColor: theme.border },
                  (propertyType === 'sale' && propertyCategory === 'apartment') && styles.activeCard
                ]}
                onPress={() => handleCombinedFilter('sale', 'apartment')}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="business-outline" size={18} color={theme.primary} />
                </View>
                <Text style={[styles.propertyTypeText, { color: theme.text }]}>
                  {t('property.saleApartment')}
                </Text>
              </TouchableOpacity>
            )}

            {(propertyType === 'sale') && (
              <TouchableOpacity
                style={[
                  styles.propertyTypeCard, 
                  { backgroundColor: theme.card, borderColor: theme.border },
                  (propertyType === 'sale' && propertyCategory === 'house') && styles.activeCard
                ]}
                onPress={() => handleCombinedFilter('sale', 'house')}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="home-outline" size={18} color={theme.primary} />
                </View>
                <Text style={[styles.propertyTypeText, { color: theme.text }]}>
                  {t('property.saleHouse')}
                </Text>
              </TouchableOpacity>
            )}

            {(propertyType === 'sale') && (
              <TouchableOpacity
                style={[
                  styles.propertyTypeCard, 
                  { backgroundColor: theme.card, borderColor: theme.border },
                  (propertyType === 'sale' && propertyCategory === 'commercial') && styles.activeCard
                ]}
                onPress={() => handleCombinedFilter('sale', 'commercial')}
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons name="storefront" size={18} color={theme.primary} />
                </View>
                <Text style={[styles.propertyTypeText, { color: theme.text }]}>
                  {t('property.saleCommercial')}
                </Text>
              </TouchableOpacity>
            )}

            {(propertyType === 'sale') && (
              <TouchableOpacity
                style={[
                  styles.propertyTypeCard, 
                  { backgroundColor: theme.card, borderColor: theme.border },
                  (propertyType === 'sale' && propertyCategory === 'land') && styles.activeCard
                ]}
                onPress={() => handleCombinedFilter('sale', 'land')}
              >
                <View style={styles.iconContainer}>
                  <FontAwesome5 name="mountain" size={16} color={theme.primary} />
                </View>
                <Text style={[styles.propertyTypeText, { color: theme.text }]}>
                  {t('filters.land')}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}
      
      {propertyType !== 'all' && (
        <TouchableOpacity 
          style={[styles.filterButtonStandalone, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={handleOpenFilterModal}
        >
          <View style={styles.filterButtonContent}>
            <Ionicons name="options-outline" size={18} color={theme.primary} style={styles.filterIcon} />
            <Text style={[styles.filterButtonText, { color: theme.text }]}>{t('filters.title')}</Text>
          </View>
        </TouchableOpacity>
      )}
      
      {/* Модальное окно фильтров */}
      <FilterModal
        visible={filterModalVisible}
        propertyType={propertyType === 'all' ? 'sale' : propertyType}
        filters={tempFilters}
        onFiltersChange={handleTempFiltersChange}
        onClose={handleCloseFilterModal}
        onApply={handleApplyFilters}
        darkMode={darkMode}
      />
      
      
      <PropertyMapView 
        properties={filteredProperties}
        selectedCity={selectedCity}
        onPropertySelect={(property) => navigation.navigate('PropertyDetails', { propertyId: property.id })}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : filteredProperties.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.text }]}>{t('property.noPropertiesFound')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProperties}
          keyExtractor={(item) => item.id}
          initialNumToRender={8}
          maxToRenderPerBatch={5}
          windowSize={11}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={100}
          renderItem={({ item }: { item: Property }) => (
            compactView ? (
              <PropertyCardCompact
                property={item}
                onPress={() => navigation.navigate('PropertyDetails', { propertyId: item.id })}
                darkMode={darkMode}
              />
            ) : (
              <PropertyCard 
                property={item}
                onPress={() => navigation.navigate('PropertyDetails', { propertyId: item.id })}
                darkMode={darkMode}
              />
            )
          )} // Мемоизируем функцию для повышения производительности 
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: 8 } // Одинаковый небольшой отступ для всех вкладок
          ]}
          showsVerticalScrollIndicator={false}
          numColumns={compactView ? 2 : 1} // Используем 2 колонки в компактном режиме
          key={compactView ? 'compact' : 'full'} // Ключ для пересоздания списка при смене режима
          onRefresh={async () => {
            // Если выбран определенный тип сделки, загружаем объявления именно этого типа
            if (propertyType === 'sale' || propertyType === 'rent') {
              try {
                const result = await getPropertiesByType(propertyType);
                if (result && result.data) {
                  // Не нужно вызывать setFilteredProperties, так как это сделает getPropertiesByType
                }
              } catch (error) {
                console.error(`Ошибка при обновлении объявлений типа ${propertyType}:`, error);
              }
            } else {
              // Если выбраны все объявления, используем стандартное обновление
              await refreshProperties();
            }
          }}
          refreshing={loading}
          onEndReached={() => {
            if (!loadingMore && hasMoreProperties) {
              setLoadingMore(true);
              // Загрузка дополнительных объектов недвижимости
              loadMoreProperties(propertyType);
              // Сбросим состояние загрузки через небольшую задержку
              setTimeout(() => {
                setLoadingMore(false);
              }, 1000); 
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.text }]}>
                  {t('common.loadingMore')}
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingTop: 10
  },
  categoryFilterContainer: {
    marginBottom: 4,
    zIndex: 10,
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  propertyTypeCard: {
    width: 79,
    height: 72,
    borderRadius: 12,
    marginRight: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  activeCard: {
    borderColor: '#1E40AF',
    borderWidth: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  propertyTypeText: {
    fontSize: 8,
    fontWeight: '500',
    textAlign: 'center',
    color: '#4B5563',
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 4,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 50,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilter: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  filterText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
  },
  activeFilterText: {
    color: 'white',
  },
  clearFilterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  disabledButton: {
    opacity: 0.5,
  },
  clearFilterIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    marginLeft: 2,
  },
  crossLine: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: '#1E40AF',
    transform: [{ rotate: '45deg' }],
    display: 'none', // Скрываем старую линию
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterIcon: {
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  filterButtonStandalone: {
    marginHorizontal: 16,
    marginBottom: 4, // Еще больше уменьшен отступ между блоками
    marginTop: 4, // Максимально компактный отступ
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  categorySection: {
    zIndex: 10,
  },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    marginLeft: 8,
  },
});

export default HomeScreen;
