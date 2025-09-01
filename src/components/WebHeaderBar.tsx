import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import HeaderControls from './HeaderControls';
import Colors from '../constants/colors';

interface City {
  id: number;
  name: string;
}

interface WebHeaderBarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  title?: string;
  isHomeScreen?: boolean;
  selectedCity?: City | null;
  onCitySelect?: (city: City | null) => void;
  onPressTitle?: () => void;
}

const WebHeaderBar: React.FC<WebHeaderBarProps> = ({
  darkMode,
  toggleDarkMode,
  title = 'DomGo.rs',
  isHomeScreen = false,
  selectedCity,
  onCitySelect,
  onPressTitle,
}) => {
  const theme = darkMode ? Colors.dark : Colors.light;

  // Только для web имеет смысл кастомная «широкая» шапка
  if (Platform.OS !== 'web') return null as any;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.headerBackground }]}>
      <View style={styles.inner}>
        <TouchableOpacity onPress={onPressTitle} activeOpacity={0.8}>
          <Text style={[styles.brand, { color: theme.headerText }]}>{title}</Text>
        </TouchableOpacity>

        <HeaderControls
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          isHomeScreen={isHomeScreen}
          selectedCity={selectedCity}
          onCitySelect={onCitySelect}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  inner: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
    paddingHorizontal: 96,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 18,
    fontWeight: '700',
  },
});

export default WebHeaderBar;
