import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useProperties } from '../contexts/PropertyContext';
import HeaderControls from '../components/HeaderControls';
import WebHeaderBar from '../components/WebHeaderBar';
import Colors from '../constants/colors';
import { Logger } from '../utils/logger';
import { RootStackParamList } from '../types/navigation';

// Расширяем тип globalThis для наших глобальных переменных
declare global {
  var propertyDeepLinkId: string | null;
  var pendingPropertyNavigation: string | null;
  var navigationRef: React.RefObject<any> | null;
}

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
import AgencyScreen from '../screens/AgencyScreen';

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
        // На вебе рисуем собственную «широкую» шапку внутри headerTitle,
        // и убираем headerRight чтобы не дублировать элементы
        headerTitle: () => (
          Platform.OS === 'web' ? (
            <WebHeaderBar
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
              title="DomGo.rs"
              isHomeScreen={true}
              selectedCity={selectedCity}
              onCitySelect={setSelectedCity}
            />
          ) : (
            <Text style={{ fontWeight: 'bold', color: theme.headerText, fontSize: 18 }}>DomGo.rs</Text>
          )
        ),
        headerRight: Platform.OS === 'web' ? undefined : () => (
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
        name="Agency"
        component={AgencyScreen}
        options={{
          title: t('agency.title', 'Агентство'),
          headerShown: true,
          presentation: 'card',
          animationTypeForReplace: 'push',
          animation: 'slide_from_right',
          headerTitle: () => (
            Platform.OS === 'web' ? (
              <WebHeaderBar
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                title={t('agency.title', 'Агентство')}
                isHomeScreen={false}
              />
            ) : (
              <Text style={{ fontWeight: 'bold', color: theme.headerText, fontSize: 18 }}>{t('agency.title', 'Агентство')}</Text>
            )
          ),
          headerRight: Platform.OS === 'web' ? undefined : () => (
            <HeaderControls darkMode={darkMode} toggleDarkMode={toggleDarkMode} isHomeScreen={false} />
          ),
        }}
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
          headerTitle: () => (
            Platform.OS === 'web' ? (
              <WebHeaderBar
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                title={t('property.details')}
                isHomeScreen={false}
              />
            ) : (
              <Text style={{ fontWeight: 'bold', color: theme.headerText, fontSize: 18 }}>{t('property.details')}</Text>
            )
          ),
          headerRight: Platform.OS === 'web' ? undefined : () => (
            <HeaderControls darkMode={darkMode} toggleDarkMode={toggleDarkMode} isHomeScreen={false} />
          ),
        }}
      />
      <Stack.Screen
        name="MyProperties"
        component={MyPropertiesScreen}
        options={{
          title: t('profile.myProperties'),
          headerShown: true,
          headerTitle: () => (
            Platform.OS === 'web' ? (
              <WebHeaderBar
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                title={t('profile.myProperties')}
                isHomeScreen={false}
              />
            ) : (
              <Text style={{ fontWeight: 'bold', color: theme.headerText, fontSize: 18 }}>{t('profile.myProperties')}</Text>
            )
          ),
          headerRight: Platform.OS === 'web' ? undefined : () => (
            <HeaderControls darkMode={darkMode} toggleDarkMode={toggleDarkMode} isHomeScreen={false} />
          ),
        }}
      />
      <Stack.Screen
        name="EditProperty"
        component={EditPropertyScreen}
        options={{
          title: t('property.editProperty'),
          headerShown: true,
          headerTitle: () => (
            Platform.OS === 'web' ? (
              <WebHeaderBar
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                title={t('property.editProperty')}
                isHomeScreen={false}
              />
            ) : (
              <Text style={{ fontWeight: 'bold', color: theme.headerText, fontSize: 18 }}>{t('property.editProperty')}</Text>
            )
          ),
          headerRight: Platform.OS === 'web' ? undefined : () => (
            <HeaderControls darkMode={darkMode} toggleDarkMode={toggleDarkMode} isHomeScreen={false} />
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
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.tabActive,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 15,
          paddingTop: 5,
          height: 60 + (insets.bottom > 0 ? insets.bottom - 10 : 0), // Adjust height based on insets
          ...(Platform.OS === 'web' ? { paddingHorizontal: 64 } : {}),
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
          headerTitle: () => (
            Platform.OS === 'web' ? (
              <WebHeaderBar
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                title="DomGo.rs"
                isHomeScreen={true}
                selectedCity={selectedCity}
                onCitySelect={setSelectedCity}
              />
            ) : (
              <Text style={{ fontWeight: 'bold', color: theme.headerText, fontSize: 18 }}>DomGo.rs</Text>
            )
          ),
          headerRight: Platform.OS === 'web' ? undefined : () => (
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
          headerTitle: () => (
            Platform.OS === 'web' ? (
              <WebHeaderBar
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                title={t('navigation.favorites')}
                isHomeScreen={false}
                selectedCity={selectedCity}
                onCitySelect={setSelectedCity}
              />
            ) : (
              <Text style={{ fontWeight: 'bold', color: theme.headerText, fontSize: 18 }}>{t('navigation.favorites')}</Text>
            )
          ),
          headerRight: Platform.OS === 'web' ? undefined : () => (
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
          headerTitle: () => (
            Platform.OS === 'web' ? (
              <WebHeaderBar
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                title={t('navigation.add')}
                isHomeScreen={false}
                selectedCity={selectedCity}
                onCitySelect={setSelectedCity}
              />
            ) : (
              <Text style={{ fontWeight: 'bold', color: theme.headerText, fontSize: 18 }}>{t('navigation.add')}</Text>
            )
          ),
          headerRight: Platform.OS === 'web' ? undefined : () => (
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
          headerTitle: () => (
            Platform.OS === 'web' ? (
              <WebHeaderBar
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                title={t('navigation.profile')}
                isHomeScreen={false}
                selectedCity={selectedCity}
                onCitySelect={setSelectedCity}
              />
            ) : (
              <Text style={{ fontWeight: 'bold', color: theme.headerText, fontSize: 18 }}>{t('navigation.profile')}</Text>
            )
          ),
          headerRight: Platform.OS === 'web' ? undefined : () => (
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
          headerTitle: () => (
            Platform.OS === 'web' ? (
              <WebHeaderBar
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                title={t('navigation.settings')}
                isHomeScreen={false}
                selectedCity={selectedCity}
                onCitySelect={setSelectedCity}
              />
            ) : (
              <Text style={{ fontWeight: 'bold', color: theme.headerText, fontSize: 18 }}>{t('navigation.settings')}</Text>
            )
          ),
          headerRight: Platform.OS === 'web' ? undefined : () => (
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
      // Проверяем наличие отложенной навигации (установленной в App.tsx)
      // @ts-ignore - Игнорируем ошибку для глобальных переменных
      if (globalThis.pendingPropertyNavigation) {
        // @ts-ignore - Игнорируем ошибку для глобальных переменных
        const propertyId = globalThis.pendingPropertyNavigation;
        Logger.debug('Обнаружена отложенная навигация к объявлению, ID:', propertyId);

        try {
          // Загружаем данные объявления по ID
          const propertyData = await fetchPropertyById(propertyId);
          if (propertyData) {
            // Выполняем навигацию к экрану деталей объявления
            setTimeout(() => {
              if (navigationRef.current) {
                // @ts-ignore - Игнорируем ошибку для метода navigate
                // Навигация с передачей id и предзагруженных данных объявления 
                // Важно: передаем как propertyId, так и id
                navigationRef.current.navigate('PropertyDetails', {
                  propertyId: propertyId,
                  id: propertyId,
                  property: propertyData
                });
                Logger.debug('Выполнена отложенная навигация к экрану деталей объявления');
                // Очищаем переменные после использования
                // @ts-ignore - Игнорируем ошибку для глобальных переменных
                globalThis.pendingPropertyNavigation = null;
              }
            }, 500);
          }
        } catch (error) {
          Logger.error('Ошибка при загрузке объявления по ID:', error);
          globalThis.pendingPropertyNavigation = null;
        }
      }

      // Проверяем старый механизм propertyDeepLinkId
      // @ts-ignore - Игнорируем ошибку для глобальных переменных
      else if (globalThis.propertyDeepLinkId) {
        Logger.debug('Открываем объявление из ссылки, ID:', globalThis.propertyDeepLinkId);

        // Загружаем данные объявления по ID
        try {
          const propertyData = await fetchPropertyById(globalThis.propertyDeepLinkId);
          if (propertyData) {
            // Таймер нужен, чтобы дать навигатору время на инициализацию
            setTimeout(() => {
              if (navigationRef.current) {
                // @ts-ignore - Игнорируем ошибку для метода navigate
                // Навигация с передачей id и предзагруженных данных объявления
                // Важно: передаем как propertyId, так и id
                navigationRef.current.navigate('PropertyDetails', {
                  propertyId: globalThis.propertyDeepLinkId,
                  id: globalThis.propertyDeepLinkId,
                  property: propertyData
                });
                // Очищаем глобальный ID после использования
                // @ts-ignore - Игнорируем ошибку для глобальных переменных
                globalThis.propertyDeepLinkId = null;
              }
            }, 500);
          }
        } catch (error) {
          Logger.error('Ошибка при загрузке объявления по ссылке:', error);
          globalThis.propertyDeepLinkId = null;
        }
      }
    };

    checkDeepLink();
  }, [fetchPropertyById]);

  // Создаем реф для доступа к навигационному контейнеру извне
  // Делаем его глобально доступным для использования в App.tsx
  const navigationRef = React.useRef(null);
  // Устанавливаем глобальный доступ к navigationRef
  // @ts-ignore - Игнорируем ошибку для глобальных переменных
  globalThis.navigationRef = navigationRef;

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
