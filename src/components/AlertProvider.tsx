import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import CustomAlert from './CustomAlert';
import { useTranslation } from 'react-i18next';

// Интерфейс для кнопок алерта
interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

// Интерфейс для контекста алертов
interface AlertContextType {
  showAlert: (title: string, message: string, buttons?: AlertButton[]) => void;
  showConfirmAlert: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
  showSuccessAlert: (message: string, onClose?: () => void) => void;
  showErrorAlert: (message: string, onClose?: () => void) => void;
}

// Создаем контекст для алертов
const AlertContext = createContext<AlertContextType | null>(null);

// Хук для использования контекста алертов
export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};

// Свойства для провайдера алертов
interface AlertProviderProps {
  children: ReactNode;
}

// Компонент-провайдер для алертов
export const AlertProvider = ({ children }: AlertProviderProps) => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [buttons, setButtons] = useState<AlertButton[]>([]);
  const { t } = useTranslation();

  // Функция для показа алерта
  const showAlert = useCallback((title: string, message: string, buttons?: AlertButton[]) => {
    setTitle(title);
    setMessage(message);
    setButtons(buttons || []);
    setVisible(true);
  }, []);

  // Функция для показа алерта с подтверждением
  const showConfirmAlert = useCallback((title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    const confirmButtons = [
      { text: t('common.cancel'), onPress: onCancel, style: 'cancel' as const },
      { text: t('common.confirm'), onPress: onConfirm, style: 'default' as const }
    ];
    showAlert(title, message, confirmButtons);
  }, [showAlert, t]);

  // Функция для показа алерта об успехе
  const showSuccessAlert = useCallback((message: string, onClose?: () => void) => {
    // Создаем обработчик, который сначала закроет окно, а потом выполнит коллбэк
    const combinedOnPress = () => {
      // Сначала закроем модальное окно
      setVisible(false);
      
      // Задержка перед выполнением коллбэка, чтобы окно успело закрыться
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 100);
      }
    };
    
    showAlert(t('common.success'), message, [{ text: t('common.ok'), onPress: combinedOnPress }]);
  }, [showAlert, t, setVisible]);

  // Функция для показа алерта об ошибке
  const showErrorAlert = useCallback((message: string, onClose?: () => void) => {
    // Создаем обработчик, который сначала закроет окно, а потом выполнит коллбэк
    const combinedOnPress = () => {
      // Сначала закроем модальное окно
      setVisible(false);
      
      // Задержка перед выполнением коллбэка, чтобы окно успело закрыться
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 100);
      }
    };
    
    showAlert(t('common.error'), message, [{ text: t('common.ok'), onPress: combinedOnPress }]);
  }, [showAlert, t, setVisible]);

  // Функция для закрытия алерта
  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  // Значение контекста
  const contextValue = {
    showAlert,
    showConfirmAlert,
    showSuccessAlert,
    showErrorAlert
  };

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      <CustomAlert
        visible={visible}
        title={title}
        message={message}
        buttons={buttons}
        onClose={handleClose}
      />
    </AlertContext.Provider>
  );
};

export default AlertProvider;
