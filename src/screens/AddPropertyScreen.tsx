import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput,
  StyleSheet, 
  ScrollView, 
  Switch, 
  Alert, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Platform, 
  KeyboardAvoidingView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { propertyService } from '../services/propertyService';

interface City {
  id: string;
  name: string;
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
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    loadCities();
    loadUserData();
  }, []);

  const loadCities = async () => {
    try {
      const data = await propertyService.getCities();
      setCities(data);
    } catch (error) {
      console.error('Ошибка при загрузке городов:', error);
      Alert.alert('Ошибка', 'Ошибка при загрузке городов');
    }
  };

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
      <View style={styles.centeredContainer}>
        <Text style={styles.title}>Авторизация требуется для добавления объявления</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.loginButtonText}>Войти</Text>
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
      Alert.alert('Ограничение', 'Максимальное количество фотографий - 10');
      return;
    }

    // Максимально простой вариант, как в веб-версии
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images', // Самый простой вариант без использования констант
      allowsEditing: false,
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUploadingImages(true);
      try {
        const asset = result.assets[0];
        console.log('Выбрано изображение:', asset.uri);
        
        // Получаем исходное имя файла
        const fileName = asset.uri.split('/').pop() || 'image.jpg';
        const fileExt = fileName.split('.').pop() || 'jpg';
        console.log('Имя файла:', fileName);
        
        // Используем простой и прямой метод, как в веб-версии
        // Читаем как Base64
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Загружаем через простой метод напрямую (без лишних преобразований)
        const imageUrl = await propertyService.uploadSimple(base64, fileName);
        
        if (!imageUrl) {
          throw new Error('Не получен URL изображения');
        }
        
        console.log('Получен URL:', imageUrl);
        setImages(prevImages => [...prevImages, imageUrl]);
      } catch (error) {
        console.error('Ошибка при загрузке изображения:', error);
        Alert.alert('Ошибка', 'Ошибка при загрузке изображения. Пожалуйста, попробуйте другое изображение.');
      } finally {
        setUploadingImages(false);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prevImages => {
      const newImages = [...prevImages];
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // Валидация числа как в веб-версии
  const validateNumber = (value: string, min: number, max: number) => {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
  };

  const handleSubmit = async () => {
    // Проверка на обязательные поля
    if (!title || !price || !area || !rooms || !location || !description) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все обязательные поля (название, цена, площадь, количество комнат, адрес, описание)');
      return;
    }

    // Проверка контактных данных
    if (!userData.name.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите ваше имя');
      return;
    }
    
    if (!userData.phone.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите ваш телефон');
      return;
    }
    
    // Проверка на загрузку фотографий
    if (uploadingImages) {
      Alert.alert('Подождите', 'Дождитесь окончания загрузки фотографий');
      return;
    }
    
    // Проверка на наличие хотя бы одной фотографии
    if (images.length === 0) {
      Alert.alert('Ошибка', 'Пожалуйста, добавьте хотя бы одну фотографию');
      return;
    }

    // Проверка, что price и area - числа
    if (!validateNumber(price, 1, 1000000000)) {
      Alert.alert('Ошибка', 'Пожалуйста, введите корректную цену (число от 1 до 1000000000)');
      return;
    }

    if (!validateNumber(area, 1, 10000)) {
      Alert.alert('Ошибка', 'Пожалуйста, введите корректную площадь (число от 1 до 10000)');
      return;
    }

    if (!validateNumber(rooms, 1, 100)) {
      Alert.alert('Ошибка', 'Пожалуйста, введите корректное количество комнат (число от 1 до 100)');
      return;
    }

    // Проверка на выбор города как в веб-версии
    if (cityId === '0') {
      Alert.alert('Ошибка', 'Пожалуйста, выберите город');
      return;
    }

    // Локация должна быть указана
    if (!location.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите адрес');
      return;
    }

    // Валидация числовых полей как в веб-версии
    if (rooms && !validateNumber(rooms, 1, 20)) {
      Alert.alert('Ошибка', 'Пожалуйста, введите корректное количество комнат (число от 1 до 20)');
      return;
    }
    
    if (area && !validateNumber(area, 1, 1000)) {
      Alert.alert('Ошибка', 'Пожалуйста, введите корректную площадь (число от 1 до 1000)');
      return;
    }
    
    if (!validateNumber(price, 1, 100000000)) {
      Alert.alert('Ошибка', 'Пожалуйста, введите корректную цену (число от 1 до 100000000)');
      return;
    }

    try {
      setLoading(true);
      
      // Проверка лимита объявлений (максимум 20) - как в веб-версии
      try {
        const userPropertiesCount = await propertyService.getUserPropertiesCount();
        if (userPropertiesCount >= 20) {
          Alert.alert('Ошибка', 'Максимальное количество объявлений достигнуто');
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Ошибка при проверке количества объявлений:', error);
      }
      
      // Сначала сохраняем данные пользователя
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
        Alert.alert('Ошибка', 'Не удалось сохранить контактные данные');
        setLoading(false);
        return;
      }
      
      // Создаем объект с данными объявления, точно как в веб-версии
      const newProperty = {
        title,
        description,
        price: Number(price),
        location: location.trim(),
        area: area ? Number(area) : undefined,
        rooms: rooms ? Number(rooms) : undefined,
        city_id: Number(cityId),
        type: propertyType,
        property_type: propertyCategory,
        features: selectedFeatures,
        images,
        status: 'active',
      };
      
      // Создаем объявление через сервис
      await propertyService.createProperty(newProperty);
      
      Alert.alert(
        'Успех',
        'Объявление успешно добавлено',
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );
    } catch (error) {
      console.error('Ошибка при создании объявления:', error);
      Alert.alert('Ошибка', 'Ошибка при создании объявления');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#1E3A8A" />
            </View>
          )}
          
          <Text style={styles.sectionTitle}>Контактная информация</Text>
          
          <Text style={styles.label}>Имя</Text>
          <TextInput
            style={styles.input}
            value={userData.name}
            onChangeText={(text) => setUserData({ ...userData, name: text })}
            placeholder="Введите имя"
          />
          
          <Text style={styles.label}>Телефон</Text>
          <TextInput
            style={styles.input}
            value={userData.phone}
            onChangeText={(text) => setUserData({ ...userData, phone: text })}
            placeholder="Введите телефон"
            keyboardType="phone-pad"
          />
          
          <Text style={styles.sectionTitle}>Основная информация</Text>
          
          <Text style={styles.label}>Тип сделки</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={propertyType}
              onValueChange={(value) => setPropertyType(value as 'sale' | 'rent')}
              style={styles.picker}
            >
              <Picker.Item label="Продажа" value="sale" />
              <Picker.Item label="Аренда" value="rent" />
            </Picker>
          </View>
          
          <Text style={styles.label}>Тип недвижимости</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={propertyCategory}
              onValueChange={(itemValue: string) => setPropertyCategory(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Квартира" value="apartment" />
              <Picker.Item label="Дом" value="house" />
              <Picker.Item label="Коммерческая недвижимость" value="commercial" />
              <Picker.Item label="Земельный участок" value="land" />
            </Picker>
          </View>

          <Text style={styles.label}>Название</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Введите название"
          />

          <Text style={styles.label}>Цена {propertyType === 'rent' ? '(€/месяц)' : '(€)'}</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="Введите цену"
            keyboardType="numeric"
          />
          
          <Text style={styles.sectionTitle}>Местоположение</Text>
          
          <Text style={styles.label}>Город</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={cityId}
              onValueChange={setCityId}
              style={styles.picker}
            >
              <Picker.Item label="Выберите город" value="0" />
              {cities.map(city => (
                <Picker.Item key={city.id.toString()} label={city.name} value={city.id.toString()} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Адрес</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Введите адрес"
          />
          
          <Text style={styles.sectionTitle}>Детали</Text>

          <Text style={styles.label}>Площадь (м²)</Text>
          <TextInput
            style={styles.input}
            value={area}
            onChangeText={setArea}
            placeholder="Введите площадь"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Количество комнат</Text>
          <TextInput
            style={styles.input}
            value={rooms}
            onChangeText={setRooms}
            placeholder="Введите количество комнат"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Описание</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Введите описание"
            multiline
            textAlignVertical="top"
          />
          
          <Text style={styles.sectionTitle}>Особенности</Text>
          
          <View style={styles.featuresContainer}>
            {FEATURES.map(feature => (
              <View key={feature.id} style={styles.featureItem}>
                <Switch
                  value={selectedFeatures.includes(feature.id)}
                  onValueChange={() => toggleFeature(feature.id)}
                  trackColor={{ false: '#D1D5DB', true: '#1E3A8A' }}
                  thumbColor={selectedFeatures.includes(feature.id) ? '#FFFFFF' : '#FFFFFF'}
                />
                <Text style={styles.featureText}>{feature.name}</Text>
              </View>
            ))}
          </View>
          
          <Text style={styles.sectionTitle}>Фотографии</Text>
          
          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={pickImage}
            disabled={uploadingImages}
          >
            {uploadingImages ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.uploadButtonText}>Добавить фотографию</Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.photoNote}>
            Максимальное количество фотографий - 10 ({images.length}/10)
          </Text>
          
          {images.length > 0 && (
            <View style={styles.imagesContainer}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image 
                    source={{ uri: image }} 
                    style={styles.propertyImage} 
                  />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
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
              <Text style={styles.submitButtonText}>Загрузка фото...</Text>
            ) : (
              <Text style={styles.submitButtonText}>Добавить объявление</Text>
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
    backgroundColor: '#ffffff',
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
    color: '#1E3A8A',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#4B5563',
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
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 16,
  },
  picker: {
    height: 50,
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
    color: '#4B5563',
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
    color: '#6B7280',
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
    borderColor: '#E5E7EB',
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
});

export default AddPropertyScreen;
