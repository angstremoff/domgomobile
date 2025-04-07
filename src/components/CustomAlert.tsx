import React from 'react';
import { useTranslation } from 'react-i18next';
import CustomModal from './CustomModal';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  onClose: () => void;
}

const CustomAlert = ({ visible, title, message, buttons, onClose }: CustomAlertProps) => {
  const { t } = useTranslation();
  
  // Если кнопки не переданы, используем кнопку OK по умолчанию
  const defaultButtons = buttons || [
    { text: t('common.ok'), onPress: onClose, style: 'default' }
  ];
  
  return (
    <CustomModal
      visible={visible}
      title={title}
      message={message}
      onClose={onClose}
      buttons={defaultButtons}
    />
  );
};

// Утилита для показа кастомного алерта
export const showAlert = (
  title: string,
  message: string,
  buttons?: AlertButton[],
  setVisible?: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (setVisible) {
    setVisible(true);
  }
  return { title, message, buttons };
};

export default CustomAlert;
