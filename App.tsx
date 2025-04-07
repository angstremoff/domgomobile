import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { FavoritesProvider } from './src/contexts/FavoritesContext';
import { PropertyProvider } from './src/contexts/PropertyContext';
import AlertProvider from './src/components/AlertProvider';
import AlertInitializer from './src/components/AlertInitializer';
import AppNavigator from './src/navigation/AppNavigator';
import './src/translations';

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AlertProvider>
          <AlertInitializer />
          <AuthProvider>
            <FavoritesProvider>
              <PropertyProvider>
                <AppNavigator />
                <StatusBar style="auto" />
              </PropertyProvider>
            </FavoritesProvider>
          </AuthProvider>
        </AlertProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
