import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import * as Sentry from '@sentry/react-native';
import Colors from '../constants/colors';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Компонент-обертка для отлавливания ошибок рендеринга в React компонентах
 * и предотвращения падения всего приложения
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Обновляем состояние, чтобы при следующем рендере показать запасной UI
    return { hasError: true, errorMessage: error.message || 'Произошла неизвестная ошибка' };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Логируем ошибку в Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack
        }
      }
    });
    
    console.error('Ошибка рендеринга компонента:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, errorMessage: '' });
  }

  render() {
    if (this.state.hasError) {
      // Показываем запасной UI
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Произошла ошибка</Text>
          <Text style={styles.message}>{this.state.errorMessage}</Text>
          <View style={styles.buttonContainer}>
            <Button
              title="Попробовать снова"
              onPress={this.resetError}
              color={Colors.light.primary}
            />
          </View>
          <Text style={styles.info}>
            Ошибка была автоматически отправлена в службу поддержки
          </Text>
        </View>
      );
    }

    // Если ошибки нет, рендерим дочерние компоненты как обычно
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.light.text,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: Colors.light.text,
  },
  buttonContainer: {
    marginBottom: 20,
    width: '80%',
  },
  info: {
    fontSize: 12,
    color: Colors.light.secondary,
    textAlign: 'center',
  },
});

export default ErrorBoundary;
