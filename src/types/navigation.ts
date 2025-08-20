import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

// Типы для всех параметров экранов приложения
export type RootStackParamList = {
  MainTabs: undefined;
  PropertyDetails: { propertyId: string };
  Login: undefined;
  Register: undefined;
  AddProperty: undefined;
  Settings: undefined;
  Map: undefined;
  MyProperties: undefined;
  EditProperty: { propertyId: string };
  Home: undefined;
  Favorites: undefined;
  Profile: undefined;
  Agency: { agencyId: string };
};

// Типы для пропсов экранов
export type PropertyDetailsScreenProps = {
  route: RouteProp<RootStackParamList, 'PropertyDetails'>;
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export type EditPropertyScreenProps = {
  route: RouteProp<RootStackParamList, 'EditProperty'>;
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export type AgencyScreenProps = {
  route: RouteProp<RootStackParamList, 'Agency'>;
  navigation: NativeStackNavigationProp<RootStackParamList>;
};
