import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import { Logger } from '../utils/logger';
import Colors from '../constants/colors';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  darkMode: true, // По умолчанию темная тема
  toggleDarkMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(true); // По умолчанию темная тема
  
  useEffect(() => {
    // Загружаем предпочтение темы при первом запуске приложения
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@theme_preference');
        if (savedTheme) {
          setDarkMode(savedTheme === 'dark');
        } else {
          // Если нет сохраненных настроек, сохраняем темную тему по умолчанию
          await AsyncStorage.setItem('@theme_preference', 'dark');
        }
      } catch (error) {
        Logger.error('Ошибка при загрузке темы:', error);
      }
    };
    
    loadThemePreference();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const applyNavigationBarTheme = async () => {
      const backgroundColor = darkMode ? Colors.dark.background : Colors.light.background;
      const buttonStyle: 'light' | 'dark' = darkMode ? 'light' : 'dark';

      try {
        await NavigationBar.setBackgroundColorAsync(backgroundColor);
        await NavigationBar.setButtonStyleAsync(buttonStyle);
      } catch (error) {
        Logger.warn('Не удалось применить цвета системной панели навигации:', error);
      }
    };

    applyNavigationBarTheme();
  }, [darkMode]);

  const toggleDarkMode = async () => {
    try {
      const newMode = !darkMode;
      setDarkMode(newMode);
      await AsyncStorage.setItem('@theme_preference', newMode ? 'dark' : 'light');
    } catch (error) {
      Logger.error('Ошибка при сохранении темы:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
