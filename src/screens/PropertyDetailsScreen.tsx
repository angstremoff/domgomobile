import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Linking, ActivityIndicator, FlatList, SafeAreaView, Share, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Property, useProperties } from '../contexts/PropertyContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import { propertyService } from '../services/propertyService';
import ImageViewer from '../components/ImageViewer';
import { useTheme } from '../contexts/ThemeContext';
import { WebView } from 'react-native-webview';
import Colors from '../constants/colors';
import { showErrorAlert } from '../utils/alertUtils';

const { width } = Dimensions.get('window');

// Простые типы без сложной структуры
type RouteParams = {
  params: {
    propertyId: string;
  };
};

const PropertyDetailsScreen = ({ route, navigation }: { route: RouteParams; navigation: any }) => {
  // Получаем ID объявления из параметров навигации
  const { propertyId } = route.params;
  const { t } = useTranslation();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { properties } = useProperties();
  const { darkMode } = useTheme();
  const theme = darkMode ? Colors.dark : Colors.light;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const webViewRef = useRef<WebView>(null);

  // Проверяем, есть ли объявление в контексте, если нет - загружаем с сервера
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const data = await propertyService.getPropertyById(propertyId);
        if (data) {
          setProperty(data);
        }
      } catch (error) {
        console.log('(NOBRIDGE) ERROR ', 'Ошибка загрузки данных объявления:', error);
        showErrorAlert(t('common.errorLoadingData'));
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  // Функция для открытия полноэкранного просмотра фото
  const openImageViewer = (index: number) => {
    setActiveImageIndex(index);
    setIsViewerVisible(true);
  };
  
  // Функция для закрытия полноэкранного просмотра фото
  const closeImageViewer = () => {
    setIsViewerVisible(false);
  };

  // Прокрутка к определенному изображению в карусели
  const scrollToImage = (index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true
      });
    }
    setActiveImageIndex(index);
  };

  // Функция для проверки и переключения избранного
  const handleToggleFavorite = () => {
    if (property) {
      toggleFavorite(property.id);
    }
  };

  // Обработка события скролла для определения активного изображения
  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.floor(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== activeImageIndex) {
      setActiveImageIndex(index);
    }
  };
  
  // Функция поделиться объявлением
  const handleShare = async () => {
    if (!property) return;
    
    try {
      // Формируем текст для шаринга
      const shareText = `${property.title}\n${property.price}${property.currency || '€'}\n${property.location || ''}\n\nПодробнее в приложении DomGo`;
      
      // Вызываем системный диалог шаринга
      await Share.share({
        message: shareText,
        // На iOS можно также указать заголовок
        ...(Platform.OS === 'ios' ? { title: 'Поделиться объявлением' } : {})
      });
    } catch (error) {
      console.error('Ошибка при шаринге:', error);
    }
  };

  // Обработчик нажатия на номер телефона
  const handleCall = (phoneNumber: string) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  // HTML-код для карты с использованием MapLibre GL
  const mapHTML = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link href="https://cdn.jsdelivr.net/npm/maplibre-gl@2.4.0/dist/maplibre-gl.css" rel="stylesheet" />
    <script src="https://cdn.jsdelivr.net/npm/maplibre-gl@2.4.0/dist/maplibre-gl.js"></script>
    <style>
      body { margin: 0; padding: 0; overflow: hidden; }
      #map { position: absolute; top: 0; bottom: 0; width: 100%; height: 100%; }
      #log { 
        position: absolute; 
        bottom: 10px; 
        left: 10px; 
        z-index: 999; 
        background: rgba(255,255,255,0.8); 
        padding: 5px; 
        font-size: 12px; 
        max-width: 80%; 
        max-height: 100px; 
        overflow: auto; 
        display: none; 
      }
      .marker {
        width: 25px;
        height: 25px;
        border-radius: 50%;
        background-color: #3B82F6;
        border: 3px solid white;
        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <div id="log"></div>
    <script>
      // Функция для логирования
      function log(message) {
        try {
          const logElement = document.getElementById('log');
          logElement.style.display = 'block';
          logElement.innerHTML += '<div>' + message + '</div>';
          console.log(message);
          // Отправляем лог в React Native
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage('log:' + message);
          }
        } catch (e) {
          console.error('Error in log function:', e);
        }
      }

      // Инициализация карты
      function initMap(lat, lng) {
        try {
          log('Initializing map with coords: ' + lat + ', ' + lng);
          if (!maplibregl) {
            log('Error: maplibregl is not defined');
            return;
          }
          
          const map = new maplibregl.Map({
            container: 'map',
            style: {
              version: 8,
              sources: {
                'osm': {
                  type: 'raster',
                  tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                  tileSize: 256
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
            center: [lng, lat],
            zoom: 15
          });
          
          log('Map object created');
          
          map.addControl(new maplibregl.NavigationControl());
          
          const el = document.createElement('div');
          el.className = 'marker';
          
          new maplibregl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map);
          
          log('Marker added to map');
          
          // Сообщаем о загрузке карты
          map.on('load', function() {
            log('Map loaded');
            window.ReactNativeWebView.postMessage('mapLoaded');
          });
          
          map.on('error', function(e) {
            log('Map error: ' + JSON.stringify(e));
          });
        } catch (e) {
          log('Error initializing map: ' + e.toString());
        }
      }
      
      // Слушаем сообщения от React Native
      window.addEventListener('message', function(e) {
        try {
          log('Received message: ' + e.data);
          const message = JSON.parse(e.data);
          if (message && message.coords) {
            log('Parsed coordinates: ' + message.coords.lat + ', ' + message.coords.lng);
            initMap(message.coords.lat, message.coords.lng);
          }
        } catch (e) {
          log('Error parsing message: ' + e.toString());
        }
      });
      
      // Сообщаем, что страница загружена
      document.addEventListener('DOMContentLoaded', function() {
        log('DOM loaded');
        setTimeout(function() {
          if (window.ReactNativeWebView) {
            log('WebView ready, sending ready message');
            window.ReactNativeWebView.postMessage('ready');
          } else {
            log('ReactNativeWebView is not available');
          }
        }, 500);
      });
      
      // Дополнительная проверка, если DOMContentLoaded уже сработал
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        log('Document already loaded');
        setTimeout(function() {
          if (window.ReactNativeWebView) {
            log('WebView ready (from direct check), sending ready message');
            window.ReactNativeWebView.postMessage('ready');
          } else {
            log('ReactNativeWebView is not available (from direct check)');
          }
        }, 500);
      }
    </script>
  </body>
  </html>
  `;

  // Обработчик сообщений от WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = event.nativeEvent.data;
      console.log('Получено сообщение от WebView:', data);
      
      // Обработка логов из WebView
      if (data.startsWith('log:')) {
        console.log('Лог из WebView:', data.substring(4));
        return;
      }
      
      if (data === 'ready') {
        // WebView готов, отправляем координаты
        console.log('WebView готов, отправляем координаты');
        setTimeout(() => {
          sendCoordinatesToMap();
        }, 500); // Добавляем задержку перед отправкой координат
      } else if (data === 'mapLoaded') {
        // Карта загружена
        console.log('Карта загружена');
        setMapLoading(false);
      }
    } catch (error) {
      console.error('Ошибка обработки сообщения от WebView:', error);
    }
  };

  // Отправка координат в WebView
  const sendCoordinatesToMap = useCallback(() => {
    if (!webViewRef.current || !property) {
      console.log('Нет ссылки на webView или нет данных объявления');
      return;
    }

    try {
      let lat, lng;
      
      // Дебаг: выводим все данные о координатах
      console.log('Данные координат:', {
        coordinates: property.coordinates,
        coordinatesType: typeof property.coordinates,
        latitude: property.latitude,
        longitude: property.longitude
      });
      
      // Пробуем получить координаты из разных источников
      if (property.coordinates) {
        // Из поля coordinates
        if (typeof property.coordinates === 'object') {
          // Если координаты уже как объект
          console.log('Координаты как объект:', property.coordinates);
          lat = property.coordinates.lat;
          lng = property.coordinates.lng;
        } else if (typeof property.coordinates === 'string') {
          // Если координаты как строка JSON
          console.log('Координаты как строка:', property.coordinates);
          try {
            const coords = JSON.parse(property.coordinates);
            console.log('Распарсенные координаты:', coords);
            lat = coords.lat;
            lng = coords.lng;
          } catch (e) {
            console.error('Ошибка парсинга координат:', e);
          }
        }
      } else if (property.latitude && property.longitude) {
        // Из прямых полей latitude и longitude
        console.log('Используем прямые поля latitude/longitude:', { 
          lat: property.latitude, 
          lng: property.longitude 
        });
        lat = parseFloat(property.latitude);
        lng = parseFloat(property.longitude);
      }
      
      // Проверка наличия корректных координат
      console.log('Финальные координаты для карты:', { lat, lng });
      
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        console.error('Нет корректных координат для объявления');
        setMapLoading(false);
        return;
      }
      
      // Отправляем сообщение в WebView с координатами
      const message = {
        coords: { lat, lng }
      };
      
      console.log('Отправляем координаты в WebView:', message);
      webViewRef.current.postMessage(JSON.stringify(message));
    } catch (error) {
      console.error('Ошибка отправки координат:', error);
      setMapLoading(false);
    }
  }, [property]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>{t('property.notFound')}</Text>
      </View>
    );
  }

  // Определяем отображаемые тексты для типа недвижимости и типа сделки
  const propertyTypeText = property.property_type ? t(`property.${property.property_type.toLowerCase()}`) : '';
  const dealTypeText = property.type === 'rent' ? t('property.rent') : t('property.sale');

  // Формируем полный адрес
  const cityName = property.city?.name || '';
  // Получаем переведенное название города
  const translatedCityName = cityName ? t(`cities.${cityName}`, cityName) : '';
  const streetName = property.location || property.address || '';
  const fullAddress = translatedCityName && streetName ? `${translatedCityName}, ${streetName}` : translatedCityName || streetName;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        {/* Карусель изображений */}
        <View style={styles.imageContainer}>
          <FlatList
            ref={flatListRef}
            data={property.images || []}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            renderItem={({ item, index }) => (
              <TouchableOpacity style={styles.imageItem} onPress={() => setIsViewerVisible(true)}>
                <Image
                  source={{ uri: item }}
                  style={styles.propertyImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
            keyExtractor={(_, index) => `image-${index}`}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
          />
          
          {/* Тэги типа объявления */}
          <View style={styles.tagContainer}>
            <View style={[styles.typeTag, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.typeTagText}>{dealTypeText}</Text>
            </View>
            
            {propertyTypeText && (
              <View style={[styles.propertyTypeTag, { backgroundColor: '#2196F3' }]}>
                <Text style={styles.typeTagText}>{propertyTypeText}</Text>
              </View>
            )}
          </View>
          
          {/* Индикаторы пагинации */}
          {(property.images || []).length > 1 && (
            <View style={styles.dotsContainer}>
              {(property.images || []).map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.dot, 
                    activeImageIndex === index ? styles.activeDot : null
                  ]} 
                />
              ))}
            </View>
          )}
          
          {/* Кнопка избранного */}
          <TouchableOpacity 
            style={styles.favoriteButton} 
            onPress={() => toggleFavorite(property.id)}
          >
            <Ionicons 
              name={isFavorite(property.id) ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite(property.id) ? "#E91E63" : "#FFFFFF"} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Основная информация о объекте */}
        <View style={[styles.detailsContainer, { backgroundColor: theme.card }]}>
          {/* Цена и заголовок */}
          <Text style={[styles.price, { color: theme.primary }]}>
            {property.price}€{property.type === 'rent' ? ` / ${t('property.month')}` : ''}
          </Text>
          
          <Text style={[styles.title, { color: theme.text }]}>
            {property.title}
          </Text>
          
          {/* Адрес */}
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color={theme.secondary} />
            <Text style={[styles.location, { color: theme.secondary }]}>
              {fullAddress}
            </Text>
          </View>
          
          {/* Характеристики */}
          <View style={styles.statsRow}>
            {property.area && (
              <View style={styles.statItem}>
                <Ionicons name="cube-outline" size={18} color={theme.primary} />
                <Text style={[styles.statValue, { color: theme.text }]}>{property.area} м²</Text>
              </View>
            )}
            
            {property.rooms && (
              <View style={styles.statItem}>
                <Ionicons name="bed-outline" size={18} color={theme.primary} />
                <Text style={[styles.statValue, { color: theme.text }]}>{property.rooms} {t('property.rooms')}</Text>
              </View>
            )}
            
            {property.type && (
              <View style={styles.statItem}>
                <Ionicons name="home-outline" size={18} color={theme.primary} />
                <Text style={[styles.statValue, { color: theme.text }]}>{t(`property.${property.type}`)}</Text>
              </View>
            )}
          </View>
          
          {/* Описание */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('property.description')}</Text>
            <Text style={[styles.description, { color: theme.text }]}>{property.description}</Text>
          </View>
          
          {/* Карта */}
          {property && property.coordinates && (
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('property.location')}</Text>
              
              <TouchableOpacity 
                style={[styles.mapToggleButton, { backgroundColor: theme.primary }]}
                onPress={() => setShowMap(!showMap)}
              >
                <Ionicons name="map-outline" size={18} color="#FFFFFF" />
                <Text style={styles.buttonText}>
                  {showMap ? t('property.hideMap') : t('property.showMap')}
                </Text>
              </TouchableOpacity>
              
              {showMap && (
                <View style={styles.mapContainer}>
                  <WebView
                    ref={webViewRef}
                    originWhitelist={['*']}
                    source={{ html: mapHTML }}
                    style={styles.map}
                    onMessage={handleWebViewMessage}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                  />
                  {mapLoading && (
                    <View style={styles.mapLoadingContainer}>
                      <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
          
          {/* Информация о контакте */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('property.contact')}</Text>
            
            {/* Строка с именем контакта и кнопкой/номером */}
            <View style={styles.contactRow}>
              {/* Имя контакта - слева */}
              {property.user?.name && (
                <Text style={[styles.contactName, { color: theme.text }]}>
                  {property.user?.name}
                </Text>
              )}

              {/* Кнопка показать номер или сам номер - справа */}
              {(property.user?.phone || property.contact?.phone) && (
                !showPhoneNumber ? (
                  <TouchableOpacity 
                    style={[styles.phoneButton, { backgroundColor: theme.primary }]}
                    onPress={() => setShowPhoneNumber(true)}
                  >
                    <Ionicons name="eye-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.buttonText}>{t('property.showPhone')}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.phoneButton, { backgroundColor: theme.primary }]}>
                    <View style={styles.phoneNumberBlock}>
                      <TouchableOpacity 
                        style={styles.iconButton}
                        onPress={() => Linking.openURL(`tel:${property.user?.phone || property.contact?.phone}`)}
                      >
                        <Ionicons name="call-outline" size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                      <Text style={styles.phoneNumberText} numberOfLines={1} adjustsFontSizeToFit>
                        {property.user?.phone || property.contact?.phone}
                      </Text>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => Linking.openURL(`sms:${property.user?.phone || property.contact?.phone}`)}
                      >
                        <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              )}
            </View>

            {/* Кнопка поделиться */}
            <TouchableOpacity 
              style={[styles.shareButton, { backgroundColor: theme.primary }]}
              onPress={handleShare}
            >
              <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>{t('property.share')}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
      
      {/* Просмотрщик изображений */}
      <ImageViewer 
        images={property.images || []} 
        visible={isViewerVisible} 
        initialIndex={activeImageIndex}
        onClose={() => setIsViewerVisible(false)}
        darkMode={darkMode}
      />
    </SafeAreaView>
  );
};

// Стили
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  imageItem: {
    width: width,
    height: 300,
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  tagContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
  },
  typeTag: {
    padding: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  propertyTypeTag: {
    padding: 6,
    borderRadius: 4,
  },
  typeTagText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 12,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -16,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  location: {
    marginLeft: 6,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    marginLeft: 6,
    fontSize: 14,
  },
  sectionContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  mapContainer: {
    height: 200,
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
  },
  phoneButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneNumberBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneNumberText: {
    color: '#FFFFFF',
    marginHorizontal: 8,
    fontSize: 14,
    maxWidth: 120,
  },
  iconButton: {
    padding: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  shareButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PropertyDetailsScreen;
