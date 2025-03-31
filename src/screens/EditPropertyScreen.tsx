import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Switch
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { propertyService } from '../services/propertyService';
import { Property } from '../contexts/PropertyContext';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

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

const EditPropertyScreen = ({ route, navigation }: any) => {
  const { propertyId } = route.params;
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Форма
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [rooms, setRooms] = useState('');
  const [cityId, setCityId] = useState<string>('0');
  const [propertyType, setPropertyType] = useState<'sale' | 'rent'>('sale');
  const [propertyCategory, setPropertyCategory] = useState('apartment');
  const [images, setImages] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Инициализация
  useEffect(() => {
    const init = async () => {
      try {
        await loadCities();
        await loadProperty();
      } catch (error) {
        console.error('Ошибка при инициализации:', error);
      }
    };

    init();
  }, [propertyId]);

  const loadCities = async () => {
    try {
      const data = await propertyService.getCities();
      setCities(data);
    } catch (error) {
      console.error('Ошибка при загрузке городов:', error);
      Alert.alert(t('common.error'), t('property.errorLoadingCities'));
    }
  };

  const loadProperty = async () => {
    try {
      setLoading(true);
      const data = await propertyService.getPropertyById(propertyId);
      setProperty(data);
      
      // Заполняем форму данными
      setTitle(data.title || '');
      setDescription(data.description || '');
      setPrice(data.price?.toString() || '');
      // В веб-версии используется поле location вместо address
      setAddress(data.location || '');
      setArea(data.area?.toString() || '');
      setRooms(data.rooms?.toString() || '');
      
      // Город берётся напрямую из city_id и преобразуется в строку 
      // (Picker в React Native работает со строками)
      if (data.city_id) {
        setCityId(data.city_id.toString());
      }
      
      setPropertyType(data.type || 'sale');
      setPropertyCategory(data.category || 'apartment');
      setImages(data.images || []);
      setSelectedFeatures(data.features || []);

      console.log('Загружено объявление:', data);
      console.log('ID города:', data.city_id, 'Адрес (location):', data.location);
    } catch (error) {
      console.error('Ошибка при загрузке объявления:', error);
      Alert.alert(t('common.error'), t('property.errorLoadingProperty'));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

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

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUploadingImages(true);
      try {
        const asset = result.assets[0];
        const fileName = asset.uri.split('/').pop() || 'image.jpg';
        const imageUrl = await propertyService.uploadImage(asset.uri, fileName);
        
        setImages(prevImages => [...prevImages, imageUrl]);
      } catch (error) {
        console.error('Ошибка при загрузке изображения:', error);
        Alert.alert(t('common.error'), t('property.errorUploadingImage'));
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

  const handleSave = async () => {
    if (!title || !price) {
      Alert.alert(t('common.error'), t('property.requiredFieldsMissing'));
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

    // Валидация числовых полей как в веб-версии
    if (rooms && (isNaN(Number(rooms)) || Number(rooms) < 1 || Number(rooms) > 20)) {
      Alert.alert(t('common.error'), t('property.invalidRooms'));
      return;
    }
    
    if (area && (isNaN(Number(area)) || Number(area) < 1 || Number(area) > 1000)) {
      Alert.alert(t('common.error'), t('property.invalidArea'));
      return;
    }
    
    if (isNaN(Number(price)) || Number(price) < 1 || Number(price) > 100000000) {
      Alert.alert(t('common.error'), t('property.invalidPrice'));
      return;
    }

    // Проверяем, что город выбран (не 0)
    if (cityId === '0') {
      Alert.alert(t('common.error'), t('property.selectCity'));
      return;
    }

    try {
      setSaving(true);
      
      const updatedProperty = {
        title,
        description,
        price: Number(price), // используем Number вместо parseFloat как в веб-версии
        location: address, // поле location вместо address
        area: area ? Number(area) : undefined, // Number вместо parseFloat
        rooms: rooms ? Number(rooms) : undefined, // Number вместо parseInt
        city_id: cityId !== '0' ? Number(cityId) : undefined, // Проверяем, что не 0 
        type: propertyType,
        category: propertyCategory, // в веб-версии это property_type, но оставим как есть
        features: selectedFeatures,
        images
      };
      
      await propertyService.updateProperty(propertyId, updatedProperty);
      
      Alert.alert(
        t('common.success'),
        t('property.updateSuccess'),
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Ошибка при сохранении объявления:', error);
      Alert.alert(t('common.error'), t('property.updateError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>{t('property.basicInfo')}</Text>
          
          <Text style={styles.label}>{t('property.dealType')}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={propertyType}
              onValueChange={(value) => setPropertyType(value as 'sale' | 'rent')}
              style={styles.picker}
            >
              <Picker.Item label={t('property.sale')} value="sale" />
              <Picker.Item label={t('property.rent')} value="rent" />
            </Picker>
          </View>
          
          <Text style={styles.label}>{t('property.propertyType')}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={propertyCategory}
              onValueChange={(itemValue: string) => setPropertyCategory(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label={t('property.apartment')} value="apartment" />
              <Picker.Item label={t('property.house')} value="house" />
              <Picker.Item label={t('property.commercial')} value="commercial" />
              <Picker.Item label={t('property.land')} value="land" />
            </Picker>
          </View>

          <Text style={styles.label}>{t('property.title')}</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t('property.titlePlaceholder')}
          />

          <Text style={styles.label}>{t('property.price')} {propertyType === 'rent' ? '(€/месяц)' : '(€)'}</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder={t('property.pricePlaceholder')}
            keyboardType="numeric"
          />
          
          <Text style={styles.sectionTitle}>{t('property.location')}</Text>
          
          <Text style={styles.label}>{t('property.city')}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={cityId}
              onValueChange={setCityId}
              style={styles.picker}
            >
              <Picker.Item label={t('property.selectCity')} value="0" />
              {cities.map(city => (
                <Picker.Item key={city.id.toString()} label={city.name} value={city.id.toString()} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>{t('property.address')}</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder={t('property.addressPlaceholder')}
          />
          
          <Text style={styles.sectionTitle}>{t('property.details')}</Text>

          <Text style={styles.label}>{t('property.area')} (м²)</Text>
          <TextInput
            style={styles.input}
            value={area}
            onChangeText={setArea}
            placeholder={t('property.areaPlaceholder')}
            keyboardType="numeric"
          />

          <Text style={styles.label}>{t('property.rooms')}</Text>
          <TextInput
            style={styles.input}
            value={rooms}
            onChangeText={setRooms}
            placeholder={t('property.roomsPlaceholder')}
            keyboardType="numeric"
          />

          <Text style={styles.label}>{t('property.description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder={t('property.descriptionPlaceholder')}
            multiline
            textAlignVertical="top"
          />
          
          <Text style={styles.sectionTitle}>{t('property.features')}</Text>
          
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
          
          <Text style={styles.sectionTitle}>{t('property.photos')}</Text>
          
          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={pickImage}
            disabled={uploadingImages}
          >
            {uploadingImages ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.uploadButtonText}>{t('property.addPhoto')}</Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.photoNote}>
            {t('property.maxPhotos')} ({images.length}/10)
          </Text>
          
          {images.length > 0 && (
            <View style={styles.imagesContainer}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: image }} style={styles.propertyImage} />
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

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.saveButton, 
                (saving || uploadingImages || images.length === 0) && styles.disabledButton
              ]} 
              onPress={handleSave}
              disabled={saving || uploadingImages || images.length === 0}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : uploadingImages ? (
                <Text style={styles.saveButtonText}>Загрузка фото...</Text>
              ) : (
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA'
  },
  scrollView: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  formContainer: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
    color: '#1E3A8A'
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#374151'
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    marginBottom: 16
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    marginBottom: 16,
    overflow: 'hidden'
  },
  picker: {
    height: 50,
    width: '100%'
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top'
  },
  featuresContainer: {
    marginBottom: 16
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  featureText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#374151'
  },
  uploadButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500'
  },
  photoNote: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 16
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16
  },
  imageWrapper: {
    width: '30%',
    aspectRatio: 1,
    margin: '1.5%',
    position: 'relative'
  },
  propertyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 32
  },
  saveButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center'
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    flex: 1,
    marginRight: 8,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600'
  },
  disabledButton: {
    opacity: 0.5
  }
});

export default EditPropertyScreen;
