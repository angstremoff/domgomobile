import React, { memo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../contexts/FavoritesContext';
import type { Property } from '../contexts/PropertyContext';
import Colors from '../constants/colors';
import { Image } from 'expo-image';

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
  darkMode?: boolean;
}

const ExpoOptimizedPropertyCard = ({ property, onPress, darkMode = false }: PropertyCardProps) => {
  const { t } = useTranslation();
  const { toggleFavorite, isFavorite } = useFavorites();
  const propertyIsFavorite = isFavorite(property.id);
  const theme = darkMode ? Colors.dark : Colors.light;
  
  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    toggleFavorite(property.id);
  };

  // Получаем название города из объекта city, если оно доступно
  const cityName = property.city?.name || '';
  // Получаем переведенное название города
  const translatedCityName = cityName ? t(`cities.${cityName}`, cityName) : '';
  const streetName = property.location || '';
  const fullAddress = translatedCityName && streetName ? `${translatedCityName}, ${streetName}` : translatedCityName || streetName;

  // Подготовка параметров для форматирования цены
  const price = property.price.toLocaleString();
  const priceDisplay = `${price}€${property.type === 'rent' ? `/ ${t('property.month')}` : ''}`;

  // Определяем плейсхолдер для изображения
  const placeholderURI = 'https://via.placeholder.com/300x200';

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]} 
      onPress={onPress} 
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: property.images?.[0] || placeholderURI }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
        {property.type && (
          <View style={[
            styles.typeTag,
            property.type === 'sale' ? styles.saleTag : styles.rentTag
          ]}>
            <Text style={styles.typeText}>
              {property.type === 'sale' ? t('property.sale') : t('property.rent')}
            </Text>
          </View>
        )}
        {property.property_type && (
          <View style={[
            styles.propertyTypeTag,
            property.property_type === 'apartment' && styles.apartmentTag,
            property.property_type === 'house' && styles.houseTag,
            property.property_type === 'commercial' && styles.commercialTag,
            property.property_type === 'land' && styles.landTag
          ]}>
            <Text style={styles.typeText}>
              {t(`filters.${property.property_type}`)}
            </Text>
          </View>
        )}
        <TouchableOpacity 
          style={styles.favoriteButton} 
          onPress={handleFavoritePress}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={propertyIsFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={propertyIsFavorite ? "#E91E63" : "#FFFFFF"} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.price, { color: theme.primary }]}>
          {priceDisplay}
        </Text>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {property.title}
        </Text>
        <Text style={[styles.location, { color: theme.secondary }]}>
          <Ionicons name="location-outline" size={14} color={theme.secondary} /> {fullAddress}
        </Text>

        <View style={styles.details}>
          {property.rooms !== undefined && (
            <View style={styles.detailItem}>
              <Ionicons name="bed-outline" size={16} color={theme.secondary} />
              <Text style={[styles.detailText, { color: theme.secondary }]}>{property.rooms} {t('property.rooms')}</Text>
            </View>
          )}
          {property.area !== undefined && (
            <View style={styles.detailItem}>
              <Ionicons name="square-outline" size={16} color={theme.secondary} />
              <Text style={[styles.detailText, { color: theme.secondary }]}>{property.area} м²</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  typeTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  saleTag: {
    backgroundColor: '#FF6B6B',
  },
  rentTag: {
    backgroundColor: '#1E40AF',
  },
  propertyTypeTag: {
    position: 'absolute',
    top: 40,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  apartmentTag: {
    backgroundColor: '#3B82F6',
  },
  houseTag: {
    backgroundColor: '#8B9467',
  },
  commercialTag: {
    backgroundColor: '#F59E0B',
  },
  landTag: {
    backgroundColor: '#34C759',
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    marginBottom: 8,
  },
  details: {
    flexDirection: 'row',
    marginTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  detailText: {
    fontSize: 12,
    marginLeft: 4,
  },
});

// Мемоизация для предотвращения лишних ререндеров
export default memo(ExpoOptimizedPropertyCard);
