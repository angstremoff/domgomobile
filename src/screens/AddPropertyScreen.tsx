import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput,
  StyleSheet, 
  ScrollView, 
  Switch, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Platform, 
  KeyboardAvoidingView,
  Modal,
  FlatList
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { compressImage } from '../utils/imageCompression';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useProperties } from '../contexts/PropertyContext';
import { supabase } from '../lib/supabaseClient';
import { propertyService } from '../services/propertyService';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/colors';
import MapCoordinateSelector from '../components/MapCoordinateSelector';
import { showErrorAlert, showSuccessAlert } from '../utils/alertUtils';

interface City {
  id: string;
  name: string;
  latitude?: string;
  longitude?: string;
}

// Список возможных особенностей
const FEATURES = [
  { id: 'parking', name: 'Парковка' },
  { id: 'balcony', name: 'Балкон' },
  { id: 'elevator', name: 'Лифт' },
  { id: 'furniture', name: 'Мебель' },
];

const AddPropertyScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const { darkMode } = useTheme();
  const theme = darkMode ? Colors.dark : Colors.light;
  const { invalidateCache } = useProperties(); // Получаем функцию обновления кэша
  
  // Добавляем состояния для имени и телефона пользователя
  const [userData, setUserData] = useState({
    name: '',
    phone: ''
  });
  
  // Форма по аналогии с веб-версией
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState(''); // location вместо address как в веб-версии
  const [area, setArea] = useState('');
  const [rooms, setRooms] = useState('');
  const [cityId, setCityId] = useState<string>('0'); // По умолчанию 0, как в веб-версии
  const [propertyType, setPropertyType] = useState<'sale' | 'rent'>('sale');
  const [propertyCategory, setPropertyCategory] = useState('apartment');
  const [images, setImages] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Состояние для модальных окон
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [selectedCityName, setSelectedCityName] = useState(t('common.selectCity'));
  const [selectedCity, setSelectedCity] = useState<any>(null);
  
  const [propertyTypeModalVisible, setPropertyTypeModalVisible] = useState(false);
  const [selectedPropertyTypeName, setSelectedPropertyTypeName] = useState(t('property.sale'));
  
  const [propertyCategoryModalVisible, setPropertyCategoryModalVisible] = useState(false);
  const [selectedPropertyCategoryName, setSelectedPropertyCategoryName] = useState(t('property.apartment'));

  useEffect(() => {
    // Загрузка списка городов при монтировании компонента
    const fetchCities = async () => {
      try {
        const { data: cities, error } = await supabase
          .from('cities')
          .select('*');

        if (error) {
          console.error('Error fetching cities:', error);
          return;
        }

        if (cities) {
          // Добавляем фиксированные координаты для городов в тестовых целях
          const citiesWithCoordinates = cities.map(city => ({
            ...city,
            latitude: city.latitude || '45.267136',
            longitude: city.longitude || '19.833549'
          }));
          
          console.log('Cities with coordinates:', citiesWithCoordinates);
          setCities(citiesWithCoordinates);
        }
      } catch (error) {
        console.error('Error in fetchCities:', error);
      }
    };

    fetchCities();
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('name, phone')
          .eq('id', user.id)
          .single();
          
        if (data) {
          setUserData({
            name: data.name || '',
            phone: data.phone || ''
          });
        }
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных пользователя:', error);
    }
  };

  // Проверяем, авторизован ли пользователь
  if (!user) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t('common.loginRequired')}</Text>
        <TouchableOpacity 
          style={[styles.loginButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>{t('common.login')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prevFeatures => {
      if (prevFeatures.includes(featureId)) {
        return prevFeatures.filter(id => id !== featureId);
      } else {
        return [...prevFeatures, featureId];
      }
    });
  };

  const pickImage = async () => {
    if (images.length >= 10) {
      showErrorAlert(t('addProperty.validation.maxPhotosReached'));
      return;
    }
    
    try {
      // Запрашиваем разрешения, если это необходимо
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showErrorAlert(t('property.errors.permissionDenied'));
          return;
        }
      }
      
      // Запускаем выбор изображения
      console.log('Запускаем выбор изображения...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: false,
      });
      
      console.log('Результат выбора изображения:', JSON.stringify(result, null, 2));
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingImages(true);
        try {
          const asset = result.assets[0];
          console.log('Выбранное изображение:', asset.uri);
          console.log('Тип файла:', asset.mimeType);
          console.log('Размер файла:', asset.fileSize ? `${asset.fileSize} байт` : 'неизвестно');
          
          // Сжимаем изображение
          console.log('Начинаем сжатие изображения...');
          const compressedImage = await compressImage(asset.uri);
          console.log('Изображение сжато:', compressedImage.uri);
          
          // Добавляем в массив URI из локального хранилища для отображения
          setImages(prev => [...prev, compressedImage.uri]);
          console.log('Изображение добавлено в список');
          
        } catch (error) {
          console.error('Ошибка при сжатии или добавлении изображения:', error);
          showErrorAlert(t('property.errors.imageUploadFailed'));
        } finally {
          setUploadingImages(false);
        }
      } else {
        console.log('Выбор изображения отменен или не выбрано ни одного изображения');
      }
    } catch (error) {
      console.error('Ошибка при выборе изображения:', error);
      showErrorAlert(t('property.errors.imageSelectFailed'));
      setUploadingImages(false);
    }
  };

  const handleSubmit = async () => {
    // Проверка на обязательные поля
    if (!title || !price || !area || !rooms || !location || !description) {
      showErrorAlert(t('addProperty.validation.fillAllFields'));
      return;
    }

    // Проверка на имя пользователя
    if (!userData.name.trim()) {
      showErrorAlert(t('profile.errors.nameRequired'));
      return;
    }
    
    // Проверка на телефон пользователя
    if (!userData.phone.trim()) {
      showErrorAlert(t('profile.errors.phoneRequired'));
      return;
    }
    
    // Проверка на загрузку изображений
    if (uploadingImages) {
      showErrorAlert(t('addProperty.validation.waitForPhotos'));
      return;
    }
    
    // Проверка на наличие хотя бы одного изображения
    if (images.length === 0) {
      showErrorAlert(t('addProperty.validation.addAtLeastOnePhoto'));
      return;
    }

    try {
      setLoading(true);
      
      // Проверка лимита объявлений (максимум 20)
      try {
        const userPropertiesCount = await propertyService.getUserPropertiesCount();
        if (userPropertiesCount >= 20) {
          showErrorAlert(t('property.errors.maxPropertiesReached'));
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Ошибка при проверке количества объявлений:', error);
      }
      
      // Сохраняем данные пользователя
      try {
        if (user) {
          const { error: profileError } = await supabase
            .from('users')
            .upsert({
              id: user.id,
              email: user.email,
              name: userData.name,
              phone: userData.phone
            }, { onConflict: 'id' });

          if (profileError) {
            console.error('Ошибка при обновлении профиля:', profileError);
            throw profileError;
          }
        }
      } catch (error) {
        console.error('Ошибка при сохранении данных пользователя:', error);
        showErrorAlert(t('profile.errors.saveFailed'));
        setLoading(false);
        return;
      }
      
      // Теперь загружаем фотографии на сервер
      const uploadedImageUrls = [];
      setUploadingImages(true);
      
      try {
        console.log(`Начинаем загрузку ${images.length} изображений...`);
        
        for (let i = 0; i < images.length; i++) {
          const imageUri = images[i];
          
          try {
            console.log(`Загрузка изображения ${i+1}/${images.length}: ${imageUri}`);
            
            // Получаем расширение файла
            const uriParts = imageUri.split('.');
            const imageExtension = uriParts.length > 1 
              ? uriParts[uriParts.length - 1].toLowerCase() 
              : 'jpg';
              
            const imageName = `property_${Date.now()}_${i}.${imageExtension}`;
            
            // Проверяем, что расширение файла допустимо
            const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];
            if (!validExtensions.includes(imageExtension)) {
              console.error('Недопустимое расширение файла:', imageExtension);
              // Используем jpg как запасной вариант
              console.log('Используем jpg как запасной вариант');
            }
            
            // Используем метод из propertyService для загрузки изображения
            console.log('Вызываем propertyService.uploadImage...');
            const imageUrl = await propertyService.uploadImage(imageUri, imageName);
            
            uploadedImageUrls.push(imageUrl);
            console.log(`Изображение ${i+1}/${images.length} успешно загружено:`, imageUrl);
          } catch (imageError: any) {
            console.error(`Ошибка при загрузке изображения ${i+1}/${images.length}:`, imageError);
            showErrorAlert(`${t('property.errors.imageUploadFailed')} (${i+1}/${images.length}): ${imageError.message || 'Неизвестная ошибка'}`);
            setLoading(false);
            setUploadingImages(false);
            return;
          }
        }
        
        console.log('Все изображения успешно загружены:', uploadedImageUrls);
      } catch (error: any) {
        console.error('Общая ошибка при загрузке изображений:', error);
        showErrorAlert(`${t('property.errors.imageUploadFailed')}: ${error.message || 'Неизвестная ошибка'}`);
        setLoading(false);
        setUploadingImages(false);
        return;
      } finally {
        setUploadingImages(false);
      }
      
      // Создаем объект с данными объявления
      const result = await propertyService.createProperty({
        title,
        description,
        price: Number(price),
        type: propertyType,
        property_type: propertyCategory,
        area: Number(area),
        rooms: Number(rooms),
        location,
        city_id: cityId !== '0' ? Number(cityId) : undefined,
        features: selectedFeatures,
        images: uploadedImageUrls,
        status: 'active', // по умолчанию активно
        user_id: user.id, // ID пользователя
        // Поле user удалено, так как его нет в таблице properties
        // Передаем координаты как объект, а не как строку JSON
        coordinates: coordinates || null,
      });

      if (result.success) {
        // Принудительно очищаем кэш и перезагружаем данные
        await invalidateCache();
        console.log('Кэш объявлений очищен после создания нового объявления');
        
        resetForm();
        // Показываем уведомление и переходим на страницу с моими объявлениями
        showSuccessAlert(t('addProperty.success'), () => {
          navigation.navigate('MyProperties');
        });
      } else {
        showErrorAlert(t('addProperty.failure'));
      }
    } catch (error) {
      console.error('Ошибка при создании объявления:', error);
      showErrorAlert(t('property.errors.createFailed'));
    } finally {
      setLoading(false);
    }
  };
  
  // Функция для сброса формы
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setArea('');
    setRooms('');
    setLocation('');
    setPropertyType('sale');
    setPropertyCategory('apartment');
    setCityId('0');
    setSelectedFeatures([]);
    setImages([]);
  };

  const removeImage = (index: number) => {
    setImages(prevImages => {
      const newImages = [...prevImages];
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // Валидация ввода только цифр
  const validateNumericInput = (value: string) => {
    return value === '' || /^\d+$/.test(value);
  };

  // Обработчики для числовых полей
  const handlePriceChange = (value: string) => {
    if (validateNumericInput(value)) {
      setPrice(value);
    }
  };

  const handleAreaChange = (value: string) => {
    if (validateNumericInput(value)) {
      setArea(value);
    }
  };

  const handleRoomsChange = (value: string) => {
    if (validateNumericInput(value)) {
      setRooms(value);
    }
  };

  // Функция для выбора города
  const selectCity = (id: string, name: string) => {
    console.log('selectCity called with id:', id, 'name:', name);
    setCityId(id);
    setSelectedCityName(name);
    setCityModalVisible(false);
    
    // Задаем координаты вручную для известных городов на основе их ID
    let cityCoords = null;
    
    // Координаты городов из базы данных
    switch(id) {
      case '1': // Белград
        cityCoords = { lat: 44.787197, lng: 20.457273 };
        break;
      case '2': // Нови-Сад
        cityCoords = { lat: 45.251667, lng: 19.836944 };
        break;
      case '3': // Ниш
        cityCoords = { lat: 43.320904, lng: 21.895514 };
        break;
      case '4': // Крагуевац
        cityCoords = { lat: 44.012794, lng: 20.926773 };
        break;
      case '5': // Суботица
        cityCoords = { lat: 46.100376, lng: 19.666641 };
        break;
      case '11': // Лозница
        cityCoords = { lat: 44.533329, lng: 19.223273 };
        break;
      default:
        // Дефолтные координаты для неизвестных городов
        cityCoords = { lat: 45.267136, lng: 19.833549 };
    }
    
    // Создаем объект города с координатами
    const cityObject = {
      id: id,
      name: name,
      latitude: cityCoords.lat.toString(),
      longitude: cityCoords.lng.toString()
    };
    
    console.log('Created city object with coordinates:', cityObject);
    setSelectedCity(cityObject);
    setCoordinates(cityCoords);
  };
  
  // Функция для выбора типа сделки
  const selectPropertyType = (type: 'sale' | 'rent', name: string) => {
    setPropertyType(type);
    setSelectedPropertyTypeName(name);
    setPropertyTypeModalVisible(false);
  };
  
  // Функция для выбора типа недвижимости
  const selectPropertyCategory = (category: string, name: string) => {
    setPropertyCategory(category);
    setSelectedPropertyCategoryName(name);
    setPropertyCategoryModalVisible(false);
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          )}
          
          <Text style={[styles.sectionTitle, { color: theme.headerText }]}>{t('addProperty.contactInfo')}</Text>
          
          <Text style={[styles.label, { color: theme.text }]}>{t('addProperty.form.name')}</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.cardBackground,
              color: theme.text,
              borderColor: theme.border,
              borderWidth: 1
            }]}
            value={userData.name}
            onChangeText={(text) => setUserData({ ...userData, name: text })}
            placeholder={t('addProperty.form.namePlaceholder')}
            placeholderTextColor={theme.secondary}
          />
          
          <Text style={[styles.label, { color: theme.text }]}>{t('addProperty.form.phone')}</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.cardBackground,
              color: theme.text,
              borderColor: theme.border,
              borderWidth: 1
            }]}
            value={userData.phone}
            onChangeText={(text) => setUserData({ ...userData, phone: text })}
            placeholder={t('addProperty.form.phonePlaceholder')}
            placeholderTextColor={theme.secondary}
            keyboardType="phone-pad"
          />
          
          <Text style={[styles.sectionTitle, { color: theme.headerText }]}>{t('addProperty.basicInfo')}</Text>
          
          <Text style={[styles.label, { color: theme.text }]}>{t('addProperty.form.type')}</Text>
          <TouchableOpacity 
            style={[styles.pickerButton, { 
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
              borderWidth: 1,
            }]}
            onPress={() => setPropertyTypeModalVisible(true)}
          >
            <Text style={[styles.pickerButtonText, { color: theme.text }]}>
              {selectedPropertyTypeName}
            </Text>
            <Ionicons name="chevron-down" size={24} color={theme.text} />
          </TouchableOpacity>
          
          {/* Модальное окно для выбора типа сделки */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={propertyTypeModalVisible}
            onRequestClose={() => setPropertyTypeModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: darkMode ? '#333333' : '#FFFFFF' }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {t('addProperty.form.selectType')}
                </Text>
                
                <FlatList
                  data={[
                    { id: 'sale', name: t('property.sale') },
                    { id: 'rent', name: t('property.rent') }
                  ]}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.cityItem, propertyType === item.id && { backgroundColor: theme.primary + '33' }]}
                      onPress={() => selectPropertyType(item.id as 'sale' | 'rent', item.name)}
                    >
                      <Text style={[styles.cityItemText, { color: darkMode ? '#FFFFFF' : '#000000' }]}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
                
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: theme.primary }]}
                  onPress={() => setPropertyTypeModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          
          <Text style={[styles.label, { color: theme.text }]}>{t('addProperty.form.propertyType')}</Text>
          <TouchableOpacity 
            style={[styles.pickerButton, { 
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
              borderWidth: 1,
            }]}
            onPress={() => setPropertyCategoryModalVisible(true)}
          >
            <Text style={[styles.pickerButtonText, { color: theme.text }]}>
              {selectedPropertyCategoryName}
            </Text>
            <Ionicons name="chevron-down" size={24} color={theme.text} />
          </TouchableOpacity>
          
          {/* Модальное окно для выбора типа недвижимости */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={propertyCategoryModalVisible}
            onRequestClose={() => setPropertyCategoryModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: darkMode ? '#333333' : '#FFFFFF' }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {t('addProperty.form.selectPropertyType')}
                </Text>
                
                <FlatList
                  data={[
                    { id: 'apartment', name: t('property.apartment') },
                    { id: 'house', name: t('property.house') },
                    { id: 'commercial', name: t('property.commercial') },
                    { id: 'land', name: t('property.land') }
                  ]}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.cityItem, propertyCategory === item.id && { backgroundColor: theme.primary + '33' }]}
                      onPress={() => selectPropertyCategory(item.id, item.name)}
                    >
                      <Text style={[styles.cityItemText, { color: darkMode ? '#FFFFFF' : '#000000' }]}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
                
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: theme.primary }]}
                  onPress={() => setPropertyCategoryModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Text style={[styles.label, { color: theme.text }]}>{t('addProperty.form.title')}</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.cardBackground,
              color: theme.text,
              borderColor: theme.border,
              borderWidth: 1
            }]}
            value={title}
            onChangeText={setTitle}
            placeholder={t('addProperty.form.titlePlaceholder')}
            placeholderTextColor={theme.secondary}
          />

          <Text style={[styles.label, { color: theme.text }]}>{t('addProperty.form.price')} {propertyType === 'rent' ? `(${t('addProperty.form.pricePerMonth')})` : ''}</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.cardBackground,
              color: theme.text,
              borderColor: theme.border,
              borderWidth: 1
            }]}
            value={price}
            onChangeText={handlePriceChange}
            placeholder={t('addProperty.form.pricePlaceholder')}
            placeholderTextColor={theme.secondary}
            keyboardType="numeric"
          />
          
          <Text style={[styles.sectionTitle, { color: theme.headerText }]}>{t('addProperty.location')}</Text>
          
          <Text style={[styles.label, { color: theme.text }]}>{t('addProperty.form.city')}</Text>
          <TouchableOpacity 
            style={[styles.pickerButton, { 
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
              borderWidth: 1,
            }]}
            onPress={() => setCityModalVisible(true)}
          >
            <Text style={[styles.pickerButtonText, { color: theme.text }]}>
              {selectedCityName}
            </Text>
            <Ionicons name="chevron-down" size={24} color={theme.text} />
          </TouchableOpacity>
          
          {/* Модальное окно для выбора города */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={cityModalVisible}
            onRequestClose={() => setCityModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: darkMode ? '#333333' : '#FFFFFF' }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {t('property.addProperty.selectCity')}
                </Text>
                
                <FlatList
                  data={[{ id: '0', name: t('common.selectCity') }, ...cities]}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.cityItem, cityId === item.id && { backgroundColor: theme.primary + '33' }]}
                      onPress={() => selectCity(item.id.toString(), item.name)}
                    >
                      <Text style={[styles.cityItemText, { color: darkMode ? '#FFFFFF' : '#000000' }]}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
                
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: theme.primary }]}
                  onPress={() => setCityModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Text style={[styles.label, { color: theme.text }]}>{t('addProperty.form.address')}</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.cardBackground,
              color: theme.text,
              borderColor: theme.border,
              borderWidth: 1
            }]}
            value={location}
            onChangeText={setLocation}
            placeholder={t('addProperty.form.addressPlaceholder')}
            placeholderTextColor={theme.secondary}
          />
          
          {/* Выбор координат на карте */}
          {cityId !== '0' && (
            <>
              {/* Отладочная информация */}
              {console.log('Rendering MapCoordinateSelector with:', {
                selectedCity,
                coordinates,
                cityId,
                cityName: selectedCityName
              })}
              <MapCoordinateSelector
                selectedCity={selectedCity || null}
                initialCoordinates={coordinates}
                onCoordinatesSelect={(coords) => {
                  console.log('Coordinates selected:', coords);
                  setCoordinates(coords);
                }}
              />
            </>
          )}
          
          <Text style={[styles.sectionTitle, { color: theme.headerText }]}>{t('addProperty.details')}</Text>

          <Text style={[styles.label, { color: theme.text }]}>{t('addProperty.form.area')}</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.cardBackground,
              color: theme.text,
              borderColor: theme.border,
              borderWidth: 1
            }]}
            value={area}
            onChangeText={handleAreaChange}
            placeholder={t('addProperty.form.areaPlaceholder')}
            placeholderTextColor={theme.secondary}
            keyboardType="numeric"
          />

          <Text style={[styles.label, { color: theme.text }]}>{t('addProperty.form.rooms')}</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.cardBackground,
              color: theme.text,
              borderColor: theme.border,
              borderWidth: 1
            }]}
            value={rooms}
            onChangeText={handleRoomsChange}
            placeholder={t('addProperty.form.roomsPlaceholder')}
            placeholderTextColor={theme.secondary}
            keyboardType="numeric"
          />

          <Text style={[styles.label, { color: theme.text }]}>{t('addProperty.form.description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea, { 
              backgroundColor: theme.cardBackground,
              color: theme.text,
              borderColor: theme.border,
              borderWidth: 1
            }]}
            value={description}
            onChangeText={setDescription}
            placeholder={t('addProperty.form.descriptionPlaceholder')}
            placeholderTextColor={theme.secondary}
            multiline
            textAlignVertical="top"
          />
          
          <Text style={[styles.sectionTitle, { color: theme.headerText }]}>{t('addProperty.features')}</Text>
          
          <View style={styles.featuresContainer}>
            {FEATURES.map(feature => (
              <View key={feature.id} style={styles.featureItem}>
                <Switch
                  value={selectedFeatures.includes(feature.id)}
                  onValueChange={() => toggleFeature(feature.id)}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={selectedFeatures.includes(feature.id) ? theme.primary : theme.secondary}
                />
                <Text style={[styles.featureText, { color: theme.text }]}>{t(`features.${feature.id}`)}</Text>
              </View>
            ))}
          </View>
          
          <Text style={[styles.sectionTitle, { color: theme.headerText }]}>{t('addProperty.photos')}</Text>
          
          <TouchableOpacity 
            style={[styles.uploadButton, { backgroundColor: theme.primary }]}
            onPress={pickImage}
            disabled={uploadingImages}
          >
            {uploadingImages ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.uploadButtonText}>{t('addProperty.form.uploadPhoto')}</Text>
            )}
          </TouchableOpacity>
          
          <Text style={[styles.photoNote, { color: theme.secondary }]}>
            {t('addProperty.form.maxPhotos', { count: 10 })} ({images.length}/10)
          </Text>
          
          {images.length > 0 && (
            <View style={styles.imagesContainer}>
              {images.map((image, index) => (
                <View key={index} style={[styles.imageWrapper, { borderColor: theme.border }]}>
                  <Image 
                    source={{ uri: image }} 
                    style={styles.propertyImage} 
                  />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={theme.notification} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity 
            style={[
              styles.submitButton, 
              (loading || uploadingImages || images.length === 0) && styles.disabledButton
            ]} 
            onPress={handleSubmit}
            disabled={loading || uploadingImages || images.length === 0}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : uploadingImages ? (
              <Text style={styles.submitButtonText}>{t('addProperty.form.uploadingPhotos')}</Text>
            ) : (
              <Text style={styles.submitButtonText}>{t('addProperty.form.submit')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
    position: 'relative',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    backgroundColor: 'transparent',
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 16,
  },
  uploadButton: {
    backgroundColor: '#1E3A8A',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoNote: {
    fontSize: 14,
    marginBottom: 16,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  imageWrapper: {
    width: '30%',
    aspectRatio: 1,
    margin: '1.5%',
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
  },
  propertyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 2,
  },
  submitButton: {
    backgroundColor: '#1E3A8A',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#1E3A8A',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Стили для кнопки выбора города
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  pickerButtonText: {
    fontSize: 16,
  },
  // Стили для модального окна
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 8,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  cityItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  cityItemText: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddPropertyScreen;
