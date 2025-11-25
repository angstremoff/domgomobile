import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';

interface RangeInputProps {
  value: [string, string];
  onChange: (value: [string, string]) => void;
  darkMode?: boolean;
  suffix?: string;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  hasError?: boolean;
}

const RangeInput: React.FC<RangeInputProps> = ({
  value,
  onChange,
  darkMode = false,
  suffix,
  minPlaceholder = 'От',
  maxPlaceholder = 'До',
  hasError = false
}) => {
  const theme = darkMode ? Colors.dark : Colors.light;

  const handleMinChange = (text: string) => {
    onChange([text, value[1]]);
  };

  const handleMaxChange = (text: string) => {
    onChange([value[0], text]);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.card,
            borderColor: hasError ? theme.error : theme.border
          }
        ]}
      >
        <TextInput
          style={[styles.input, { color: theme.text }]}
          value={value[0]}
          onChangeText={handleMinChange}
          placeholder={minPlaceholder}
          placeholderTextColor={theme.secondary}
          keyboardType="numeric"
          returnKeyType="done"
          autoCorrect={false}
        />
        {suffix && <Text style={[styles.suffix, { color: theme.secondary }]}>{suffix}</Text>}
      </View>

      <View style={styles.separator}>
        <Text style={[styles.separatorText, { color: theme.text }]}>-</Text>
      </View>

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.card,
            borderColor: hasError ? theme.error : theme.border
          }
        ]}
      >
        <TextInput
          style={[styles.input, { color: theme.text }]}
          value={value[1]}
          onChangeText={handleMaxChange}
          placeholder={maxPlaceholder}
          placeholderTextColor={theme.secondary}
          keyboardType="numeric"
          returnKeyType="done"
          autoCorrect={false}
        />
        {suffix && <Text style={[styles.suffix, { color: theme.secondary }]}>{suffix}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  suffix: {
    fontSize: 14,
    marginLeft: 4,
  },
  separator: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separatorText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default RangeInput;
