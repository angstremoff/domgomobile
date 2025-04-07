import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Modal
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Checkbox from './Checkbox';
import RangeSlider from './RangeSlider';
import Colors from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  filters?: any;
  onFiltersChange: (filters: any) => void;
  propertyType: 'sale' | 'rent';
  darkMode?: boolean;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  filters = {},
  onFiltersChange,
  propertyType,
  darkMode = false
}) => {
  const { t } = useTranslation();
  const { darkMode: contextDarkMode } = useTheme();
  const isDarkMode = darkMode || contextDarkMode;
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const [localFilters, setLocalFilters] = useState({
    propertyType: filters.propertyTypes || [],
    rooms: filters.rooms || [],
    price: filters.price || [100, 3000],
    area: filters.areas || [10, 500],
    features: filters.features || [],
  });

  useEffect(() => {
    setLocalFilters({
      propertyType: filters.propertyTypes || [],
      rooms: filters.rooms || [],
      price: filters.price || [100, 3000],
      area: filters.areas || [10, 500],
      features: filters.features || [],
    });
  }, [filters, visible]);

  const updateFilters = (newFilters: any) => {
    setLocalFilters(newFilters);
    onFiltersChange({
      propertyTypes: newFilters.propertyType,
      rooms: newFilters.rooms,
      price: newFilters.price,
      areas: newFilters.area,
      features: newFilters.features
    });
  };

  const handlePropertyTypeChange = (type: string) => {
    const updatedTypes = localFilters.propertyType.includes(type)
      ? localFilters.propertyType.filter((t: string) => t !== type)
      : [...localFilters.propertyType, type];
    
    updateFilters({
      ...localFilters,
      propertyType: updatedTypes
    });
  };

  const handleRoomChange = (room: string) => {
    const updatedRooms = localFilters.rooms.includes(room)
      ? localFilters.rooms.filter((r: string) => r !== room)
      : [...localFilters.rooms, room];
    
    updateFilters({
      ...localFilters,
      rooms: updatedRooms
    });
  };

  const handleFeatureChange = (feature: string) => {
    const updatedFeatures = localFilters.features.includes(feature)
      ? localFilters.features.filter((f: string) => f !== feature)
      : [...localFilters.features, feature];
    
    updateFilters({
      ...localFilters,
      features: updatedFeatures
    });
  };

  const handlePriceChange = (values: number[]) => {
    updateFilters({
      ...localFilters,
      price: values
    });
  };

  const handleAreaChange = (values: number[]) => {
    updateFilters({
      ...localFilters,
      area: values
    });
  };

  const getPriceStep = (value: number): number => {
    if (propertyType === 'sale') {
      if (value < 50000) return 1000;
      if (value < 100000) return 5000;
      return 10000;
    } else {
      // Для аренды
      if (value < 500) return 50;
      if (value < 1000) return 100;
      return 500;
    }
  };

  const getPropertyTypes = () => [
    { id: 'apartment', label: t('filters.apartment') },
    { id: 'house', label: t('filters.house') },
    { id: 'commercial', label: t('filters.commercial') }
  ];

  const getRoomOptions = () => [
    { id: '1', label: '1' },
    { id: '2', label: '2' },
    { id: '3', label: '3' },
    { id: '4', label: '4' },
    { id: '5+', label: '5+' }
  ];

  const getFeatures = () => [
    { id: 'parking', label: t('filters.parking') },
    { id: 'balcony', label: t('filters.balcony') },
    { id: 'elevator', label: t('filters.elevator') },
    { id: 'furnished', label: t('filters.furniture') }
  ];

  const formatPrice = (value: number) => `${value} €`;
  const formatArea = (value: number) => `${value} m²`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>{t('filters.title')}</Text>
        </View>
        
        <ScrollView style={styles.content}>
          {/* Тип недвижимости */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t('filters.propertyType')}
            </Text>
            <View style={styles.propertyTypeRow}>
              {getPropertyTypes().map(type => (
                <View key={type.id} style={styles.propertyTypeItem}>
                  <Checkbox
                    checked={localFilters.propertyType.includes(type.id)}
                    onPress={() => handlePropertyTypeChange(type.id)}
                    darkMode={isDarkMode}
                  />
                  <Text style={[styles.checkboxLabel, { color: theme.text }]} numberOfLines={2}>
                    {type.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Комнаты */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t('filters.rooms')}
            </Text>
            <View style={styles.roomsContainer}>
              {getRoomOptions().slice(0, 2).map(room => (
                <View key={room.id} style={styles.roomItem}>
                  <Checkbox
                    checked={localFilters.rooms.includes(room.id)}
                    onPress={() => handleRoomChange(room.id)}
                    darkMode={isDarkMode}
                  />
                  <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                    {room.label}
                  </Text>
                </View>
              ))}
              {getRoomOptions().slice(2, 3).map(room => (
                <View key={room.id} style={styles.roomItem}>
                  <Checkbox
                    checked={localFilters.rooms.includes(room.id)}
                    onPress={() => handleRoomChange(room.id)}
                    darkMode={isDarkMode}
                  />
                  <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                    {room.label}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.roomsContainer}>
              {getRoomOptions().slice(3).map(room => (
                <View key={room.id} style={styles.roomItem}>
                  <Checkbox
                    checked={localFilters.rooms.includes(room.id)}
                    onPress={() => handleRoomChange(room.id)}
                    darkMode={isDarkMode}
                  />
                  <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                    {room.label}
                  </Text>
                </View>
              ))}
              <View style={styles.roomItem} />
            </View>
          </View>
          
          {/* Цена */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {propertyType === 'rent' ? t('filters.pricePerMonth') : t('filters.price')}
            </Text>
            <RangeSlider
              minValue={propertyType === 'rent' ? 100 : 10000}
              maxValue={propertyType === 'rent' ? 3000 : 500000}
              step={getPriceStep}
              initialValue={localFilters.price}
              onValueChange={handlePriceChange}
              darkMode={isDarkMode}
              formatLabel={formatPrice}
            />
          </View>
          
          {/* Площадь */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t('filters.area')}
            </Text>
            <RangeSlider
              minValue={10}
              maxValue={500}
              step={10}
              initialValue={localFilters.area}
              onValueChange={handleAreaChange}
              darkMode={isDarkMode}
              formatLabel={formatArea}
            />
          </View>
          
          {/* Особенности */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t('filters.features')}
            </Text>
            <View style={styles.featuresContainer}>
              {getFeatures().slice(0, 2).map(feature => (
                <View key={feature.id} style={styles.featureItem}>
                  <Checkbox
                    checked={localFilters.features.includes(feature.id)}
                    onPress={() => handleFeatureChange(feature.id)}
                    darkMode={isDarkMode}
                  />
                  <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                    {feature.label}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.featuresContainer}>
              {getFeatures().slice(2).map(feature => (
                <View key={feature.id} style={styles.featureItem}>
                  <Checkbox
                    checked={localFilters.features.includes(feature.id)}
                    onPress={() => handleFeatureChange(feature.id)}
                    darkMode={isDarkMode}
                  />
                  <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                    {feature.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
        
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: theme.primary }]}
            onPress={() => onApply(localFilters)}
          >
            <Text style={[styles.applyButtonText, { color: 'white' }]}>
              {t('filters.applyFilters')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    position: 'absolute',
    left: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  propertyTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5,
  },
  propertyTypeItem: {
    width: '50%',
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5,
  },
  roomItem: {
    width: '33.33%',
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  applyButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5,
  },
  featureItem: {
    width: '50%',
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default FilterModal;
