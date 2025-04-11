import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Image
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/colors';
import { showSuccessAlert, showErrorAlert } from '../utils/alertUtils';

interface Profile {
  name: string;
  phone: string;
  avatar_url: string | null;
}

const ProfileScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const { darkMode } = useTheme();
  const theme = darkMode ? Colors.dark : Colors.light;
  const [profile, setProfile] = useState<Profile>({
    name: '',
    phone: '',
    avatar_url: null
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('name, phone, avatar_url')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile({
          name: data.name || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      // Показываем индикатор загрузки только на кнопке
      setLoading(true);
      
      console.log('Updating profile with data:', {
        id: user?.id,
        name: profile.name,
        phone: profile.phone
      });
      
      // Обновляем данные в Supabase - используем прямой запрос RPC для обхода ограничений роутинга
      const { data, error } = await supabase
        .from('users')
        .update({
          name: profile.name,
          phone: profile.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)
        .select(); // добавляем select() для получения обновленных данных
      
      console.log('Supabase update response:', { data, error });

      if (error) {
        console.error('Error details:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        // Обновляем состояние профиля новыми данными
        const updatedProfile = data[0];
        setProfile({
          name: updatedProfile.name || '',
          phone: updatedProfile.phone || '',
          avatar_url: updatedProfile.avatar_url
        });
        console.log('Profile updated successfully:', updatedProfile);
      } else {
        // Дополнительный запрос, если первый не вернул данных
        const { data: fetchedData, error: fetchError } = await supabase
          .from('users')
          .select('name, phone, avatar_url')
          .eq('id', user?.id)
          .single();
          
        if (fetchError) {
          console.error('Error fetching updated profile:', fetchError);
        } else if (fetchedData) {
          setProfile({
            name: fetchedData.name || '',
            phone: fetchedData.phone || '',
            avatar_url: fetchedData.avatar_url
          });
          console.log('Profile fetched after update:', fetchedData);
        }
      }
      
      setEditMode(false);
      showSuccessAlert(t('common.profileUpdated'));
    } catch (error) {
      console.error('Error updating profile:', error);
      showErrorAlert(t('profile.errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error logging out:', error);
      showErrorAlert(t('auth.logoutFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Если пользователь не авторизован, показываем экран входа
  if (!user) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.authMessage, { color: theme.text }]}>{t('auth.requiredForProfile')}</Text>
        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <View style={styles.profileInfo}>
          <View style={[styles.avatar, { backgroundColor: theme.card }]}>
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={30} color={theme.primary} />
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.headerText }]}>
              {profile.name || t('property.sellerNameUnavailable')}
            </Text>
            <Text style={[styles.userEmail, { color: darkMode ? '#FFFFFF' : '#1A4CA1' }]}>{user.email}</Text>
          </View>
        </View>
      </View>

      {/* Глобальный индикатор загрузки отображается только при первой загрузке профиля */}
      {loading && !profile.name && (
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}

      {!loading && (
        <View style={styles.content}>
          {editMode ? (
            <View style={[styles.editForm, { backgroundColor: theme.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('profile.editProfile')}</Text>
              
              <Text style={[styles.fieldLabel, { color: theme.text }]}>{t('profile.name')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                value={profile.name}
                onChangeText={(text) => setProfile({ ...profile, name: text })}
                placeholder={t('profile.name')}
                placeholderTextColor={theme.secondary}
                selectTextOnFocus
              />
              
              <Text style={[styles.fieldLabel, { color: theme.text }]}>{t('profile.phone')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                value={profile.phone}
                onChangeText={(text) => setProfile({ ...profile, phone: text })}
                placeholder={t('profile.phone')}
                placeholderTextColor={theme.secondary}
                keyboardType="phone-pad"
                selectTextOnFocus
              />
              
              <View style={styles.buttonsRow}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton, 
                    { borderColor: theme.border, backgroundColor: darkMode ? '#2A3441' : '#F3F4F6' }]} 
                  onPress={() => setEditMode(false)}
                  disabled={loading}
                >
                  <Text style={[styles.buttonText, { color: theme.text }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.saveButton, { backgroundColor: theme.primary }]} 
                  onPress={updateProfile}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={[styles.section, { backgroundColor: theme.card }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('common.personalInfo')}</Text>
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={() => setEditMode(true)}
                >
                  <Ionicons name="create-outline" size={20} color={theme.primary} />
                  <Text style={[styles.editButtonText, { color: theme.primary }]}>{t('common.edit')}</Text>
                </TouchableOpacity>
                
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: theme.secondary }]}>{t('profile.name')}</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {profile.name || t('property.sellerNameUnavailable')}
                  </Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: theme.secondary }]}>{t('profile.phone')}</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {profile.phone || t('property.sellerNameUnavailable')}
                  </Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: theme.secondary }]}>{t('profile.email')}</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>{user.email}</Text>
                </View>
              </View>
              
              <View style={[styles.section, { backgroundColor: theme.card }]}>
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => navigation.navigate('MyProperties')}
                >
                  <Ionicons name="home-outline" size={24} color={theme.primary} />
                  <Text style={[styles.menuItemText, { color: theme.text }]}>{t('profile.myProperties')}</Text>
                  <Ionicons name="chevron-forward" size={20} color={theme.secondary} style={styles.menuArrow} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => navigation.navigate('Favorites')}
                >
                  <Ionicons name="heart-outline" size={24} color={theme.primary} />
                  <Text style={[styles.menuItemText, { color: theme.text }]}>{t('common.favorites')}</Text>
                  <Ionicons name="chevron-forward" size={20} color={theme.secondary} style={styles.menuArrow} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => navigation.navigate('Settings')}
                >
                  <Ionicons name="settings-outline" size={24} color={theme.primary} />
                  <Text style={[styles.menuItemText, { color: theme.text }]}>{t('settings.title')}</Text>
                  <Ionicons name="chevron-forward" size={20} color={theme.secondary} style={styles.menuArrow} />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={[styles.logoutButton, { backgroundColor: theme.card }]} 
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                <Text style={styles.logoutText}>{t('common.logout')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#1A4CA1',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  editButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    color: '#1A4CA1',
    marginLeft: 4,
    fontWeight: '500',
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  menuArrow: {
    marginLeft: 'auto',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
    marginLeft: 12,
  },
  editForm: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 16,
    paddingVertical: 10,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#1A4CA1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
