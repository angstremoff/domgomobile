import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Property } from '../contexts/PropertyContext';
import { useProperties } from '../contexts/PropertyContext';
import { WebView } from 'react-native-webview';
 

interface MapScreenProps {
  navigation: any;
  route: any;
}

const MapScreen: React.FC<MapScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { properties } = useProperties();
  const [activeFilter, setActiveFilter] = useState<'all' | 'sale' | 'rent'>('all');
  const [mapItems, setMapItems] = useState<Property[]>([]);
  const webViewRef = useRef<WebView>(null);
  
  useEffect(() => {
    // Фильтрация объектов для карты
    if (activeFilter === 'all') {
      setMapItems(properties);
    } else {
      setMapItems(properties.filter(prop => prop.type === activeFilter));
    }
  }, [activeFilter, properties]);

  useEffect(() => {
    // Отправка отфильтрованных объектов в WebView
    if (webViewRef.current && mapItems) {
      const mapData = {
        action: 'updateMarkers',
        properties: mapItems.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          type: item.type,
          coordinates: item.latitude && item.longitude ? {
            lng: parseFloat(item.longitude),
            lat: parseFloat(item.latitude)
          } : null,
          images: item.images
        }))
      };
      webViewRef.current.postMessage(JSON.stringify(mapData));
    }
  }, [mapItems]);

  // HTML код для WebView с OpenStreetMap (как в веб-версии)
  const mapHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Карта объявлений</title>
      <link href="https://cdn.jsdelivr.net/npm/maplibre-gl@2.4.0/dist/maplibre-gl.css" rel="stylesheet" />
      <script src="https://cdn.jsdelivr.net/npm/maplibre-gl@2.4.0/dist/maplibre-gl.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { position: absolute; top: 0; bottom: 0; width: 100%; }
        .property-popup { max-width: 280px; }
        .property-popup-content { width: 250px; }
        .property-image { width: 100%; height: 120px; object-fit: cover; border-top-left-radius: 4px; border-top-right-radius: 4px; }
        .property-info { padding: 8px; background-color: white; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; }
        .property-title { font-weight: bold; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .property-price { font-size: 14px; color: #4B5563; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        let map;
        let markers = [];
        
        document.addEventListener('DOMContentLoaded', () => {
          initMap();
          
          // Слушаем сообщения от React Native
          window.addEventListener('message', (event) => {
            try {
              const data = JSON.parse(event.data);
              
              if (data.action === 'updateMarkers') {
                updateMarkers(data.properties);
              } else if (data.action === 'setFilter') {
                filterMarkers(data.filter);
              } else if (data.action === 'setCenter') {
                setMapCenter(data.center, data.zoom);
              }
            } catch (error) {
              console.error('Error processing message:', error);
            }
          });
        });
        
        function initMap() {
          map = new maplibregl.Map({
            container: 'map',
            style: {
              version: 8,
              sources: {
                'osm': {
                  type: 'raster',
                  tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                  tileSize: 256,
                  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }
              },
              layers: [{
                id: 'osm',
                type: 'raster',
                source: 'osm',
                minzoom: 0,
                maxzoom: 19
              }]
            },
            center: [20.457273, 44.787197], // Белград по умолчанию
            zoom: 9
          });
          
          map.addControl(new maplibregl.NavigationControl());
          
          // Сообщаем, что карта загружена
          setTimeout(() => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              event: 'mapLoaded'
            }));
          }, 1000);
        }
        
        function updateMarkers(properties) {
          // Удаляем старые маркеры
          markers.forEach(marker => marker.remove());
          markers = [];
          
          // Добавляем новые маркеры
          properties.forEach(property => {
            if (property.coordinates) {
              try {
                // Создаем маркер
                const el = document.createElement('div');
                el.className = 'marker';
                el.style.width = '25px';
                el.style.height = '25px';
                el.style.borderRadius = '50%';
                el.style.backgroundColor = property.type === 'sale' ? '#EF4444' : '#3B82F6';
                el.style.border = '3px solid white';
                el.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3)';
                
                const marker = new maplibregl.Marker(el)
                  .setLngLat([property.coordinates.lng, property.coordinates.lat])
                  .addTo(map);
                
                // Создаем всплывающее окно
                const popup = new maplibregl.Popup({
                  closeButton: true,
                  closeOnClick: false,
                  offset: [0, -15],
                  className: 'property-popup',
                });
                
                const popupContent = document.createElement('div');
                popupContent.className = 'property-popup-content';
                
                // Формируем содержимое всплывающего окна
                const image = property.images && property.images.length > 0 
                  ? property.images[0] 
                  : 'https://via.placeholder.com/300x200?text=Нет+фото';
                
                popupContent.innerHTML = \`
                  <div class="property-content">
                    <img src="\${image}" class="property-image" alt="\${property.title}"/>
                    <div class="property-info">
                      <div class="property-title">\${property.title}</div>
                      <div class="property-price">\${property.price ? property.price.toLocaleString() + ' €' : 'Цена не указана'} \${property.type === 'rent' ? '/мес' : ''}</div>
                    </div>
                  </div>
                \`;
                
                popup.setDOMContent(popupContent);
                
                // Обработчик клика по маркеру
                marker.getElement().addEventListener('click', () => {
                  marker.setPopup(popup);
                  
                  // Сообщаем React Native о клике по маркеру
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    event: 'markerClick',
                    propertyId: property.id
                  }));
                });
                
                markers.push(marker);
              } catch (error) {
                console.error('Error creating marker:', error);
              }
            }
          });
          
          // Если есть маркеры, центрируем карту
          if (markers.length > 0) {
            const bounds = new maplibregl.LngLatBounds();
            markers.forEach(marker => {
              bounds.extend(marker.getLngLat());
            });
            
            map.fitBounds(bounds, { padding: 50 });
          }
          
          // Сообщаем количество маркеров
          window.ReactNativeWebView.postMessage(JSON.stringify({
            event: 'markersUpdated',
            count: markers.length
          }));
        }
        
        function setMapCenter(center, zoom) {
          if (map) {
            map.flyTo({
              center: center,
              zoom: zoom || map.getZoom(),
              essential: true
            });
          }
        }
      </script>
    </body>
    </html>
  `;

  // Обработчик сообщений от WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.event === 'markerClick' && data.propertyId) {
        // Переход на экран деталей объявления
        navigation.navigate('PropertyDetails', { propertyId: data.propertyId });
      } else if (data.event === 'markersUpdated') {
        // Можно обновить счетчик объектов
        console.log(`На карте ${data.count} объектов`);
      } else if (data.event === 'mapLoaded') {
        // Карта загружена, можно отправить данные
        if (webViewRef.current && mapItems) {
          const mapData = {
            action: 'updateMarkers',
            properties: mapItems.map(item => ({
              id: item.id,
              title: item.title,
              price: item.price,
              type: item.type,
              coordinates: item.latitude && item.longitude ? {
                lng: parseFloat(item.longitude),
                lat: parseFloat(item.latitude)
              } : null,
              images: item.images
            }))
          };
          webViewRef.current.postMessage(JSON.stringify(mapData));
        }
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHTML }}
        style={styles.map}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E3A8A" />
          </View>
        )}
      />
      
      {/* Фильтры */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, activeFilter === 'all' && styles.activeFilter]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>
            {t('common.all')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, activeFilter === 'sale' && styles.activeFilter]}
          onPress={() => setActiveFilter('sale')}
        >
          <Text style={[styles.filterText, activeFilter === 'sale' && styles.activeFilterText]}>
            {t('common.sale')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, activeFilter === 'rent' && styles.activeFilter]}
          onPress={() => setActiveFilter('rent')}
        >
          <Text style={[styles.filterText, activeFilter === 'rent' && styles.activeFilterText]}>
            {t('common.rent')}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Кнопка возврата */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  filterContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 5,
    borderRadius: 50,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  activeFilter: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  filterText: {
    fontWeight: '500',
    color: '#1F2937',
  },
  activeFilterText: {
    color: 'white',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default MapScreen;
