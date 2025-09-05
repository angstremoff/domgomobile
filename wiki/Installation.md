# ⚙️ Установка и настройка DomGoMobile

## 📋 Системные требования

### Обязательные компоненты:
- **Node.js** >= 18.0.0 (рекомендуется v23.7.0)
- **npm** >= 8.0.0 (текущая v10.9.2)
- **Git** для версионного контроля
- **Expo CLI** для разработки

### Для Android разработки:
- **Android Studio** с Android SDK 31+
- **Java Development Kit (JDK)** 11 или 17
- **Android Emulator** или физическое устройство с USB отладкой

### Для iOS разработки (только macOS):
- **Xcode** >= 14.0
- **iOS Simulator** или физическое устройство
- **CocoaPods** для управления зависимостями

## 🚀 Быстрая установка

### 1. Клонирование репозитория
```bash
git clone https://github.com/angstremoff/domgomobile.git
cd domgomobile
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка переменных окружения
```bash
# Копируем шаблон файла окружения
cp .env.example .env

# Редактируем переменные
nano .env
```

### 4. Запуск приложения
```bash
npm start
```

## 🔧 Детальная настройка

### Конфигурация .env файла
```bash
# Supabase Configuration
SUPABASE_URL=https://bondvgkachyjxqxsrcvj.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps API Key (для Android карт)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Sentry Configuration (опционально для мониторинга)
SENTRY_DSN=your_sentry_dsn

# Environment
NODE_ENV=development
```

### Настройка Supabase

#### 1. Создание проекта
1. Зарегистрируйтесь на [supabase.com](https://supabase.com)
2. Создайте новый проект или используйте существующий
3. Скопируйте URL и anon key в .env файл

#### 2. Установка Supabase CLI
```bash
npm install -g @supabase/cli

# Логин в Supabase
supabase login

# Связывание с проектом
supabase link --project-ref bondvgkachyjxqxsrcvj
```

#### 3. Настройка базы данных
```bash
# Применение миграций
supabase db reset

# Генерация TypeScript типов
supabase gen types typescript --project-id bondvgkachyjxqxsrcvj > src/lib/database.types.ts
```

### Настройка Android окружения

#### 1. Установка Android Studio
1. Скачайте с [официального сайта](https://developer.android.com/studio)
2. Установите Android SDK (API Level 31+)
3. Настройте Android Virtual Device (AVD)

#### 2. Переменные окружения
```bash
# Добавьте в ~/.bashrc или ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

#### 3. Проверка установки
```bash
# Проверяем Android SDK
android --version

# Список эмуляторов
emulator -list-avds

# Запуск эмулятора
emulator -avd Pixel_5_API_31
```

### Настройка iOS окружения (macOS только)

#### 1. Установка Xcode
```bash
# Из App Store или Developer Portal
# Установка Command Line Tools
xcode-select --install
```

#### 2. Установка CocoaPods
```bash
sudo gem install cocoapods

# Установка pods для iOS (если требуется)
cd ios && pod install && cd ..
```

## 🧪 Проверка установки

### Проверка зависимостей
```bash
# Проверяем Expo CLI
expo --version

# Проверяем React Native
npx react-native --version

# Проверяем TypeScript
npx tsc --version
```

### Запуск тестов
```bash
# Компиляция TypeScript
npx tsc --noEmit

# Линтинг кода
npx eslint src/

# Форматирование кода
npx prettier --check src/
```

### Тестовая сборка
```bash
# Локальная Android сборка
./build-local-apk.sh

# Или через EAS
npx eas build --platform android --profile development
```

## 🎯 Команды разработки

### Основные команды
```bash
# Запуск Metro bundler
npm start

# Запуск на Android
npm run android

# Запуск на iOS (только macOS)
npm run ios

# Запуск в браузере
npm run web

# Запуск Android эмулятора
npm run android:emu
```

### Полезные скрипты
```bash
# Очистка кэша
npx expo start --clear

# Проверка совместимости зависимостей
npx expo install --check

# Обновление Expo SDK
npx expo upgrade
```

## 🐛 Устранение типичных проблем

### Metro bundler не запускается
```bash
# Очистка кэша Metro
npx react-native start --reset-cache

# Очистка npm кэша
npm cache clean --force

# Переустановка зависимостей
rm -rf node_modules package-lock.json
npm install
```

### Android сборка падает
```bash
# Очистка Gradle кэша
cd android && ./gradlew clean && cd ..

# Проверка Java версии
java -version

# Исправление Gradle wrapper
./fix-gradle-build.sh
```

### Проблемы с permissions на Android
```bash
# Проверка прав в AndroidManifest.xml
# Добавление недостающих permissions
```

### iOS сборка не работает
```bash
# Очистка iOS build
rm -rf ios/build

# Обновление pods
cd ios && pod install --repo-update && cd ..

# Очистка Xcode cache
rm -rf ~/Library/Developer/Xcode/DerivedData
```

## 🔄 Обновление проекта

### Обновление зависимостей
```bash
# Проверка устаревших пакетов
npm outdated

# Обновление в рамках семантических версий
npm update

# Обновление Expo SDK
npx expo upgrade
```

### Миграция версий
```bash
# Создание бэкапа
git checkout -b backup-before-upgrade

# Обновление package.json
# Тестирование функциональности
npm test

# Коммит изменений
git add .
git commit -m "chore: обновление зависимостей"
```

## 💡 Рекомендации

### IDE и расширения
- **Visual Studio Code** с React Native Tools
- **WebStorm** для продвинутой разработки
- **Flipper** для отладки React Native

### Полезные инструменты
- **React Native Debugger** для отладки
- **Reactotron** для мониторинга состояния
- **Sentry** для отслеживания ошибок

### Оптимизация производительности
- Используйте development builds для быстрой разработки
- Настройте hot reloading для мгновенных изменений
- Оптимизируйте bundle size через code splitting