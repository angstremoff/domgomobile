import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import Colors from '../constants/colors';
import { propertyService } from '../services/propertyService';

interface City {
  id: number;
  name: string;
}

interface HeaderControlsProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  isHomeScreen?: boolean;
  selectedCity?: City | null;
  onCitySelect?: (city: City | null) => void;
}

const HeaderControls = ({ darkMode, toggleDarkMode, isHomeScreen = false, selectedCity, onCitySelect }: HeaderControlsProps) => {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const theme = darkMode ? Colors.dark : Colors.light;
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [cities, setCities] = useState<City[]>([]);

  // Загрузка списка городов
  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const citiesData = await propertyService.getCities();
      setCities(citiesData);
    } catch (error) {
      console.error('Ошибка при загрузке городов:', error);
    }
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'ru' ? 'sr' : 'ru';
    setLanguage(newLanguage);
  };

  const handleCitySelect = (city: City | null) => {
    if (onCitySelect) {
      onCitySelect(city);
    }
    setIsCityModalVisible(false);
  };

  // Функция для получения переведенного названия города
  const getTranslatedCityName = (cityName: string | null | undefined) => {
    // Добавляем проверку на null и undefined
    if (!cityName) {
      return t('common.allCities');
    }
    return t(`cities.${cityName}`, cityName);
  };

  return (
    <View style={styles.container}>
      {isHomeScreen && (
        <>
          <TouchableOpacity 
            style={[styles.iconButton, styles.cityButtonContainer]} 
            onPress={() => setIsCityModalVisible(true)}
          >
            <View style={[styles.cityButton, darkMode ? {} : { backgroundColor: '#1E3A8A', borderRadius: 0 }]}>
              <Ionicons name="location-outline" size={22} color={darkMode ? "#F1F5F9" : "#FFFFFF"} />
              <Text style={[styles.cityText, { color: darkMode ? "#F1F5F9" : "#FFFFFF", fontWeight: darkMode ? 'normal' : 'bold' }]}>
                {selectedCity && selectedCity.name 
                  ? getTranslatedCityName(selectedCity.name)
                  : t('common.allCities')}
              </Text>
            </View>
          </TouchableOpacity>
        </>
      )}
      
      <TouchableOpacity 
        style={styles.iconButton} 
        onPress={toggleLanguage}
      >
        <Text style={styles.flagText}>
          {language === 'ru' ? '🇷🇺' : '🇷🇸'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.iconButton, darkMode ? {} : { backgroundColor: '#1E3A8A', borderRadius: 0 }]}
        onPress={toggleDarkMode}
      >
        <Ionicons 
          name={darkMode ? "sunny" : "moon"} 
          size={22} 
          color={darkMode ? "#F1F5F9" : "#FFFFFF"} 
        />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isCityModalVisible}
        onRequestClose={() => setIsCityModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: darkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.cityModalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.cityModalTitle, { color: theme.text }]}>{t('common.selectCity')}</Text>
              <TouchableOpacity onPress={() => setIsCityModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            {/* Опция "Все города" */}
            <TouchableOpacity
              style={styles.cityModalItem}
              onPress={() => handleCitySelect(null)}
            >
              <Text style={[styles.cityModalItemText, { color: theme.primary, fontWeight: '600' }]}>{t('common.allCities')}</Text>
            </TouchableOpacity>
            
            <FlatList
              data={cities}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.cityModalItem}
                  onPress={() => handleCitySelect(item)}
                >
                  <Text style={[styles.cityModalItemText, { color: darkMode ? theme.text : '#1E3A8A' }]}>
                    {getTranslatedCityName(item.name)}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 5,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  cityButtonContainer: {
    width: 'auto',
    height: 'auto',
    paddingHorizontal: 5,
  },
  flagText: {
    fontSize: 18,
  },
  cityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 'auto',
    marginRight: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  cityText: {
    fontSize: 14,
    marginLeft: 4,
    flexShrink: 1,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  cityModalContent: {
    padding: 16,
    borderRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cityModalTitle: {
    fontSize: 18,
  },
  cityModalItem: {
    paddingVertical: 8,
  },
  cityModalItemText: {
    fontSize: 16,
  },
});

export default HeaderControls;
