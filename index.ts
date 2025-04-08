import { registerRootComponent } from 'expo';
import { initSentry } from './src/utils/sentry';
import App from './App';

// Инициализация Sentry для отслеживания ошибок
// Примечание: необходимо добавить DSN из панели Sentry в файл sentry.ts
// для полноценной работы отслеживания ошибок
initSentry();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
