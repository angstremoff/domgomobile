import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from '../utils/logger';

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
