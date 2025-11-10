import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { Logger } from '../utils/logger';

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (propertyId: string) => Promise<void>;
  isFavorite: (propertyId: string) => boolean;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Загрузка избранного из AsyncStorage
  const loadLocalFavorites = async () => {
    try {
      const saved = await AsyncStorage.getItem('favorites');
      if (saved) {
        const parsed = JSON.parse(saved);
        const validFavorites = parsed.filter((id: any) =>
          typeof id === 'string' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)
        );
        setFavorites(validFavorites);
      }
    } catch (error) {
      Logger.error('Error parsing local favorites:', error);
      setFavorites([]);
    }
    setIsLoading(false);
  };

  // Загрузка избранного из Supabase
  const loadSupabaseFavorites = async () => {
    if (!user) {
      loadLocalFavorites();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('property_id')
        .eq('user_id', user.id);

      if (error) {
        Logger.error('Error loading favorites from Supabase:', error);
        return;
      }

      if (data) {
        setFavorites(data.map(f => f.property_id));
      }
    } catch (error) {
      Logger.error('Error loading Supabase favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Инициализация при запуске и обновление при изменении состояния авторизации
  useEffect(() => {
    if (user) {
      loadSupabaseFavorites();
    } else {
      loadLocalFavorites();
    }
  }, [user]);

  const toggleFavorite = async (propertyId: string) => {
    if (!user) {
      // Неавторизованный пользователь - используем AsyncStorage
      const newFavorites = favorites.includes(propertyId)
        ? favorites.filter(id => id !== propertyId)
        : [...favorites, propertyId];
      
      setFavorites(newFavorites);
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
      return;
    }

    // Авторизованный пользователь - используем Supabase
    try {
      if (favorites.includes(propertyId)) {
        // Удаляем из избранного
        const { error: deleteError } = await supabase
          .from('favorites')
          .delete()
          .match({
            user_id: user.id,
            property_id: propertyId
          });

        if (deleteError) throw deleteError;
        setFavorites(favorites.filter(id => id !== propertyId));
      } else {
        // Добавляем в избранное
        const { error: insertError } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            property_id: propertyId
          });

        if (insertError) throw insertError;
        setFavorites([...favorites, propertyId]);
      }
    } catch (error) {
      Logger.error('Error toggling favorite:', error);
    }
  };

  const isFavorite = (propertyId: string) => {
    return favorites.includes(propertyId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, isLoading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
