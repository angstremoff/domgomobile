import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useProperties } from '../contexts/PropertyContext';
import HeaderControls from '../components/HeaderControls';
import Colors from '../constants/colors';
import { RootStackParamList } from '../types/navigation';

// Импорт экранов
import HomeScreen from '../screens/HomeScreen';
import PropertyDetailsScreen from '../screens/PropertyDetailsScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import AddPropertyScreen from '../screens/AddPropertyScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MapScreen from '../screens/MapScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MyPropertiesScreen from '../screens/MyPropertiesScreen';
import EditPropertyScreen from '../screens/EditPropertyScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootStackParamList>();

// Навигатор для основных экранов
const MainStack = () => {
  const { t } = useTranslation();
  const { darkMode, toggleDarkMode } = useTheme();
  const { selectedCity, setSelectedCity } = useProperties();
  const theme = darkMode ? Colors.dark : Colors.light;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.headerBackground,
        },
        headerTintColor: theme.headerText,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => (
          <HeaderControls 
            darkMode={darkMode} 
            toggleDarkMode={toggleDarkMode} 
            selectedCity={selectedCity}
            onCitySelect={setSelectedCity}
            isHomeScreen={true}
          />
        ),
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="PropertyDetails" 
        component={PropertyDetailsScreen} 
        options={{ 
          title: t('property.details'),
          headerShown: true,
          presentation: 'card', 
          animationTypeForReplace: 'push',
          animation: 'slide_from_right',
          headerRight: () => (
            <HeaderControls 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode} 
              isHomeScreen={false}
            />
          ),
        }} 
      />
      <Stack.Screen 
        name="MyProperties" 
        component={MyPropertiesScreen} 
        options={{ 
          title: t('profile.myProperties'),
          headerShown: true,
          headerRight: () => (
            <HeaderControls 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode} 
              isHomeScreen={false}
            />
          ),
        }} 
      />
      <Stack.Screen 
        name="EditProperty" 
        component={EditPropertyScreen} 
        options={{ 
          title: t('property.editProperty'),
          headerShown: true,
          headerRight: () => (
            <HeaderControls 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode} 
              isHomeScreen={false}
            />
          ),
        }} 
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ title: t('auth.login') }} 
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ title: t('auth.register') }} 
      />
      <Stack.Screen 
        name="AddProperty" 
        component={AddPropertyScreen} 
        options={{ title: t('property.add') }} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: t('settings.title') }} 
      />
      <Stack.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ title: t('common.map') }} 
      />
    </Stack.Navigator>
  );
};

// Навигатор для панели вкладок
const MainTabs = () => {
  const { t } = useTranslation();
  const { darkMode, toggleDarkMode } = useTheme();
  const { selectedCity, setSelectedCity } = useProperties();
  const theme = darkMode ? Colors.dark : Colors.light;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.tabActive,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          paddingBottom: 15,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: theme.headerBackground,
        },
        headerTintColor: theme.headerText,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          title: 'DomGo.rs',
          tabBarLabel: t('navigation.home'),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
          headerRight: () => (
            <HeaderControls 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode} 
              selectedCity={selectedCity}
              onCitySelect={setSelectedCity}
              isHomeScreen={true}
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Favorites" 
        component={FavoritesScreen} 
        options={{
          title: t('navigation.favorites'),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="heart" color={color} size={size} />
          ),
          headerRight: () => (
            <HeaderControls 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode} 
              selectedCity={selectedCity}
              onCitySelect={setSelectedCity}
              isHomeScreen={false}
            />
          ),
        }}
      />
      <Tab.Screen 
        name="AddProperty" 
        component={AddPropertyScreen} 
        options={{
          title: t('navigation.add'),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="add-circle" color={color} size={size} />
          ),
          headerRight: () => (
            <HeaderControls 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode} 
              selectedCity={selectedCity}
              onCitySelect={setSelectedCity}
              isHomeScreen={false}
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: t('navigation.profile'),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
          headerRight: () => (
            <HeaderControls 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode} 
              selectedCity={selectedCity}
              onCitySelect={setSelectedCity}
              isHomeScreen={false}
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: t('navigation.settings'),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="settings" color={color} size={size} />
          ),
          headerRight: () => (
            <HeaderControls 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode} 
              selectedCity={selectedCity}
              onCitySelect={setSelectedCity}
              isHomeScreen={false}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { } = useAuth(); // Используем пустую деструктуризацию, так как user не используется
  const { darkMode } = useTheme();
  const { fetchPropertyById } = useProperties();
  
  // Выбор темы для навигации в зависимости от настроек
  const navigationTheme = darkMode ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: Colors.dark.background,
    },
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Colors.light.background,
    },
  };
  
  // Обработка глубоких ссылок на объявления
  React.useEffect(() => {
    // Проверяем, есть ли ID объявления для открытия (установленный обработчиком глубоких ссылок)
    const checkDeepLink = async () => {
      if (globalThis.propertyDeepLinkId) {
        console.log('Открываем объявление из ссылки, ID:', globalThis.propertyDeepLinkId);
        
        // Загружаем данные объявления по ID
        try {
          const propertyData = await fetchPropertyById(globalThis.propertyDeepLinkId);
          if (propertyData) {
            // Таймер нужен, чтобы дать навигатору время на инициализацию
            setTimeout(() => {
              // @ts-ignore - TS не знает о navigationRef, но он будет доступен
              if (navigationRef.current) {
                // @ts-ignore
                navigationRef.current.navigate('PropertyDetails', { property: propertyData });
                // Очищаем глобальный ID после использования
                globalThis.propertyDeepLinkId = null;
              }
            }, 500);
          }
        } catch (error) {
          console.error('Ошибка при загрузке объявления по ссылке:', error);
          globalThis.propertyDeepLinkId = null;
        }
      }
    };
    
    checkDeepLink();
  }, [fetchPropertyById]);
  
  // Создаем реф для доступа к навигационному контейнеру извне
  const navigationRef = React.useRef(null);

  return (
    <NavigationContainer
      theme={navigationTheme}
      ref={navigationRef}
    >
      <MainStack />
    </NavigationContainer>
  );
};

export default AppNavigator;
