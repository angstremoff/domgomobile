import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Checkbox from '../components/Checkbox';
import Colors from '../constants/colors';

interface PropertyFiltersProps {
  propertyType: 'sale' | 'rent';
  filters: {
    propertyTypes: string[];
    priceRanges: string[];
    rooms: string[];
    areas: string[];
    features: string[];
  };
  onFiltersChange: (newFilters: {
    propertyTypes: string[];
    priceRanges: string[];
    rooms: string[];
    areas: string[];
    features: string[];
  }) => void;
  darkMode: boolean;
}

const PropertyFilters: React.FC<PropertyFiltersProps> = ({
  propertyType,
  filters,
  onFiltersChange,
  darkMode
}) => {
  const { t } = useTranslation();
  const theme = darkMode ? Colors.dark : Colors.light;
  
  // Состояние для отслеживания открытого/закрытого состояния всего компонента фильтров
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Состояние для отслеживания открытых/закрытых секций
  const [expandedSections, setExpandedSections] = useState<{
    propertyTypes: boolean;
    priceRanges: boolean;
    rooms: boolean;
    areas: boolean;
    features: boolean;
  }>({
    propertyTypes: false,
    priceRanges: false,
    rooms: false,
    areas: false,
    features: false
  });

  // Функция для переключения состояния секции
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Функция для обновления выбранных фильтров
  const handleFilterChange = (
    filterType: keyof typeof filters,
    value: string
  ) => {
    const updatedFilters = { ...filters };
    
    if (updatedFilters[filterType].includes(value)) {
      // Если значение уже выбрано, удаляем его
      updatedFilters[filterType] = updatedFilters[filterType].filter(
        item => item !== value
      );
    } else {
      // Иначе добавляем
      updatedFilters[filterType] = [...updatedFilters[filterType], value];
    }
    
    onFiltersChange(updatedFilters);
  };

  // Получаем соответствующие опции в зависимости от типа (аренда/продажа)
  const getPropertyTypeOptions = () => {
    if (propertyType === 'rent') {
      return [
        { value: 'apartment', label: t('filters.apartment') },
        { value: 'house', label: t('filters.house') },
        { value: 'commercial', label: t('filters.commercial') }
      ];
    } else {
      return [
        { value: 'apartment', label: t('filters.apartment') },
        { value: 'house', label: t('filters.house') },
        { value: 'commercial', label: t('filters.commercial') },
        { value: 'land', label: t('filters.land') }
      ];
    }
  };

  const getPriceRangeOptions = () => {
    if (propertyType === 'rent') {
      return [
        { value: 'under500', label: t('filters.under500') },
        { value: '500to1000', label: t('filters.500to1000') },
        { value: '1000to2000', label: t('filters.1000to2000') },
        { value: '2000to3000', label: t('filters.2000to3000') },
        { value: 'above3000', label: t('filters.above3000') }
      ];
    } else {
      return [
        { value: 'under100k', label: t('filters.under100k') },
        { value: '100kto300k', label: t('filters.100kto300k') },
        { value: '300kto500k', label: t('filters.300kto500k') },
        { value: '500kto1m', label: t('filters.500kto1m') },
        { value: 'above1m', label: t('filters.above1m') }
      ];
    }
  };

  const getRoomOptions = () => {
    return [
      { value: '1', label: t('filters.1room') },
      { value: '2', label: t('filters.2rooms') },
      { value: '3', label: t('filters.3rooms') },
      { value: '4plus', label: t('filters.4plusRooms') }
    ];
  };

  const getAreaOptions = () => {
    if (propertyType === 'rent') {
      return [
        { value: 'under40', label: t('filters.under40') },
        { value: '40to60', label: t('filters.40to60') },
        { value: '60to100', label: t('filters.60to100') },
        { value: 'above100', label: t('filters.above100') }
      ];
    } else {
      return [
        { value: 'under50', label: t('filters.under50') },
        { value: '50to100', label: t('filters.50to100') },
        { value: '100to200', label: t('filters.100to200') },
        { value: 'above200', label: t('filters.above200') }
      ];
    }
  };

  const getFeatureOptions = () => {
    return [
      { value: 'parking', label: t('filters.parking') },
      { value: 'balcony', label: t('filters.balcony') },
      { value: 'elevator', label: t('filters.elevator') },
      { value: 'furniture', label: t('filters.furniture') }
    ];
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <TouchableOpacity 
        style={styles.headerContainer}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.headerContent}>
          <Ionicons name="options-outline" size={18} color={theme.primary} style={styles.headerIcon} />
          <Text style={[styles.headerText, { color: theme.text }]}>
            {t('filters.title')}
          </Text>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={theme.secondary} 
          />
        </View>
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.filtersContainer}>
          {/* Тип недвижимости */}
          <TouchableOpacity 
            style={styles.sectionHeader} 
            onPress={() => toggleSection('propertyTypes')}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t('filters.propertyType')}
            </Text>
            <Ionicons 
              name={expandedSections.propertyTypes ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={theme.text} 
            />
          </TouchableOpacity>
          
          {expandedSections.propertyTypes && (
            <View style={styles.optionsContainer}>
              {getPropertyTypeOptions().map((option) => (
                <View key={option.value} style={styles.checkboxRow}>
                  <Checkbox
                    checked={filters.propertyTypes.includes(option.value)}
                    onPress={() => handleFilterChange('propertyTypes', option.value)}
                    darkMode={darkMode}
                  />
                  <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                    {option.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Ценовой диапазон */}
          <TouchableOpacity 
            style={styles.sectionHeader} 
            onPress={() => toggleSection('priceRanges')}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {propertyType === 'rent' ? t('filters.pricePerMonth') : t('filters.price')}
            </Text>
            <Ionicons 
              name={expandedSections.priceRanges ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={theme.text} 
            />
          </TouchableOpacity>
          
          {expandedSections.priceRanges && (
            <View style={styles.optionsContainer}>
              {getPriceRangeOptions().map((option) => (
                <View key={option.value} style={styles.checkboxRow}>
                  <Checkbox
                    checked={filters.priceRanges.includes(option.value)}
                    onPress={() => handleFilterChange('priceRanges', option.value)}
                    darkMode={darkMode}
                  />
                  <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                    {option.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Количество комнат */}
          <TouchableOpacity 
            style={styles.sectionHeader} 
            onPress={() => toggleSection('rooms')}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t('filters.rooms')}
            </Text>
            <Ionicons 
              name={expandedSections.rooms ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={theme.text} 
            />
          </TouchableOpacity>
          
          {expandedSections.rooms && (
            <View style={styles.optionsContainer}>
              {getRoomOptions().map((option) => (
                <View key={option.value} style={styles.checkboxRow}>
                  <Checkbox
                    checked={filters.rooms.includes(option.value)}
                    onPress={() => handleFilterChange('rooms', option.value)}
                    darkMode={darkMode}
                  />
                  <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                    {option.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Площадь */}
          <TouchableOpacity 
            style={styles.sectionHeader} 
            onPress={() => toggleSection('areas')}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t('filters.area')}
            </Text>
            <Ionicons 
              name={expandedSections.areas ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={theme.text} 
            />
          </TouchableOpacity>
          
          {expandedSections.areas && (
            <View style={styles.optionsContainer}>
              {getAreaOptions().map((option) => (
                <View key={option.value} style={styles.checkboxRow}>
                  <Checkbox
                    checked={filters.areas.includes(option.value)}
                    onPress={() => handleFilterChange('areas', option.value)}
                    darkMode={darkMode}
                  />
                  <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                    {option.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Особенности */}
          <TouchableOpacity 
            style={styles.sectionHeader} 
            onPress={() => toggleSection('features')}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t('filters.features')}
            </Text>
            <Ionicons 
              name={expandedSections.features ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={theme.text} 
            />
          </TouchableOpacity>
          
          {expandedSections.features && (
            <View style={styles.optionsContainer}>
              {getFeatureOptions().map((option) => (
                <View key={option.value} style={styles.checkboxRow}>
                  <Checkbox
                    checked={filters.features.includes(option.value)}
                    onPress={() => handleFilterChange('features', option.value)}
                    darkMode={darkMode}
                  />
                  <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                    {option.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  filtersContainer: {
    padding: 16,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionsContainer: {
    paddingVertical: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxLabel: {
    marginLeft: 12,
    fontSize: 14,
  },
});

export default PropertyFilters;
