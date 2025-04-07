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
  const { loading } = useAuth();
  const { darkMode } = useTheme();

  if (loading) {
    return null; // or loading indicator
  }

  return (
    <NavigationContainer
      theme={darkMode ? DarkTheme : DefaultTheme}
    >
      <MainStack />
    </NavigationContainer>
  );
};

export default AppNavigator;
