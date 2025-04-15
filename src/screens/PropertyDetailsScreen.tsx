import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Linking, ActivityIndicator, FlatList, SafeAreaView, Share, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Property } from '../contexts/PropertyContext';
import { useFavorites } from '../contexts/FavoritesContext';
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
  const { toggleFavorite, isFavorite } = useFavorites();
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

  // Обработка событий изображений и избранного происходит через обработчики событий в JSX

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
      // URL нашего обработчика deep links
      // Он проверит наличие приложения и предложит установить его, если не установлено
      const deeplinkHandlerUrl = `https://domgo-deep-links.windsurf.build?id=${property.id}`;
      
      // Формируем текст для шаринга
      const shareText = `${property.title}\n${property.price}${property.currency || '€'}\n${property.location || ''}\n\nПодробнее в приложении DomGo: ${deeplinkHandlerUrl}`;
      
      // Добавляем цены и другие детали
      const extraInfo = [];
      if (property.area) extraInfo.push(`${property.area} м²`);
      if (property.rooms) extraInfo.push(`${property.rooms} комн.`);
      
      // Полное сообщение для шаринга
      const fullShareText = extraInfo.length > 0 
        ? `${shareText}\n${extraInfo.join(' • ')}` 
        : shareText;
      
      // Вызываем системный диалог шаринга
      await Share.share({
        message: fullShareText,
        // На iOS можно также указать заголовок и URL
        ...(Platform.OS === 'ios' ? { 
          title: 'Поделиться объявлением',
          url: deeplinkHandlerUrl 
        } : {})
      });
      
      console.log('Поделились объявлением:', property.id);
    } catch (error) {
      console.error('Ошибка при шаринге:', error);
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
      body { margin: 0; padding: 0; }
      #map { position: absolute; top: 0; bottom: 0; width: 100%; height: 100%; }
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
    <script>
      function initMap(lat, lng) {
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
        
        map.addControl(new maplibregl.NavigationControl());
        
        const el = document.createElement('div');
        el.className = 'marker';
        
        new maplibregl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map);
          
        // Сообщаем о загрузке карты
        map.on('load', function() {
          window.ReactNativeWebView.postMessage('mapLoaded');
        });
      }
      
      // Отправляем сообщение, что DOM загружен
      window.ReactNativeWebView.postMessage('log:DOM loaded');

      // Сообщаем, что WebView готов
      window.ReactNativeWebView.postMessage('log:WebView ready, sending ready message');
      window.ReactNativeWebView.postMessage('ready');
      
      // Обработчик сообщений для iOS
      window.addEventListener('message', function(e) {
        const data = e.data;
        processMessage(data);
      });
      
      // Обработчик сообщений для Android
      document.addEventListener('message', function(e) {
        const data = e.data;
        processMessage(data);
      });
      
      // Единая функция обработки сообщений
      function processMessage(data) {
        // Проверяем, не вызывалась ли эта функция ранее с этими же данными
        if (window.lastProcessedData === data) {
          return; // Предотвращаем дублирование
        }
        
        window.lastProcessedData = data;
        window.ReactNativeWebView.postMessage('log:Получено сообщение: ' + data);
        
        try {
          const message = JSON.parse(data);
          if (message && message.coords) {
            window.ReactNativeWebView.postMessage('log:Инициализация карты с координатами: ' + JSON.stringify(message.coords));
            initMap(message.coords.lat, message.coords.lng);
          }
        } catch (e) {
          window.ReactNativeWebView.postMessage('log:Ошибка парсинга JSON: ' + e.toString());
        }
      }
      
      // При загрузке страницы уже было отправлено 'ready'
    </script>
  </body>
  </html>
  `;

  // Обработчик сообщений от WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = event.nativeEvent.data;
      
      if (data.startsWith('log:')) {
        // Это логи для отладки
        console.log('Лог из WebView:', data.substring(4));
        return;
      }
      
      console.log('Получено сообщение от WebView:', data);
      
      if (data === 'ready') {
        // WebView готов, отправляем координаты
        console.log('WebView готов, отправляем координаты');
        
        // Добавляем небольшую задержку перед отправкой координат
        setTimeout(() => {
          sendCoordinatesToMap();
        }, 500);
      } else if (data === 'mapLoaded') {
        // Карта загружена
        console.log('Карта успешно загружена');
        setMapLoading(false);
      }
    } catch (error) {
      console.error('Ошибка обработки сообщения от WebView:', error);
    }
  };

  // Отправка координат в WebView
  const sendCoordinatesToMap = useCallback(() => {
    if (!webViewRef.current || !property) {
      return;
    }

    try {
      let lat, lng;
      
      // Пробуем получить координаты из разных источников
      if (property.coordinates) {
        // Из поля coordinates
        if (typeof property.coordinates === 'object') {
          lat = property.coordinates.lat;
          lng = property.coordinates.lng;
        } else if (typeof property.coordinates === 'string') {
          try {
            const coords = JSON.parse(property.coordinates);
            lat = coords.lat;
            lng = coords.lng;
          } catch (e) {
            console.error('Ошибка парсинга координат:', e);
          }
        }
      } else if (property.latitude && property.longitude) {
        // Из прямых полей latitude и longitude
        lat = parseFloat(property.latitude);
        lng = parseFloat(property.longitude);
      }
      
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        console.error('Нет корректных координат для объявления');
        setMapLoading(false);
        return;
      }
      
      // Отправляем сообщение в WebView с координатами
      const message = {
        coords: { lat, lng }
      };
      
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
