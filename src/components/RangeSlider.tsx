import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  PanResponder, 
  Animated, 
  LayoutChangeEvent, 
  TouchableOpacity,
  TouchableWithoutFeedback
} from 'react-native';
import Colors from '../constants/colors';

interface RangeSliderProps {
  minValue: number;
  maxValue: number;
  step: number | ((value: number) => number);
  initialValue: number[];
  onValueChange: (value: number[]) => void;
  darkMode: boolean;
  formatLabel?: (value: number) => string;
}

const RangeSlider = ({
  minValue,
  maxValue,
  step,
  initialValue,
  onValueChange,
  darkMode,
  formatLabel = (value) => `${value}`
}: RangeSliderProps) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [value, setValue] = useState(initialValue.length === 2 ? initialValue : [minValue, maxValue]);
  const theme = darkMode ? Colors.dark : Colors.light;
  
  const translateMinX = useRef(new Animated.Value(0)).current;
  const translateMaxX = useRef(new Animated.Value(0)).current;
  const offsetMinX = useRef(0);
  const offsetMaxX = useRef(0);
  
  // Обновляем значения при изменении initialValue
  useEffect(() => {
    setValue(initialValue.length === 2 ? initialValue : [minValue, maxValue]);
  }, [initialValue, minValue, maxValue]);

  // Обновляем позиции ползунков при изменении значений
  useEffect(() => {
    if (sliderWidth > 0) {
      const minPosition = ((value[0] - minValue) / (maxValue - minValue)) * sliderWidth;
      const maxPosition = ((value[1] - minValue) / (maxValue - minValue)) * sliderWidth;
      
      translateMinX.setValue(minPosition);
      translateMaxX.setValue(maxPosition);
      
      offsetMinX.current = minPosition;
      offsetMaxX.current = maxPosition;
    }
  }, [sliderWidth, minValue, maxValue, value]);
  
  // Создаем PanResponder для минимального ползунка
  const minPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      translateMinX.extractOffset();
      offsetMinX.current = 0;
    },
    onPanResponderMove: (_, gestureState) => {
      let newX = offsetMinX.current + gestureState.dx;
      
      // Ограничиваем движение в пределах слайдера и не позволяем перейти за максимальный ползунок
      if (newX < 0) newX = 0;
      if (newX > offsetMaxX.current) newX = offsetMaxX.current;
      
      translateMinX.setValue(newX);
      
      // Вычисляем новое значение на основе позиции
      const ratio = newX / sliderWidth;
      const newValue = minValue + ratio * (maxValue - minValue);
      
      // Применяем шаг
      let steppedValue;
      if (typeof step === 'number') {
        steppedValue = Math.round(newValue / step) * step;
      } else {
        // Для переменного шага находим ближайшее значение
        let testValue = minValue;
        while (testValue < newValue && testValue < maxValue) {
          const nextStep = step(testValue);
          if (testValue + nextStep > newValue) break;
          testValue += nextStep;
        }
        steppedValue = testValue;
      }
      
      // Ограничиваем значение в пределах min и max
      steppedValue = Math.max(minValue, Math.min(value[1], steppedValue));
      
      setValue([steppedValue, value[1]]);
      onValueChange([steppedValue, value[1]]);
    },
    onPanResponderRelease: () => {
      translateMinX.flattenOffset();
      
      // Обновляем offsetMinX.current
      const minPosition = ((value[0] - minValue) / (maxValue - minValue)) * sliderWidth;
      offsetMinX.current = minPosition;
    }
  });
  
  // Создаем PanResponder для максимального ползунка
  const maxPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      translateMaxX.extractOffset();
      offsetMaxX.current = 0;
    },
    onPanResponderMove: (_, gestureState) => {
      let newX = offsetMaxX.current + gestureState.dx;
      
      // Ограничиваем движение в пределах слайдера и не позволяем перейти за минимальный ползунок
      if (newX < offsetMinX.current) newX = offsetMinX.current;
      if (newX > sliderWidth) newX = sliderWidth;
      
      translateMaxX.setValue(newX);
      
      // Вычисляем новое значение на основе позиции
      const ratio = newX / sliderWidth;
      const newValue = minValue + ratio * (maxValue - minValue);
      
      // Применяем шаг
      let steppedValue;
      if (typeof step === 'number') {
        steppedValue = Math.round(newValue / step) * step;
      } else {
        // Для переменного шага находим ближайшее значение
        let testValue = minValue;
        while (testValue < newValue && testValue < maxValue) {
          const nextStep = step(testValue);
          if (testValue + nextStep > newValue) break;
          testValue += nextStep;
        }
        steppedValue = testValue;
      }
      
      // Ограничиваем значение в пределах min и max
      steppedValue = Math.max(value[0], Math.min(maxValue, steppedValue));
      
      setValue([value[0], steppedValue]);
      onValueChange([value[0], steppedValue]);
    },
    onPanResponderRelease: () => {
      translateMaxX.flattenOffset();
      
      // Обновляем offsetMaxX.current
      const maxPosition = ((value[1] - minValue) / (maxValue - minValue)) * sliderWidth;
      offsetMaxX.current = maxPosition;
    }
  });

  // Обработчик нажатия на трек для перемещения ползунков
  const handleTrackPress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const ratio = locationX / sliderWidth;
    const newValue = minValue + ratio * (maxValue - minValue);
    
    // Определяем, какой ползунок ближе к точке нажатия
    const minDistance = Math.abs(newValue - value[0]);
    const maxDistance = Math.abs(newValue - value[1]);
    
    let steppedValue;
    if (typeof step === 'number') {
      steppedValue = Math.round(newValue / step) * step;
    } else {
      let testValue = minValue;
      while (testValue < newValue && testValue < maxValue) {
        const nextStep = step(testValue);
        if (testValue + nextStep > newValue) break;
        testValue += nextStep;
      }
      steppedValue = testValue;
    }
    
    // Обновляем положение ближайшего ползунка
    if (minDistance <= maxDistance) {
      steppedValue = Math.max(minValue, Math.min(value[1], steppedValue));
      setValue([steppedValue, value[1]]);
      onValueChange([steppedValue, value[1]]);
      
      const minPosition = ((steppedValue - minValue) / (maxValue - minValue)) * sliderWidth;
      translateMinX.setValue(minPosition);
      offsetMinX.current = minPosition;
    } else {
      steppedValue = Math.max(value[0], Math.min(maxValue, steppedValue));
      setValue([value[0], steppedValue]);
      onValueChange([value[0], steppedValue]);
      
      const maxPosition = ((steppedValue - minValue) / (maxValue - minValue)) * sliderWidth;
      translateMaxX.setValue(maxPosition);
      offsetMaxX.current = maxPosition;
    }
  };

  // Обработчик изменения размера слайдера
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setSliderWidth(width);
    
    // Инициализируем позиции ползунков
    const minPosition = ((value[0] - minValue) / (maxValue - minValue)) * width;
    const maxPosition = ((value[1] - minValue) / (maxValue - minValue)) * width;
    
    translateMinX.setValue(minPosition);
    translateMaxX.setValue(maxPosition);
    
    offsetMinX.current = minPosition;
    offsetMaxX.current = maxPosition;
  };

  // Обработчики для кнопок управления ползунками
  const decreaseMin = () => {
    if (value[0] > minValue) {
      const newValue = typeof step === 'number' 
        ? Math.max(minValue, value[0] - step)
        : Math.max(minValue, value[0] - step(value[0]));
      
      setValue([newValue, value[1]]);
      onValueChange([newValue, value[1]]);
    }
  };

  const increaseMin = () => {
    if (value[0] < value[1]) {
      const newValue = typeof step === 'number'
        ? Math.min(value[1], value[0] + step)
        : Math.min(value[1], value[0] + step(value[0]));
      
      setValue([newValue, value[1]]);
      onValueChange([newValue, value[1]]);
    }
  };

  const decreaseMax = () => {
    if (value[1] > value[0]) {
      const newValue = typeof step === 'number'
        ? Math.max(value[0], value[1] - step)
        : Math.max(value[0], value[1] - step(value[1]));
      
      setValue([value[0], newValue]);
      onValueChange([value[0], newValue]);
    }
  };

  const increaseMax = () => {
    if (value[1] < maxValue) {
      const newValue = typeof step === 'number'
        ? Math.min(maxValue, value[1] + step)
        : Math.min(maxValue, value[1] + step(value[1]));
      
      setValue([value[0], newValue]);
      onValueChange([value[0], newValue]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: theme.text }]}>
          {formatLabel(value[0])} - {formatLabel(value[1])}
        </Text>
      </View>
      
      {/* Слайдер */}
      <TouchableWithoutFeedback onPress={handleTrackPress}>
        <View 
          style={[styles.track, { backgroundColor: theme.border }]} 
          onLayout={handleLayout}
        >
          <Animated.View
            style={[
              styles.fill,
              { 
                left: translateMinX,
                width: Animated.subtract(translateMaxX, translateMinX),
                backgroundColor: theme.primary 
              }
            ]}
          />
          <Animated.View
            style={[
              styles.thumb,
              { 
                transform: [{ translateX: translateMinX }],
                backgroundColor: theme.primary,
                zIndex: 10
              }
            ]}
            {...minPanResponder.panHandlers}
          >
            <View style={styles.touchArea} />
          </Animated.View>
          <Animated.View
            style={[
              styles.thumb,
              { 
                transform: [{ translateX: translateMaxX }],
                backgroundColor: theme.primary,
                zIndex: 10
              }
            ]}
            {...maxPanResponder.panHandlers}
          >
            <View style={styles.touchArea} />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
      
      <View style={styles.minMaxContainer}>
        {/* Минимальное значение с кнопками управления */}
        <View style={styles.valueControlGroup}>
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: theme.primary }]} 
            onPress={decreaseMin}
          >
            <Text style={styles.controlButtonText}>-</Text>
          </TouchableOpacity>
          
          <Text style={[styles.controlValue, { color: theme.text }]}>
            {formatLabel(value[0])}
          </Text>
          
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: theme.primary }]} 
            onPress={increaseMin}
          >
            <Text style={styles.controlButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        
        {/* Максимальное значение с кнопками управления */}
        <View style={styles.valueControlGroup}>
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: theme.primary }]} 
            onPress={decreaseMax}
          >
            <Text style={styles.controlButtonText}>-</Text>
          </TouchableOpacity>
          
          <Text style={[styles.controlValue, { color: theme.text }]}>
            {formatLabel(value[1])}
          </Text>
          
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: theme.primary }]} 
            onPress={increaseMax}
          >
            <Text style={styles.controlButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    marginVertical: 10,
    alignSelf: 'center',
  },
  labelContainer: {
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  track: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    marginVertical: 20,
  },
  fill: {
    height: 8,
    borderRadius: 4,
    position: 'absolute',
  },
  thumb: {
    width: 30,
    height: 30,
    borderRadius: 15,
    position: 'absolute',
    top: -11,
    left: -15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchArea: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  minMaxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  minMaxLabel: {
    fontSize: 12,
  },
  valueControlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  controlValue: {
    marginHorizontal: 10,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default RangeSlider;
