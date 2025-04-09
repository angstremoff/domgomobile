import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/colors';
interface Coordinates {
  lat: number;
  lng: number;
}

interface Property {
  id: string;
  title: string;
  type: 'sale' | 'rent';
  price: number;
  latitude?: string;
  longitude?: string;
  coordinates?: Coordinates | string;
  city_id?: string | number;
}

interface PropertyMapViewProps {
  properties: Property[];
  selectedCity: any;
  onPropertySelect?: (property: Property) => void;
}

const PropertyMapView: React.FC<PropertyMapViewProps> = ({ 
  properties, 
  selectedCity,
  onPropertySelect
}) => {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const theme = darkMode ? Colors.dark : Colors.light;
  const [expanded, setExpanded] = useState(false);

  if (!selectedCity) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity 
          style={styles.header} 
          onPress={() => setExpanded(!expanded)}
        >
          <View style={styles.titleContainer}>
            <Ionicons name="map-outline" size={18} color={theme.primary} style={styles.mapIcon} />
            <Text style={[styles.title, { color: theme.text }]}>
              {t('property.mapView')}
            </Text>
          </View>
          <MaterialIcons 
            name={expanded ? "expand-less" : "expand-more"} 
            size={24} 
            color={theme.text} 
          />
        </TouchableOpacity>
        {expanded && (
          <View style={styles.noCity}>
            <Text style={[styles.noCityText, { color: theme.text }]}>
              {t('property.selectCityForMap')}
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Парсинг координат если они в строковом формате
  const parseCoordinates = (prop: Property): Coordinates | null => {
    if (!prop.coordinates) return null;
    
    // Если координаты уже в виде объекта
    if (typeof prop.coordinates === 'object') {
      return prop.coordinates;
    }
    
    // Если координаты в строковом формате JSON
    try {
      return JSON.parse(prop.coordinates);
    } catch (e) {
      console.error('Ошибка при парсинге координат:', e);
      return null;
    }
  };

  // Фильтруем только свойства с координатами и принадлежащие выбранному городу
  const propertiesWithCoords = properties.filter(p => {
    // Проверяем наличие координат
    const coords = parseCoordinates(p);
    if (!coords) return false;
    
    // Проверяем принадлежность к выбранному городу
    return p.city_id !== undefined && p.city_id.toString() === selectedCity.id.toString();
  });

  // Генерация HTML с картой MapLibre как в web версии
  const generateMapHTML = () => {
    let centerLat = 44.5315;
    let centerLng = 19.2249;
    let zoom = 12;
    
    // Устанавливаем центр карты по выбранному городу
    if (selectedCity && selectedCity.latitude && selectedCity.longitude) {
      centerLat = parseFloat(selectedCity.latitude);
      centerLng = parseFloat(selectedCity.longitude);
    }
    // Если есть объекты с координатами, устанавливаем центр по первому объекту
    else if (propertiesWithCoords.length > 0) {
      const firstPropCoords = parseCoordinates(propertiesWithCoords[0]);
      if (firstPropCoords) {
        centerLat = firstPropCoords.lat;
        centerLng = firstPropCoords.lng;
      }
    }
    
    // Создаем маркеры для всех объектов
    const markersJson = propertiesWithCoords.map((property) => {
      const coords = parseCoordinates(property);
      if (!coords) return null;
      
      const propType = property.type === 'sale' ? t('common.sale') : t('common.rent');
      const price = property.price + (property.type === 'sale' ? '€' : '€/мес');
      
      return {
        type: 'Feature',
        properties: {
          id: property.id,
          title: property.title,
          type: property.type,
          price: price,
          description: `${propType} - ${price}`
        },
        geometry: {
          type: 'Point',
          coordinates: [coords.lng, coords.lat]
        }
      };
    }).filter(marker => marker !== null);
    
    const geojson = {
      type: 'FeatureCollection',
      features: markersJson
    };
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link href="https://cdn.maptiler.com/maplibre-gl-js/v2.4.0/maplibre-gl.css" rel="stylesheet" />
        <script src="https://cdn.maptiler.com/maplibre-gl-js/v2.4.0/maplibre-gl.js"></script>
        <style>
          body, html { height: 100%; margin: 0; padding: 0; }
          #map { width: 100%; height: 100%; }
          .maplibregl-popup { max-width: 200px; }
          .maplibregl-popup-content { padding: 10px; border-radius: 5px; }
          .marker { 
            width: auto; 
            height: auto; 
            cursor: pointer; 
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            background-color: white;
            padding: 3px 6px;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 12px;
            font-weight: bold;
            border-left: 3px solid #1E88E5;
          }
          .marker.rent { border-left-color: #4CAF50; }
          .marker.sale { border-left-color: #1E88E5; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          // Инициализация карты
          const map = new maplibregl.Map({
            container: 'map',
            style: 'https://api.maptiler.com/maps/streets/style.json?key=knwOi6Znzzd7UvABCECD',
            center: [${centerLng}, ${centerLat}],
            zoom: ${zoom}
          });
          
          // Добавление контролов навигации
          map.addControl(new maplibregl.NavigationControl());
          
          // Добавление маркеров после загрузки карты
          map.on('load', function() {
            // JSON данные объектов
            const geojson = ${JSON.stringify(geojson)};
            
            // Создаем маркеры для каждого объекта
            geojson.features.forEach(function(feature) {
              // Создаем div элемент для маркера
              const el = document.createElement('div');
              el.className = 'marker ' + feature.properties.type;
              el.textContent = feature.properties.price;
              
              // Создаем попап с описанием
              const popup = new maplibregl.Popup({ offset: 15 })
                .setHTML('<strong>' + feature.properties.title + '</strong><br>' + 
                       feature.properties.description);
              
              // Добавляем маркер на карту
              const marker = new maplibregl.Marker(el)
                .setLngLat(feature.geometry.coordinates)
                .setPopup(popup)
                .addTo(map);
              
              // Обработчик клика по маркеру
              el.addEventListener('click', function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'marker_click',
                  id: feature.properties.id
                }));
              });
            });
          });
        </script>
      </body>
      </html>
    `;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={[styles.title, { color: theme.text }]}>
          {t('property.mapView')}
        </Text>
        <MaterialIcons 
          name={expanded ? "expand-less" : "expand-more"} 
          size={24} 
          color={theme.text} 
        />
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.mapContainer}>
          {propertiesWithCoords.length === 0 ? (
            <View style={styles.noProperties}>
              <Text style={[styles.noPropertiesText, { color: theme.text }]}>
                {t('property.noPropertiesOnMap')}
              </Text>
            </View>
          ) : (
            <WebView
              style={styles.map}
              originWhitelist={['*']}
              source={{ html: generateMapHTML() }}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === 'marker_click') {
                    const property = propertiesWithCoords.find(p => p.id === data.id);
                    if (property && onPropertySelect) {
                      onPropertySelect(property);
                    }
                  }
                } catch (e) {
                  console.error('Error parsing WebView message:', e);
                }
              }}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapIcon: {
    marginRight: 6,
  },
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12
  },
  title: {
    fontSize: 16,
    fontWeight: '500'
  },
  mapContainer: {
    height: 300,
    width: '100%'
  },
  map: {
    ...StyleSheet.absoluteFillObject
  },
  noCity: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center'
  },
  noCityText: {
    fontSize: 16,
    textAlign: 'center'
  },
  noProperties: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center'
  },
  noPropertiesText: {
    fontSize: 16,
    textAlign: 'center'
  }
});

export default PropertyMapView;
