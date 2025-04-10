import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { showErrorAlert, showSuccessAlert } from '../utils/alertUtils';

const RegisterScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      showErrorAlert(t('auth.fillRequiredFields'));
      return;
    }

    if (password !== confirmPassword) {
      showErrorAlert(t('auth.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    try {
      // Регистрация пользователя с настройкой подтверждения email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // URL для возврата после подтверждения email с параметром источника (мобильное приложение)
          emailRedirectTo: 'domgomobile://auth/callback?source=mobile',
          // Добавляем метаданные для идентификации источника регистрации
          data: {
            source: 'mobile_app',
            platform: 'android'
          }
        }
      });

      if (authError) throw authError;

      if (authData?.user) {
        // Проверка статуса подтверждения email
        if (authData.user.identities && authData.user.identities.length === 0) {
          // Уже существует пользователь с таким email
          showErrorAlert(t('auth.emailAlreadyExists'));
          return;
        }
        
        if (authData.session === null) {
          // Email требует подтверждения
          showSuccessAlert(t('auth.confirmEmailSent'));
          navigation.navigate('Login');
          return;
        }

        // Если пользователь сразу создан и авторизован, пытаемся создать профиль
        try {
          // Сохраняем базовую информацию в таблицу пользователей
          const { error: profileError } = await supabase
            .from('users')
            .insert([
              {
                id: authData.user.id,
                email,
                created_at: new Date().toISOString(),
              },
            ]);

          if (profileError) {
            console.log('Профиль будет создан после подтверждения email:', profileError);
            // Не выбрасываем ошибку, так как пользователь уже создан в auth
          }

          // Автоматически входим после успешной регистрации
          await login(email, password);
          
          showSuccessAlert(t('auth.registerSuccess'));
          navigation.navigate('Home');
        } catch (profileError) {
          // Ошибка создания профиля, но пользователь создан
          console.log('Ошибка создания профиля:', profileError);
          showSuccessAlert(t('auth.confirmEmailSent'));
          navigation.navigate('Login');
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      // Показываем более конкретную ошибку, если она доступна
      if (error.message) {
        showErrorAlert(`${t('auth.registerFailed')}: ${error.message}`);
      } else {
        showErrorAlert(t('auth.registerFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>{t('auth.register')}</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.email')}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.enterEmail')}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.password')}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.enterPassword')}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('auth.confirmPasswordPlaceholder')}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>{t('auth.register')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>{t('auth.alreadyHaveAccount')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>{t('auth.login')}</Text>
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
    backgroundColor: '#F5F7FA',
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#1E3A8A',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#4B5563',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1E3A8A',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  linkText: {
    color: '#6B7280',
  },
  link: {
    color: '#1E3A8A',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
