import React, { memo, useCallback } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../contexts/FavoritesContext';
import type { Property } from '../contexts/PropertyContext';
import Colors from '../constants/colors';

interface PropertyCardCompactProps {
  property: Property;
  onPress: () => void;
  darkMode?: boolean;
}

const PropertyCardCompact = memo(({ property, onPress, darkMode = false }: PropertyCardCompactProps) => {
  const { t } = useTranslation();
  const { toggleFavorite, isFavorite } = useFavorites();
  const propertyIsFavorite = isFavorite(property.id);
  const theme = darkMode ? Colors.dark : Colors.light;
  
  const handleFavoritePress = useCallback((e: any) => {
    e.stopPropagation();
    toggleFavorite(property.id);
  }, [property.id, toggleFavorite]);

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]} 
      onPress={onPress} 
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: property.images?.[0] || 'https://via.placeholder.com/300x200' }}
          style={styles.image}
          resizeMode="cover"
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
            size={18} 
            color={propertyIsFavorite ? "#E91E63" : "#FFFFFF"} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.price, { color: theme.primary }]} numberOfLines={1}>
          {property.price.toLocaleString()}€
          {property.type === 'rent' ? `/${t('property.month')}` : ''}
        </Text>
        
        <View style={styles.details}>
          {property.rooms !== undefined && property.property_type !== 'land' && (
            <View style={styles.detailItem}>
              <Ionicons name="bed-outline" size={12} color={theme.secondary} />
              <Text style={[styles.detailText, { color: theme.secondary }]}>{property.rooms}</Text>
            </View>
          )}
          {property.area !== undefined && (
            <View style={styles.detailItem}>
              <Ionicons name="square-outline" size={12} color={theme.secondary} />
              <Text style={[styles.detailText, { color: theme.secondary }]}>
                {property.property_type === 'land' ? `${property.area} ${t('property.sotkas')}` : `${property.area}м²`}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    marginHorizontal: 4,
    width: '48%', // Примерно половина ширины экрана с учетом отступов
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 100,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  typeTag: {
    position: 'absolute',
    top: 5,
    left: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  saleTag: {
    backgroundColor: '#FF6B6B',
  },
  rentTag: {
    backgroundColor: '#1E40AF',
  },
  propertyTypeTag: {
    position: 'absolute',
    top: 30,
    left: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
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
    fontSize: 10,
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  details: {
    flexDirection: 'row',
    marginTop: 2,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  detailText: {
    fontSize: 12,
    marginLeft: 2,
  },
});

export default PropertyCardCompact;
