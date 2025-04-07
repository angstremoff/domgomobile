import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  darkMode: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked, onPress, darkMode }) => {
  const theme = darkMode ? Colors.dark : Colors.light;
  
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View 
        style={[
          styles.checkbox, 
          { 
            backgroundColor: checked ? theme.primary : 'transparent',
            borderColor: checked ? theme.primary : theme.border,
          }
        ]}
      >
        {checked && <Ionicons name="checkmark" size={14} color="white" />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Checkbox;
