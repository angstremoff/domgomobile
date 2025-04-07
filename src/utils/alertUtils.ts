import i18next from 'i18next';
import { useAlerts } from '../components/AlertProvider';

// Интерфейс для кнопок алерта
interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

// Получаем функции из AlertProvider
let _alertFunctions: ReturnType<typeof useAlerts> | null = null;

// Функция для установки функций из AlertProvider
export const setAlertFunctions = (alertFunctions: ReturnType<typeof useAlerts>) => {
  _alertFunctions = alertFunctions;
};

/**
 * Показывает алерт с поддержкой темной темы и переводов
 * @param title Заголовок алерта
 * @param message Сообщение алерта
 * @param buttons Кнопки алерта
 */
export const showAlert = (
  title: string,
  message: string,
  buttons?: AlertButton[]
) => {
  // Проверяем, содержит ли title или message ключи перевода
  const translatedTitle = title.startsWith('common.') || 
                          title.startsWith('property.') || 
                          title.startsWith('auth.') || 
                          title.startsWith('profile.') 
                          ? i18next.t(title) : title;
  
  const translatedMessage = message.startsWith('common.') || 
                            message.startsWith('property.') || 
                            message.startsWith('auth.') || 
                            message.startsWith('profile.') 
                            ? i18next.t(message) : message;
  
  // Преобразуем кнопки для алерта
  const alertButtons = buttons?.map(button => ({
    text: button.text.startsWith('common.') ? i18next.t(button.text) : button.text,
    onPress: button.onPress,
    style: button.style
  })) || [{ text: i18next.t('common.ok') }];
  
  // Если доступны функции из AlertProvider, используем их
  if (_alertFunctions) {
    _alertFunctions.showAlert(translatedTitle, translatedMessage, alertButtons);
  } else {
    // Иначе выводим предупреждение в консоль
    console.warn('AlertProvider not initialized. Please wrap your app with AlertProvider.');
  }
};

/**
 * Показывает алерт с подтверждением
 * @param title Заголовок алерта
 * @param message Сообщение алерта
 * @param onConfirm Функция, вызываемая при подтверждении
 * @param onCancel Функция, вызываемая при отмене
 */
export const showConfirmAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  // Проверяем, содержит ли title или message ключи перевода
  const translatedTitle = title.startsWith('common.') || 
                          title.startsWith('property.') || 
                          title.startsWith('auth.') || 
                          title.startsWith('profile.') 
                          ? i18next.t(title) : title;
  
  const translatedMessage = message.startsWith('common.') || 
                            message.startsWith('property.') || 
                            message.startsWith('auth.') || 
                            message.startsWith('profile.') 
                            ? i18next.t(message) : message;
  
  // Если доступны функции из AlertProvider, используем их
  if (_alertFunctions) {
    _alertFunctions.showConfirmAlert(translatedTitle, translatedMessage, onConfirm, onCancel);
  } else {
    // Иначе используем showAlert с кнопками подтверждения и отмены
    showAlert(
      translatedTitle,
      translatedMessage,
      [
        {
          text: i18next.t('common.cancel'),
          onPress: onCancel,
          style: 'cancel'
        },
        {
          text: i18next.t('common.confirm'),
          onPress: onConfirm,
          style: 'default'
        }
      ]
    );
  }
};

/**
 * Показывает алерт об успешном действии
 * @param message Сообщение об успехе
 * @param onClose Функция, вызываемая при закрытии алерта
 */
export const showSuccessAlert = (
  message: string,
  onClose?: () => void
) => {
  // Проверяем, содержит ли message ключи перевода
  const translatedMessage = message.startsWith('common.') || 
                            message.startsWith('property.') || 
                            message.startsWith('auth.') || 
                            message.startsWith('profile.') 
                            ? i18next.t(message) : message;
  
  // Если доступны функции из AlertProvider, используем их
  if (_alertFunctions) {
    _alertFunctions.showSuccessAlert(translatedMessage, onClose);
  } else {
    // Иначе используем showAlert с заголовком "Успешно"
    showAlert(
      i18next.t('common.success'),
      translatedMessage,
      [{ text: i18next.t('common.ok'), onPress: onClose }]
    );
  }
};

/**
 * Показывает алерт об ошибке
 * @param message Сообщение об ошибке
 * @param onClose Функция, вызываемая при закрытии алерта
 */
export const showErrorAlert = (
  message: string,
  onClose?: () => void
) => {
  // Проверяем, содержит ли message ключи перевода
  const translatedMessage = message.startsWith('common.') || 
                            message.startsWith('property.') || 
                            message.startsWith('auth.') || 
                            message.startsWith('profile.') 
                            ? i18next.t(message) : message;
  
  // Если доступны функции из AlertProvider, используем их
  if (_alertFunctions) {
    _alertFunctions.showErrorAlert(translatedMessage, onClose);
  } else {
    // Иначе используем showAlert с заголовком "Ошибка"
    showAlert(
      i18next.t('common.error'),
      translatedMessage,
      [{ text: i18next.t('common.ok'), onPress: onClose }]
    );
  }
};
