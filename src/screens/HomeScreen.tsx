import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, ScrollView, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
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
    getHasMore,
    getPropertiesByType
  } = useProperties();
  const [propertyType, setPropertyType] = useState<'all' | 'sale' | 'rent'>('all');
  const [propertyCategory, setPropertyCategory] = useState<string>('all');
  // Локальная база данных для вкладок sale/rent, чтобы не зависеть от глобального properties
  const [typeItems, setTypeItems] = useState<Property[]>([]);
  const { darkMode } = useTheme();
  const theme = darkMode ? Colors.dark : Colors.light;
  const [loadingMore, setLoadingMore] = useState(false);
  const [compactView, setCompactView] = useState(false); // Состояние для переключения режима отображения
  const [filtersAppliedSale, setFiltersAppliedSale] = useState(false); // Флаг для отслеживания применения фильтров продажи
  const [filtersAppliedRent, setFiltersAppliedRent] = useState(false); // Флаг для отслеживания применения фильтров аренды
  const flatListRef = useRef<FlatList<any>>(null); // Ссылка на FlatList для программного управления прокруткой
  const scrollOffsetRef = useRef(0); // Для сохранения позиции прокрутки
  const lastLoadMoreAtRef = useRef<number>(0); // Для троттлинга onEndReached
  const LOAD_MORE_MIN_INTERVAL = 800; // мс
  // RU: Троттлинг onEndReached во избежание частых вызовов, которые ведут к рывкам скролла.
  // EN: Throttle onEndReached to avoid frequent triggers that cause scroll jumps.

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
    // Базовый источник: вкладка "Все" -> global properties; вкладки sale/rent -> локальные typeItems
    const base = propertyType === 'all' ? properties : typeItems;
    if (base.length > 0) {
      // Не применяем пользовательские фильтры на Продажа/Аренда, пока их явно не применили
      const emptyFilters = { propertyTypes: [], price: [], rooms: [], areas: [], features: [] } as any;
      // Определяем, заданы ли какие-либо пользовательские фильтры (по факту непустых массивов)
      const hasUserFilters =
        (activeFilters.propertyTypes?.length ?? 0) > 0 ||
        (activeFilters.rooms?.length ?? 0) > 0 ||
        (activeFilters.features?.length ?? 0) > 0 ||
        (activeFilters.areas?.length ?? 0) > 0 ||
        ((activeFilters.price?.length ?? 0) > 0);
      // ВАЖНО: используем активные фильтры, если есть пользовательские фильтры, выбрана категория,
      // или фильтры были явно применены
      const shouldUseActive =
        hasUserFilters || (propertyCategory !== 'all') ||
        (propertyType === 'rent' ? filtersAppliedRent : propertyType === 'sale' ? filtersAppliedSale : false);
      const filtersForApply = shouldUseActive ? activeFilters : emptyFilters;
      const filtered = applyPropertyFilters(
        base,
        propertyType,
        propertyCategory,
        selectedCity,
        filtersForApply
      );
      setFilteredProperties(filtered);
    } else if (propertyType !== 'all') {
      // Если пока нет локальной базы для sale/rent, не перетираем список
      return;
    }
  }, [propertyType, propertyCategory, selectedCity, properties, typeItems, activeFilters, filtersAppliedRent, filtersAppliedSale]);
  
  // Используем debounce для applyFilters, чтобы не вызывать фильтрацию слишком часто
  const debounceTimeout = React.useRef<NodeJS.Timeout | null>(null);
  
  // Применяем фильтры при изменении зависимостей с debounce
  useEffect(() => {
    // Очищаем предыдущий таймер, если он был установлен
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Устанавливаем новый таймер для фильтрации с задержкой
    // ВАЖНО: автофильтрацию через debounce применяем только для вкладки "Все",
    // чтобы не перетирать результаты во вкладках Продажа/Аренда
    debounceTimeout.current = setTimeout(() => {
      if (propertyType === 'all') {
        applyFilters();
      }
    }, 300);
    
    // Очистка таймера при размонтировании компонента
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [applyFilters, propertyType]);

  // МГНОВЕННАЯ реакция на смену города во вкладках Продажа/Аренда
  // Во вкладке "Все" уже есть debounce-логика выше
  useEffect(() => {
    if (propertyType === 'sale' || propertyType === 'rent') {
      const base = typeItems;
      if (base.length === 0) return;
      // Не применять фильтры до явного действия пользователя
      const emptyFilters = { propertyTypes: [], price: [], rooms: [], areas: [], features: [] } as any;
      const hasUserFilters =
        (activeFilters.propertyTypes?.length ?? 0) > 0 ||
        (activeFilters.rooms?.length ?? 0) > 0 ||
        (activeFilters.features?.length ?? 0) > 0 ||
        (activeFilters.areas?.length ?? 0) > 0 ||
        ((activeFilters.price?.length ?? 0) > 0);
      // ВАЖНО: используем активные фильтры, если есть пользовательские фильтры, выбрана категория,
      // или фильтры были явно применены
      const shouldUseActive =
        hasUserFilters || (propertyCategory !== 'all') ||
        (propertyType === 'rent' ? filtersAppliedRent : propertyType === 'sale' ? filtersAppliedSale : false);
      const filtersForApply = shouldUseActive ? activeFilters : emptyFilters;
      const filtered = applyPropertyFilters(
        base,
        propertyType,
        propertyCategory,
        selectedCity,
        filtersForApply
      );
      setFilteredProperties(filtered);
    }
  }, [selectedCity, propertyType, propertyCategory, activeFilters, typeItems, filtersAppliedRent, filtersAppliedSale]);

  useEffect(() => {
    if (propertyType === 'rent') {
      setActiveFilters(rentFilters);
      setTempFilters(rentFilters);
      // Не применять фильтры автоматически при выборе вкладки "Аренда"
      setFiltersAppliedRent(false);
    } else if (propertyType === 'sale') {
      setActiveFilters(saleFilters);
      setTempFilters(saleFilters);
      // Не применять фильтры автоматически при выборе вкладки "Продажа"
      setFiltersAppliedSale(false);
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
      // Загружаем объявления выбранного типа (первая страница) с расширенным лимитом,
      // чтобы пользователь видел больше результатов сразу
      const { data } = await getPropertiesByType(type, 1, 30);
      
      // Проверяем, не устарел ли наш запрос (другой мог стартовать пока этот выполнялся)
      if (lastFilterRequest.current.type !== type || 
          lastFilterRequest.current.category !== category) {
        console.log('Запрос устарел, пропускаем обработку результатов');
        return;
      }
      
      // Обновляем локальную базу для текущего типа
      setTypeItems(data);
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

    // Делегируем единому helper-у, чтобы логика совпадала везде (включая "5+" для комнат)
    return applyPropertyFilters(
      properties,
      type,
      propertyCategory,
      selectedCity,
      filters
    );
  };

  const handleClearFilters = async () => {
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
    
    // Применяем фильтрацию заново, получая актуальные данные из сервиса по текущему типу
    try {
      if (propertyType === 'sale' || propertyType === 'rent') {
        const { data } = await getPropertiesByType(propertyType, 1, 30);
        // Обновляем локальную базу текущего типа
        setTypeItems(data);
        // Применяем фильтр по городу при сбросе, если выбран город
        let list = [...data];
        if (selectedCity && selectedCity.id) {
          const cityIdStr = String(selectedCity.id);
          list = list.filter(p => {
            if (!p || p.city_id === undefined || p.city_id === null) return false;
            try { return String(p.city_id) === cityIdStr; } catch { return false; }
          });
        }
        setFilteredProperties(list);
      } else {
        // Для вкладки "Все" оставляем текущую стратегию
        if (properties.length > 0) {
          setFilteredProperties(properties);
        }
      }
    } catch (e) {
      console.error('Ошибка при сбросе фильтров и обновлении данных:', e);
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

    // Вычисляем категорию немедленно, чтобы избежать гонки состояния
    const categoryToApply =
      tempFilters.propertyTypes && tempFilters.propertyTypes.length === 1
        ? tempFilters.propertyTypes[0]
        : 'all';

    // Обновляем активные фильтры в зависимости от выбранной вкладки
    if (propertyType === 'sale') {
      setSaleFilters(tempFilters);
      setActiveFilters(tempFilters);
      setFiltersAppliedSale(true);
      // Синхронизация с быстрыми фильтрами
      setPropertyCategory(categoryToApply);
    } else if (propertyType === 'rent') {
      setRentFilters(tempFilters);
      setActiveFilters(tempFilters);
      setFiltersAppliedRent(true);
      // Синхронизация с быстрыми фильтрами
      setPropertyCategory(categoryToApply);
    }

    // Применяем фильтрацию c учётом выбранного города и баз данных вкладок
    const base = propertyType === 'all' ? properties : typeItems;
    if (base.length > 0) {
      // Используем общий helper, который учитывает selectedCity
      const filtered = applyPropertyFilters(
        base,
        propertyType,
        categoryToApply,
        selectedCity,
        propertyType === 'sale' ? tempFilters : propertyType === 'rent' ? tempFilters : activeFilters
      );
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
  
  // Для отслеживания изменений в списке объявлений и восстановления позиции прокрутки
  const prevPropertiesCountRef = useRef(0);
  const shouldRestoreScrollRef = useRef(false);
  
  useEffect(() => {
    if (filteredProperties.length > 0) {
      console.log('Обновление списка объявлений: ', {
        'Предыдущий размер': prevPropertiesCountRef.current,
        'Новый размер': filteredProperties.length,
        'Текущая позиция прокрутки': scrollOffsetRef.current,
        'Тип просматриваемых объявлений': propertyType,
        'Восстановить позицию?': shouldRestoreScrollRef.current
      });
      
      // Если размер увеличился (загрузили новые объявления) и позиция прокрутки не в начале,
      // восстановим позицию прокрутки
      if (filteredProperties.length > prevPropertiesCountRef.current && shouldRestoreScrollRef.current) {
        shouldRestoreScrollRef.current = false;
        
        // Небольшая задержка для уверенности, что список обновился
        setTimeout(() => {
          if (flatListRef.current && scrollOffsetRef.current > 0) {
            console.log('Восстанавливаем позицию прокрутки на:', scrollOffsetRef.current);
            flatListRef.current.scrollToOffset({
              offset: scrollOffsetRef.current,
              animated: false
            });
          }
        }, 100);
      }
      
      prevPropertiesCountRef.current = filteredProperties.length;
    }
  }, [filteredProperties, propertyType]);

  // Обработка загрузки дополнительных объявлений с сохранением позиции прокрутки
  // RU: Восстанавливаем позицию скролла после догрузки; дожидаемся await loadMoreProperties для стабильности.
  // EN: Restore scroll offset after pagination; await loadMoreProperties for stability.
  const handleLoadMore = async () => {
    const now = Date.now();
    // Троттлинг быстрых повторных вызовов
    if (now - lastLoadMoreAtRef.current < LOAD_MORE_MIN_INTERVAL) {
      return;
    }
    if (!loadingMore && getHasMore(propertyType)) {
      const currentOffset = scrollOffsetRef.current;
      console.log('Начало загрузки дополнительных объявлений: ', {
        'Тип': propertyType,
        'Текущая позиция прокрутки': currentOffset,
        'Количество объявлений': filteredProperties.length
      });
      
      // Устанавливаем флаг, что нужно восстановить позицию прокрутки после загрузки
      shouldRestoreScrollRef.current = true;
      
      setLoadingMore(true);
      try {
        await loadMoreProperties(propertyType);
        console.log('Загрузка завершена: ', {
          'Новая позиция прокрутки': scrollOffsetRef.current,
          'Разница': scrollOffsetRef.current - currentOffset,
          'Количество объявлений в filteredProperties': filteredProperties.length
        });
        // Примечание: filteredProperties и properties обновляются контекстом; debounce не перетирает вкладки sale/rent
      } finally {
        lastLoadMoreAtRef.current = Date.now();
        setLoadingMore(false);
      }
    }
  };

  // Web-responsive helpers (без влияния на mobile)
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 1024;
  const isTabletWeb = isWeb && width >= 768 && width < 1024;
  // брейкпоинты используются для вычисления колонок и ширин карточек

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme.background },
      // На desktop web не добавляем общий паддинг, т.к. обёртки секций управляют отступами (96px)
      isWeb
        ? (isDesktop
            ? { paddingHorizontal: 0 }
            : isTabletWeb
              ? { paddingHorizontal: 24 }
              : { paddingHorizontal: 12 })
        : null,
    ]}>
      <View
        style={[
          styles.filterContainer,
          // Веб-обёртка для выравнивания по левому краю и ограничения ширины
          isWeb
            ? (isDesktop
                ? { width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: 96, marginHorizontal: 0 }
                : isTabletWeb
                  ? { width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: 48, marginHorizontal: 0 }
                  : { width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: 12, marginHorizontal: 0 })
            : null,
          // Desktop web: суммарно 96 (внешний) + 16 (внутренний) = 112, чтобы вкладки совпали с карточками
          isWeb && isDesktop ? { paddingHorizontal: 112 } : null,
          // На вебе убираем внешние отступы контейнера вкладок
          isWeb ? { marginHorizontal: 0 } : null,
        ]}
      >
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
            // Очищаем typeItems, чтобы избежать показа старых данных из других вкладок
            setTypeItems([]);
            
            // Очищаем текущий список перед загрузкой, чтобы избежать показа неправильных данных
            setFilteredProperties([]);
            
            // Загружаем все объявления
            await refreshProperties();
            // Примечание: refreshProperties автоматически обновит filteredProperties через debounce
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
            // Фильтры не считаются применёнными до явного действия пользователя
            setFiltersAppliedSale(false);
            
            // Получаем свойства по типу "sale" - это обновит activePropertyTypeRef
            try {
              const result = await getPropertiesByType('sale', 1, 30);
              if (result && result.data) {
                // Базовые данные по типу
                setTypeItems(result.data);
                // Применяем фильтр по городу, если выбран
                let list = [...result.data];
                if (selectedCity && selectedCity.id) {
                  const cityIdStr = String(selectedCity.id);
                  list = list.filter(p => {
                    if (!p || p.city_id === undefined || p.city_id === null) return false;
                    try { return String(p.city_id) === cityIdStr; } catch { return false; }
                  });
                }
                setFilteredProperties(list);
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
            // Фильтры не считаются применёнными до явного действия пользователя
            setFiltersAppliedRent(false);
            
            // Получаем свойства по типу "rent" - это обновит activePropertyTypeRef
            try {
              const result = await getPropertiesByType('rent', 1, 30);
              if (result && result.data) {
                // Базовые данные по типу
                setTypeItems(result.data);
                // Применяем фильтр по городу, если выбран
                let list = [...result.data];
                if (selectedCity && selectedCity.id) {
                  const cityIdStr = String(selectedCity.id);
                  list = list.filter(p => {
                    if (!p || p.city_id === undefined || p.city_id === null) return false;
                    try { return String(p.city_id) === cityIdStr; } catch { return false; }
                  });
                }
                setFilteredProperties(list);
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
        <View
          style={[
            styles.categorySection,
            { backgroundColor: theme.background },
            // Обёртка для веба, чтобы совпадали отступы с шапкой/списком
            isWeb
              ? (isDesktop
                  ? { width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: 96 }
                  : isTabletWeb
                    ? { width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: 48 }
                    : { width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: 12 })
              : null,
          ]}
        >
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={[styles.categoryFilterContainer, { zIndex: 10 }]}
            contentContainerStyle={[
              styles.categoryFilterContent,
              // Desktop web: добавляем 16px внутреннего паддинга, чтобы совпал левый край с карточками списка
              isWeb ? (isDesktop ? { paddingHorizontal: 16 } : { paddingHorizontal: 0 }) : null,
            ]}
          >
            {(propertyType === 'rent') && (
              <TouchableOpacity
                style={[
                  styles.propertyTypeCard, 
                  { backgroundColor: theme.card, borderColor: theme.border },
                  // Desktop web: увеличенные карточки для читаемости и кликабельности
                  isWeb && isDesktop ? { width: 112, height: 84, padding: 10, marginRight: 12, cursor: 'pointer' } : null,
                  (propertyType === 'rent' && propertyCategory === 'apartment') && styles.activeCard
                ]}
                onPress={() => handleCombinedFilter('rent', 'apartment')}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="business-outline" size={isWeb && isDesktop ? 20 : 18} color={theme.primary} />
                </View>
                <Text style={[
                  styles.propertyTypeText,
                  { color: theme.text },
                  isWeb && isDesktop ? { fontSize: 12, fontWeight: '600' } : null,
                ]}>
                  {t('property.rentApartment')}
                </Text>
              </TouchableOpacity>
            )}

            {(propertyType === 'rent') && (
              <TouchableOpacity
                style={[
                  styles.propertyTypeCard, 
                  { backgroundColor: theme.card, borderColor: theme.border },
                  isWeb && isDesktop ? { width: 112, height: 84, padding: 10, marginRight: 12, cursor: 'pointer' } : null,
                  (propertyType === 'rent' && propertyCategory === 'house') && styles.activeCard
                ]}
                onPress={() => handleCombinedFilter('rent', 'house')}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="home-outline" size={isWeb && isDesktop ? 20 : 18} color={theme.primary} />
                </View>
                <Text style={[
                  styles.propertyTypeText,
                  { color: theme.text },
                  isWeb && isDesktop ? { fontSize: 12, fontWeight: '600' } : null,
                ]}>
                  {t('property.rentHouse')}
                </Text>
              </TouchableOpacity>
            )}

            {(propertyType === 'rent') && (
              <TouchableOpacity
                style={[
                  styles.propertyTypeCard, 
                  { backgroundColor: theme.card, borderColor: theme.border },
                  isWeb && isDesktop ? { width: 112, height: 84, padding: 10, marginRight: 12, cursor: 'pointer' } : null,
                  (propertyType === 'rent' && propertyCategory === 'commercial') && styles.activeCard
                ]}
                onPress={() => handleCombinedFilter('rent', 'commercial')}
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons name="storefront" size={isWeb && isDesktop ? 20 : 18} color={theme.primary} />
                </View>
                <Text style={[
                  styles.propertyTypeText,
                  { color: theme.text },
                  isWeb && isDesktop ? { fontSize: 12, fontWeight: '600' } : null,
                ]}>
                  {t('property.rentCommercial')}
                </Text>
              </TouchableOpacity>
            )}

            {(propertyType === 'sale') && (
              <TouchableOpacity
                style={[
                  styles.propertyTypeCard, 
                  { backgroundColor: theme.card, borderColor: theme.border },
                  isWeb && isDesktop ? { width: 112, height: 84, padding: 10, marginRight: 12, cursor: 'pointer' } : null,
                  (propertyType === 'sale' && propertyCategory === 'apartment') && styles.activeCard
                ]}
                onPress={() => handleCombinedFilter('sale', 'apartment')}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="business-outline" size={isWeb && isDesktop ? 20 : 18} color={theme.primary} />
                </View>
                <Text style={[
                  styles.propertyTypeText,
                  { color: theme.text },
                  isWeb && isDesktop ? { fontSize: 12, fontWeight: '600' } : null,
                ]}>
                  {t('property.saleApartment')}
                </Text>
              </TouchableOpacity>
            )}

            {(propertyType === 'sale') && (
              <TouchableOpacity
                style={[
                  styles.propertyTypeCard, 
                  { backgroundColor: theme.card, borderColor: theme.border },
                  isWeb && isDesktop ? { width: 112, height: 84, padding: 10, marginRight: 12, cursor: 'pointer' } : null,
                  (propertyType === 'sale' && propertyCategory === 'house') && styles.activeCard
                ]}
                onPress={() => handleCombinedFilter('sale', 'house')}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="home-outline" size={isWeb && isDesktop ? 20 : 18} color={theme.primary} />
                </View>
                <Text style={[
                  styles.propertyTypeText,
                  { color: theme.text },
                  isWeb && isDesktop ? { fontSize: 12, fontWeight: '600' } : null,
                ]}>
                  {t('property.saleHouse')}
                </Text>
              </TouchableOpacity>
            )}

            {(propertyType === 'sale') && (
              <TouchableOpacity
                style={[
                  styles.propertyTypeCard, 
                  { backgroundColor: theme.card, borderColor: theme.border },
                  isWeb && isDesktop ? { width: 112, height: 84, padding: 10, marginRight: 12, cursor: 'pointer' } : null,
                  (propertyType === 'sale' && propertyCategory === 'commercial') && styles.activeCard
                ]}
                onPress={() => handleCombinedFilter('sale', 'commercial')}
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons name="storefront" size={isWeb && isDesktop ? 20 : 18} color={theme.primary} />
                </View>
                <Text style={[
                  styles.propertyTypeText,
                  { color: theme.text },
                  isWeb && isDesktop ? { fontSize: 12, fontWeight: '600' } : null,
                ]}>
                  {t('property.saleCommercial')}
                </Text>
              </TouchableOpacity>
            )}

            {(propertyType === 'sale') && (
              <TouchableOpacity
                style={[
                  styles.propertyTypeCard, 
                  { backgroundColor: theme.card, borderColor: theme.border },
                  isWeb && isDesktop ? { width: 112, height: 84, padding: 10, marginRight: 12, cursor: 'pointer' } : null,
                  (propertyType === 'sale' && propertyCategory === 'land') && styles.activeCard
                ]}
                onPress={() => handleCombinedFilter('sale', 'land')}
              >
                <View style={styles.iconContainer}>
                  <FontAwesome5 name="mountain" size={isWeb && isDesktop ? 20 : 16} color={theme.primary} />
                </View>
                <Text style={[
                  styles.propertyTypeText,
                  { color: theme.text },
                  isWeb && isDesktop ? { fontSize: 12, fontWeight: '600' } : null,
                ]}>
                  {t('filters.land')}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}
      {propertyType !== 'all' && (
        <View
          style={[
            // Обёртка только для веба, чтобы кнопка фильтра была в общей сетке и слева
            isWeb
              ? (isDesktop
                  ? { width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: 96 }
                  : isTabletWeb
                    ? { width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: 48 }
                    : { width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: 12 })
              : null,
          ]}
        >
          <TouchableOpacity
            style={[
              styles.filterButtonStandalone,
              { backgroundColor: theme.card, borderColor: theme.border },
              // Desktop web: совпадение внутреннего отступа с карточками списка (16px)
              isWeb && isDesktop ? { alignSelf: 'flex-start', cursor: 'pointer', paddingVertical: 8, height: 40, width: '100%', paddingLeft: 16, paddingRight: 16, marginLeft: 16 } : null,
              // На вебе убираем горизонтальные внешние отступы, чтобы кнопка выровнялась по левому краю контейнера
              isWeb ? { marginHorizontal: 0 } : null,
            ]}
            onPress={handleOpenFilterModal}
          >
            <View style={styles.filterButtonContent}>
              <Ionicons
                name="filter-outline"
                size={isWeb && isDesktop ? 20 : 18}
                color={theme.primary}
                style={styles.filterIcon}
              />
              <Text style={[
                styles.filterButtonText,
                { color: theme.text },
                // На desktop web уменьшаем шрифт до 14px для一致ия с вкладками
                isWeb && isDesktop ? { fontSize: 14, fontWeight: '500' } : null,
              ]}>
                {t('filters.title')}
              </Text>
            </View>
          </TouchableOpacity>

          <FilterModal
            visible={filterModalVisible}
            filters={tempFilters}
            onFiltersChange={handleTempFiltersChange}
            onClose={handleCloseFilterModal}
            onApply={handleApplyFilters}
            propertyType={propertyType === 'sale' ? 'sale' : 'rent'}
            darkMode={darkMode}
          />
        </View>
      )}
      
      {!(isWeb && isDesktop) && (
        <PropertyMapView 
          properties={filteredProperties}
          selectedCity={selectedCity}
          onPropertySelect={(property) => navigation.navigate('PropertyDetails', { propertyId: property.id })}
        />
      )}

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
          ref={flatListRef}
          data={filteredProperties}
          onContentSizeChange={() => {
            console.log('Изменился размер списка: ', {
              'Количество объявлений в FlatList': filteredProperties.length,
              'Текущая позиция прокрутки': scrollOffsetRef.current,
            });
            
            // Восстанавливаем позицию прокрутки если размер списка изменился и флаг восстановления установлен
            if (shouldRestoreScrollRef.current && scrollOffsetRef.current > 0) {
              console.log('Восстанавливаем позицию при изменении размера:', scrollOffsetRef.current);
              flatListRef.current?.scrollToOffset({
                offset: scrollOffsetRef.current,
                animated: false
              });
              shouldRestoreScrollRef.current = false;
            }
          }}
          keyExtractor={(item) => item.id}
          initialNumToRender={8}
          maxToRenderPerBatch={5}
          windowSize={11}
          updateCellsBatchingPeriod={50}
          onScroll={(e) => {
            // Сохраняем позицию прокрутки
            scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
            // Логируем позицию прокрутки каждые 500 пикселей
            if (Math.floor(scrollOffsetRef.current) % 500 === 0) {
              console.log('Текущая позиция прокрутки:', Math.floor(scrollOffsetRef.current));
            }
          }}
          renderItem={({ item }: { item: Property }) => (
            <View
              style={[
                // Базовый центрирующий враппер
                isWeb ? styles.webCardWrapper : null,
                // Компактный режим: фиксированная ширина карточки для сетки 2/4/5
                isWeb && compactView
                  ? (isDesktop
                      ? { width: 230 } // 5 колонок на desktop
                      : isTabletWeb
                        ? { width: 240 } // 4 колонки на tablet web
                        : { width: '48%' }) // 2 колонки на mobile web
                  : null,
                // Native compact: растягиваем элемент на половину строки
                !isWeb && compactView ? styles.nativeItemCompact : null,
                // Полный режим: ширина под 1/2/3 колонки (как на старом сайте 3 в ряд на desktop)
                isWeb && !compactView
                  ? (isDesktop
                      ? { width: 360 }
                      : isTabletWeb
                        ? { width: 380 }
                        : { width: '100%' })
                  : null,
              ]}
            >
              {compactView ? (
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
              )}
            </View>
          )} // Мемоизируем функцию для повышения производительности 
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: 8 }, // Одинаковый небольшой отступ для всех вкладок
            isWeb ? styles.webListContainer : null,
            // Адаптивные горизонтальные отступы для веба
            isWeb
              ? (isDesktop
                  ? { paddingHorizontal: 96, maxWidth: 1280, alignSelf: 'center' }
                  : isTabletWeb
                    ? { paddingHorizontal: 48, maxWidth: 1280, alignSelf: 'center' }
                    : { paddingHorizontal: 12, maxWidth: 1280, alignSelf: 'center' })
              : null,
          ]}
          showsVerticalScrollIndicator={false}
          // Колонки по аналогии со старым сайтом
          // compact: 5 (desktop) / 4 (tablet) / 2 (mobile web)
          // full:    3 (desktop) / 2 (tablet) / 1 (mobile web)
          numColumns={
            isWeb
              ? (compactView
                  ? (isDesktop ? 5 : isTabletWeb ? 4 : 2)
                  : (isDesktop ? 3 : isTabletWeb ? 2 : 1))
              : (compactView ? 2 : 1)
          }
          columnWrapperStyle={
            // ВАЖНО: на вебе columnWrapperStyle поддерживается только при numColumns > 1
            isWeb
              ? ((compactView
                    ? (isDesktop ? 5 : isTabletWeb ? 4 : 2)
                    : (isDesktop ? 3 : isTabletWeb ? 2 : 1)) > 1
                  ? (compactView
                      ? (isDesktop || isTabletWeb
                          ? styles.webColumnWrapperCompact
                          : { paddingHorizontal: 12, justifyContent: 'space-between' })
                      : styles.webColumnWrapperFull)
                  : undefined)
              : (compactView ? styles.nativeColumnWrapperCompact : undefined)
          }
          key={
            isWeb
              ? (compactView
                  ? (isDesktop ? 'web-compact-5' : isTabletWeb ? 'web-compact-4' : 'web-compact-2')
                  : (isDesktop ? 'web-full-3' : isTabletWeb ? 'web-full-2' : 'web-full-1'))
              : (compactView ? 'native-compact-2' : 'native-full-1')
          } // Ключ для пересоздания списка при смене режима/брейкпоинта
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
          onEndReached={handleLoadMore}
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
  // Native (iOS/Android) compact grid helpers
  nativeColumnWrapperCompact: {
    paddingHorizontal: 8,
    columnGap: 8,
  },
  nativeItemCompact: {
    flex: 1,
  },
  // Web-only container to center and constrain content width
  webListContainer: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
  },
  // Wrapper for each card on web to prevent full-bleed stretching
  webCardWrapper: {
    width: 336,
    alignSelf: 'auto',
  },
  webCardWrapperCompact: {
    width: 300,
    alignSelf: 'auto',
  },
  // Обертка строк для компактной сетки (больше колонок, меньше зазоры)
  webColumnWrapperCompact: {
    gap: 16,
    paddingHorizontal: 12,
    justifyContent: 'flex-start',
  },
  // Обертка строк для полного вида (меньше колонок, больше дыхания)
  webColumnWrapperFull: {
    gap: 40,
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
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
