import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../contexts/FavoritesContext';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/colors';
import { Logger } from '../utils/logger';

interface Property {
  id: string;
  title: string;
  price: number;
  images: string[];
  type: 'sale' | 'rent';
  city_id: number;
  location: string;
  rooms?: number;
  area?: number;
  property_type?: 'apartment' | 'house' | 'commercial' | 'land';
}

const FavoritesScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { favorites, toggleFavorite, isLoading: favoritesLoading } = useFavorites();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { darkMode } = useTheme();
  const theme = darkMode ? Colors.dark : Colors.light;

  useEffect(() => {
    fetchFavoriteProperties();
  }, [favorites]);

  const fetchFavoriteProperties = async () => {
    if (favorites.length === 0) {
      setProperties([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, price, images, type, city_id, location, rooms, area, property_type')
        .in('id', favorites);

      if (error) throw error;

      if (data) {
        setProperties(data as Property[]);
      }
    } catch (error) {
      Logger.error('Ошибка загрузки избранных объявлений:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyPress = (propertyId: string) => {
    navigation.navigate('PropertyDetails', { propertyId });
  };

  const renderProperty = ({ item }: { item: Property }) => {
    const imageUrl = item.images && item.images.length > 0 
      ? item.images[0] 
      : 'https://via.placeholder.com/300x200?text=Нет+фото';

    return (
      <TouchableOpacity 
        style={[styles.propertyCard, { backgroundColor: theme.card }]}
        onPress={() => handlePropertyPress(item.id)}
      >
        <View style={styles.propertyImageContainer}>
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.propertyImage}
            resizeMode="cover"
          />
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item.id)}
          >
            <Ionicons name="heart" size={24} color="#E91E63" />
          </TouchableOpacity>
          <View style={[
            styles.propertyTypeTag,
            item.type === 'sale' ? styles.saleTag : styles.rentTag
          ]}>
            <Text style={styles.propertyTypeText}>
              {item.type === 'sale' ? t('property.sale') : t('property.rent')}
            </Text>
          </View>
          {item.property_type && (
            <View style={[
              styles.propertyKindTag,
              item.property_type === 'apartment' && styles.apartmentTag,
              item.property_type === 'house' && styles.houseTag,
              item.property_type === 'commercial' && styles.commercialTag,
              item.property_type === 'land' && styles.landTag
            ]}>
              <Text style={styles.propertyTypeText}>
                {t(`property.${item.property_type}`)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.propertyInfo}>
          <Text style={[styles.propertyPrice, { color: theme.primary }]}>
            {item.price}€ {item.type === 'rent' ? `/ ${t('property.month')}` : ''}
          </Text>
          <Text style={[styles.propertyTitle, { color: theme.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.propertyLocation, { color: theme.secondary }]}>
            {item.location}
          </Text>
          <View style={styles.propertyDetails}>
            {item.rooms && (
              <View style={styles.propertyDetail}>
                <Ionicons name="bed-outline" size={16} color={theme.secondary} />
                <Text style={[styles.propertyDetailText, { color: theme.secondary }]}>{item.rooms}</Text>
              </View>
            )}
            {item.area && (
              <View style={styles.propertyDetail}>
                <Ionicons name="square-outline" size={16} color={theme.secondary} />
                <Text style={[styles.propertyDetailText, { color: theme.secondary }]}>{item.area} м²</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading || favoritesLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color={theme.border} />
          <Text style={[styles.emptyText, { color: theme.secondary }]}>{t('favoriteScreen.emptyText')}</Text>
          <TouchableOpacity 
            style={[styles.browseButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.browseButtonText}>{t('common.allListings')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={properties}
          renderItem={renderProperty}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
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
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  browseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  propertyCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  propertyImageContainer: {
    position: 'relative',
    height: 180,
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 6,
  },
  propertyTypeTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(26, 76, 161, 0.9)',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  saleTag: {
    backgroundColor: '#FF6B6B',
  },
  rentTag: {
    backgroundColor: '#1E40AF',
  },
  propertyKindTag: {
    position: 'absolute',
    top: 48,
    left: 12,
    backgroundColor: 'rgba(26, 76, 161, 0.9)',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
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
  propertyTypeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  propertyInfo: {
    padding: 12,
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  propertyLocation: {
    fontSize: 14,
  },
  propertyDetails: {
    flexDirection: 'row',
    marginTop: 4,
  },
  propertyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  propertyDetailText: {
    fontSize: 14,
    marginLeft: 4,
  },
});

export default FavoritesScreen;
