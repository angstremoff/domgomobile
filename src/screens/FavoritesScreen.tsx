import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../contexts/FavoritesContext';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/colors';
import { Logger } from '../utils/logger';
import PropertyCard from '../components/PropertyCard';

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
  const { favorites, isLoading: favoritesLoading } = useFavorites();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { darkMode } = useTheme();
  const theme = darkMode ? Colors.dark : Colors.light;
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 1024;
  const isTabletWeb = isWeb && width >= 768 && width < 1024;

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
    return (
      <View
        style={[
          styles.cardWrapper,
          isWeb && (isDesktop
            ? { width: 360 }
            : isTabletWeb
              ? { width: 320 }
              : { width: '100%' }),
        ]}
      >
        <PropertyCard
          property={item as any}
          onPress={() => handlePropertyPress(item.id)}
          darkMode={darkMode}
        />
      </View>
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
          contentContainerStyle={[
            styles.listContainer,
            isWeb && {
              paddingHorizontal: isDesktop ? 96 : isTabletWeb ? 48 : 16,
              maxWidth: 1280,
              alignSelf: 'center',
            },
          ]}
          showsVerticalScrollIndicator={false}
          numColumns={isWeb ? (isDesktop ? 3 : isTabletWeb ? 2 : 1) : 1}
          columnWrapperStyle={
            isWeb && (isDesktop ? 3 : isTabletWeb ? 2 : 1) > 1
              ? {
                  gap: isDesktop ? 24 : 20,
                  justifyContent: 'flex-start',
                }
              : undefined
          }
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
  cardWrapper: {
    marginBottom: 24,
    alignSelf: 'stretch',
  },
});

export default FavoritesScreen;
