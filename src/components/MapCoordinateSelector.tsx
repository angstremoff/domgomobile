import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/colors';

// Интерфейс для координат
interface Coordinates {
  lat: number;
  lng: number;
}

// Интерфейс пропсов компонента
interface MapCoordinateSelectorProps {
  selectedCity: {
    id: string;
    name: string;
    latitude?: string;
    longitude?: string;
  } | null;
  initialCoordinates?: Coordinates | null;
  onCoordinatesSelect: (coordinates: Coordinates) => void;
}

const MapCoordinateSelector = ({ selectedCity, initialCoordinates, onCoordinatesSelect }: MapCoordinateSelectorProps) => {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const theme = darkMode ? Colors.dark : Colors.light;

  // Состояния компонента
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(initialCoordinates || null);

  // Обновляем координаты если изменились начальные координаты
  useEffect(() => {
    if (initialCoordinates) {
      setCoordinates(initialCoordinates);
    }
  }, [initialCoordinates]);

  // Форматирование координат для отображения
  const formatCoordinates = (coords: Coordinates) => {
    return `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
  };

  // Генерация HTML для WebView с картой
  const getMapHtml = () => {
    // Определяем координаты для центра карты
    const lat = coordinates?.lat || (selectedCity?.latitude ? parseFloat(selectedCity.latitude) : 45.267136);
    const lng = coordinates?.lng || (selectedCity?.longitude ? parseFloat(selectedCity.longitude) : 19.833549);

    console.log('Generating map with coordinates:', { lat, lng });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>Выбор координат</title>
        <script src="https://cdn.maptiler.com/maplibre-gl-js/v2.4.0/maplibre-gl.js"></script>
        <link href="https://cdn.maptiler.com/maplibre-gl-js/v2.4.0/maplibre-gl.css" rel="stylesheet" />
        <style>
          body { margin: 0; padding: 0; height: 100vh; }
          #map { position: absolute; top: 0; bottom: 0; width: 100%; height: 100%; }
          .marker {
            background-color: #00BCD4;
            background-size: cover;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 0 5px rgba(0,0,0,0.5);
          }
          .maplibregl-ctrl-top-right {
            top: 10px !important;
          }
          .button {
            position: absolute;
            bottom: 20px;
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            z-index: 1000;
          }
          .cancel-button {
            right: 50%;
            margin-right: 5px;
            background-color: #FF3B30;
            color: white;
          }
          .apply-button {
            left: 50%;
            margin-left: 5px;
            background-color: #1E3A8A;
            color: white;
          }
          .message-box {
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            padding: 10px;
            background-color: rgba(0,0,0,0.7);
            color: white;
            text-align: center;
            border-radius: 5px;
            z-index: 1000;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="message-box">${t('property.tapMapToSelectLocation')}</div>
        <button id="cancelButton" class="button cancel-button" onclick="cancelSelection()">${t('common.cancel')}</button>
        <button id="applyButton" class="button apply-button" onclick="confirmLocation()" style="display:none">${t('common.apply')}</button>
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            const lat = ${lat};
            const lng = ${lng};
            
            console.log('Initializing map with coordinates:', lat, lng);
            
            // Инициализация карты с теми же настройками, что и в остальном приложении
            const map = new maplibregl.Map({
              container: 'map',
              style: 'https://api.maptiler.com/maps/streets/style.json?key=knwOi6Znzzd7UvABCECD',
              center: [lng, lat],
              zoom: 14
            });
            
            // Добавляем контрол для навигации
            map.addControl(new maplibregl.NavigationControl());
            
            // Создаем маркер
            const markerElement = document.createElement('div');
            markerElement.className = 'marker';
            
            // Запоминаем исходные координаты
            const initialCoords = { lng, lat };
            let markerMoved = false;
            
            const marker = new maplibregl.Marker({
              element: markerElement,
              draggable: true
            })
              .setLngLat([lng, lat])
              .addTo(map);
            
            // При перетаскивании маркера показываем кнопку Применить
            marker.on('dragend', () => {
              markerMoved = true;
              document.getElementById('cancelButton').style.display = 'none';
              document.getElementById('applyButton').style.display = 'block';
            });
            
            // Обработчик клика по карте для перемещения маркера
            map.on('click', (e) => {
              marker.setLngLat(e.lngLat);
              markerMoved = true;
              document.getElementById('cancelButton').style.display = 'none';
              document.getElementById('applyButton').style.display = 'block';
            });
            
            // Обработчик для кнопки Применить
            window.confirmLocation = function() {
              const lngLat = marker.getLngLat();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                action: 'coordinatesSelected',
                coordinates: {
                  lat: lngLat.lat,
                  lng: lngLat.lng
                }
              }));
            }
            
            // Обработчик для кнопки Отмена
            window.cancelSelection = function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                action: 'cancelSelection'
              }));
            }
            
            map.on('load', () => {
              console.log('Map loaded successfully');
            });
          });
        </script>
      </body>
      </html>
    `;
  };

  // Обработчик сообщений от WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Message from WebView:', data);
      
      if (data.action === 'coordinatesSelected' && data.coordinates) {
        // Обновляем координаты сначала, чтобы они точно были переданы
        console.log('Applying new coordinates:', data.coordinates);
        setCoordinates(data.coordinates);
        onCoordinatesSelect(data.coordinates);
        
        // Потом закрываем модальное окно
        setIsMapVisible(false);
      } else if (data.action === 'cancelSelection') {
        // Просто закрываем модальное окно без изменения координат
        console.log('Selection canceled');
        setIsMapVisible(false);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  // Открытие карты
  const handleOpenMap = () => {
    console.log('Opening map dialog with city:', selectedCity?.name);
    
    if (!selectedCity) {
      Alert.alert(t('common.info'), t('common.selectCity'));
      return;
    }
    
    // Если координаты не выбраны, установим координаты города по умолчанию
    if (!coordinates && selectedCity?.latitude && selectedCity?.longitude) {
      const defaultCoords = {
        lat: parseFloat(selectedCity.latitude),
        lng: parseFloat(selectedCity.longitude)
      };
      console.log('Setting default coordinates from city:', defaultCoords);
      setCoordinates(defaultCoords);
      onCoordinatesSelect(defaultCoords);
    }
    
    // Открываем модальное окно с картой
    setIsMapVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text }]}>{t('property.locationOnMap')}</Text>
      
      <View style={styles.coordinatesContainer}>
        {/* Поле отображения координат */}
        <TouchableOpacity 
          style={[styles.coordinatesBox, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={handleOpenMap}
          activeOpacity={0.7}
        >
          <Text style={[styles.coordinatesText, { color: theme.text }]}> 
            {coordinates ? formatCoordinates(coordinates) : t('property.selectLocationOnMap')}
          </Text>
        </TouchableOpacity>
        
        {/* Кнопка открытия карты */}
        <TouchableOpacity 
          style={[styles.mapButton, { backgroundColor: theme.primary }]}
          onPress={handleOpenMap}
        >
          <MaterialIcons name="add-location" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Модальное окно с картой */}
      <Modal
        visible={isMapVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsMapVisible(false)}
      >
        <View style={styles.modalContainer}>
          <WebView
            source={{ html: getMapHtml() }}
            style={styles.webview}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
          
          {/* Кнопка закрытия убрана, так как теперь с этим работают кнопки Отмена/Применить внутри WebView */}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  coordinatesBox: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  coordinatesText: {
    fontSize: 14,
  },
  mapButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    bottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 150,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Стили для кнопок теперь не используются, так как кнопки находятся внутри WebView
});

export default MapCoordinateSelector;
