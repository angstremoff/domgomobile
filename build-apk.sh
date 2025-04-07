#!/bin/bash

# Скрипт для локальной сборки APK без использования сервера Expo

# Путь к проекту
PROJECT_PATH="/Users/savaleserg/CascadeProjects/DomGoMobile"

# Путь для выходного APK файла
OUTPUT_DIR="/Users/savaleserg/Desktop"
APP_VERSION="0.3.0" # Берем версию из app.json
OUTPUT_FILE="$OUTPUT_DIR/DomGoMobile-v$APP_VERSION-dev.apk"

# Переходим в директорию проекта
cd "$PROJECT_PATH" || { echo "Ошибка: Не удалось перейти в директорию проекта"; exit 1; }

echo "Начинаем сборку локального APK для DomGoMobile версии $APP_VERSION..."

# Устанавливаем переменные окружения для Android SDK
export ANDROID_HOME=~/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Создаем директорию для бандла
mkdir -p android/app/src/main/assets

# Создаем React Native бандл
echo "Создаем React Native бандл для Android..."
npx react-native bundle --platform android --dev false --entry-file index.ts --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/

# Очищаем предыдущие сборки
echo "Очищаем предыдущие сборки..."
cd android && ./gradlew clean

# Собираем APK для разработки
echo "Собираем девелоперский APK..."
./gradlew assembleDebug

# Проверяем, что сборка прошла успешно
if [ -f "$PROJECT_PATH/android/app/build/outputs/apk/debug/app-debug.apk" ]; then
    # Копируем APK на рабочий стол
    echo "Копируем APK на рабочий стол: $OUTPUT_FILE"
    cp "$PROJECT_PATH/android/app/build/outputs/apk/debug/app-debug.apk" "$OUTPUT_FILE"
    
    # Создаем информацию о версии
    INFO_FILE="$OUTPUT_DIR/DomGoMobile-v$APP_VERSION-info.txt"
    echo "DomGoMobile версия $APP_VERSION (dev)" > "$INFO_FILE"
    echo "Дата сборки: $(date)" >> "$INFO_FILE"
    echo "APK сохранен на рабочем столе: $OUTPUT_FILE" >> "$INFO_FILE"
    echo "Размер файла: $(du -h "$OUTPUT_FILE" | cut -f1)" >> "$INFO_FILE"
    
    echo "\nГотово! APK сохранен на рабочем столе: $OUTPUT_FILE"
    echo "Информация о приложении сохранена: $INFO_FILE"
    echo "Размер файла: $(du -h "$OUTPUT_FILE" | cut -f1)"
else
    echo "Ошибка: APK не был создан. Проверьте логи сборки."
    exit 1
fi

