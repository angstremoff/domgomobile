import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback 
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/colors';
import { useTranslation } from 'react-i18next';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  buttons?: AlertButton[];
}

const CustomModal = ({ visible, title, message, onClose, buttons }: CustomModalProps) => {
  const { darkMode } = useTheme();
  const { t } = useTranslation();
  const theme = darkMode ? Colors.dark : Colors.light;

  // Если кнопки не переданы, используем кнопку OK по умолчанию
  const modalButtons = buttons || [
    { text: t('common.ok'), onPress: onClose, style: 'default' }
  ];

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
              <Text style={[styles.modalMessage, { color: theme.text }]}>{message}</Text>
              
              <View style={styles.buttonContainer}>
                {modalButtons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      button.style === 'destructive' && styles.destructiveButton,
                      button.style === 'cancel' && [styles.cancelButton, { borderColor: theme.border }],
                      button.style === 'default' && { backgroundColor: theme.primary },
                      modalButtons.length > 1 && { flex: 1, marginHorizontal: 5 }
                    ]}
                    onPress={() => {
                      if (button.onPress) {
                        button.onPress();
                      } else {
                        onClose();
                      }
                    }}
                  >
                    <Text 
                      style={[
                        styles.buttonText,
                        button.style === 'cancel' && [styles.cancelButtonText, { color: theme.text }],
                        button.style === 'default' && { color: '#FFFFFF' }
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  destructiveButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    fontWeight: 'normal',
  },
});

export default CustomModal;
