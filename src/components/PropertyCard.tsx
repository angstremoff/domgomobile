import React, { memo, useCallback } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../contexts/FavoritesContext';
import type { Property } from '../contexts/PropertyContext';
import Colors from '../constants/colors';
import { Logger } from '../utils/logger';

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
  darkMode?: boolean;
}

const PropertyCard = memo(({ property, onPress, darkMode = false }: PropertyCardProps) => {
  const { t } = useTranslation();
  const { toggleFavorite, isFavorite } = useFavorites();
  const propertyIsFavorite = isFavorite(property.id);
  const theme = darkMode ? Colors.dark : Colors.light;
  
  const handleFavoritePress = useCallback((e: any) => {
    e.stopPropagation();
    toggleFavorite(property.id);
  }, [property.id, toggleFavorite]);

  // Получаем название города из объекта city, если оно доступно
  const cityName = property.city?.name || '';
  // Получаем переведенное название города
  const translatedCityName = cityName ? t(`cities.${cityName}`, cityName) : '';
  const streetName = property.location || '';
  const fullAddress = translatedCityName && streetName ? `${translatedCityName}, ${streetName}` : translatedCityName || streetName;

  // Отладочный вывод для проверки статуса
  Logger.debug(`PropertyCard: id=${property.id}, title=${property.title}, status=${property.status}`);
  
  // Проверяем, существует ли статус и является ли он проданным или сданным
  const isInactive = property.status === 'sold' || property.status === 'rented';
  
  // Для отображения в интерфейсе
  const displayStatus = property.status;

  return (
    <TouchableOpacity 
      style={[styles.card, Platform.OS === 'web' && styles.cardWeb, { backgroundColor: theme.card, borderColor: theme.border }]} 
      onPress={onPress} 
      activeOpacity={0.9}
    >
      <View style={[
        styles.imageContainer,
        Platform.OS === 'web' ? styles.imageContainerWeb : styles.imageContainerMobile,
      ]}>
        <Image
          source={{ uri: property.images?.[0] || 'https://via.placeholder.com/300x200' }}
          style={[
            styles.image,
            Platform.OS === 'web' && styles.imageWeb,
            // Используем переменную isInactive для проверки статуса
            isInactive && styles.imageInactive 
          ]}
          resizeMode="cover"
        />
        {Platform.OS === 'web' && (
          <View style={styles.priceOverlayWeb}>
            <Text style={styles.priceOverlayText}>{property.price.toLocaleString()}€{property.type === 'rent' ? ` / ${t('property.month')}` : ''}</Text>
          </View>
        )}
        {isInactive && (
          <View style={styles.statusOverlay}>
            <Text style={styles.statusText}>
              {displayStatus === 'sold' ? t('property.status.sold') : t('property.status.rented')}
            </Text>
          </View>
        )}
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
          style={[styles.favoriteButton, Platform.OS === 'web' && styles.favoriteButtonWeb]} 
          onPress={handleFavoritePress}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={propertyIsFavorite ? "heart" : "heart-outline"} 
            size={22} 
            color={Platform.OS === 'web' ? (propertyIsFavorite ? "#E91E63" : "#4B5563") : (propertyIsFavorite ? "#E91E63" : "#FFFFFF")} 
          />
        </TouchableOpacity>
      </View>

      <View style={[styles.infoContainer, Platform.OS === 'web' && styles.infoContainerWeb]}>
        <Text style={[styles.price, { color: theme.primary }]}>
          {property.price.toLocaleString()}€
          {property.type === 'rent' ? `/ ${t('property.month')}` : ''}
        </Text>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {property.title}
        </Text>
        <Text style={[styles.location, { color: theme.secondary }]} numberOfLines={2}>
          <Ionicons name="location-outline" size={14} color={theme.secondary} /> {fullAddress}
        </Text>

        <View style={styles.details}>
          {property.rooms !== undefined && property.property_type !== 'land' && (
            <View style={styles.detailItem}>
              <Ionicons name="bed-outline" size={16} color={theme.secondary} />
              <Text style={[styles.detailText, { color: theme.secondary }]}>{property.rooms} {t('property.rooms')}</Text>
            </View>
          )}
          {property.area !== undefined && (
            <View style={styles.detailItem}>
              <Ionicons name="square-outline" size={16} color={theme.secondary} />
              <Text style={[styles.detailText, { color: theme.secondary }]}>
                {property.property_type === 'land' ? `${property.area} ${t('property.sotkas')}` : `${property.area} м²`}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  statusOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2, 
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  imageInactive: { 
    opacity: 0.6,
  },
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
  cardWeb: {
    width: '100%',
    marginBottom: 24,
  },
  imageContainer: {
    position: 'relative',
  },
  imageContainerMobile: {
    height: 160, // mobile default
  },
  imageContainerWeb: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageWeb: {
    width: '100%',
    height: '100%',
  },
  typeTag: {
    position: 'absolute',
    top: 8,
    left: 8,
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
    left: 8,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButtonWeb: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  infoContainer: {
    padding: 12,
  },
  infoContainerWeb: {
    // Автовысота на вебе, чтобы убрать лишний «подбородок»
    paddingBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priceOverlayWeb: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  priceOverlayText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
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
    marginRight: 16,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 4,
  },
});

export default PropertyCard;
