import { useEffect } from 'react';
import { useAlerts } from './AlertProvider';
import { setAlertFunctions } from '../utils/alertUtils';

/**
 * Компонент для инициализации AlertProvider
 * Устанавливает функции алертов в alertUtils.ts
 */
const AlertInitializer = () => {
  const alertFunctions = useAlerts();

  useEffect(() => {
    // Устанавливаем функции алертов в alertUtils.ts
    setAlertFunctions(alertFunctions);
  }, [alertFunctions]);

  return null;
};

export default AlertInitializer;
