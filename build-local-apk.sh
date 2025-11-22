#!/bin/bash

# Скрипт для локальной сборки APK проекта Expo
# Автор: Cascade

# Путь к проекту
PROJECT_DIR="$(pwd)"
# Путь для выходного APK файла
OUTPUT_DIR="$HOME/Desktop"

# Получаем версию из package.json
APP_VERSION=$(grep -m 1 '"version":' $PROJECT_DIR/package.json | awk -F: '{ print $2 }' | sed 's/[", ]//g')
OUTPUT_FILE="$OUTPUT_DIR/DomGoMobile-v$APP_VERSION-user.apk"

echo "=== Сборка локального APK для DomGoMobile версии $APP_VERSION ==="

# Переходим в директорию проекта
cd "$PROJECT_DIR" || { echo "Ошибка: Не удалось перейти в директорию проекта"; exit 1; }

# Проверяем наличие необходимых зависимостей
echo "Проверяем наличие необходимых инструментов..."
if ! command -v npx &> /dev/null; then
    echo "Ошибка: npx не найден. Установите Node.js и npm."
    exit 1
fi

# Предварительно подготавливаем проект для сборки
echo "Подготавливаем проект для нативной сборки..."
echo "y" | npx expo prebuild --clean

# Создаем local.properties с правильным путем к SDK
echo "Устанавливаем путь к Android SDK..."
SDK_PATH="$HOME/Library/Android/sdk"
echo "sdk.dir=$SDK_PATH" > "$PROJECT_DIR/android/local.properties"
echo "ANDROID_SDK_ROOT=$SDK_PATH" >> "$PROJECT_DIR/.env.local"
export ANDROID_HOME=$SDK_PATH
export ANDROID_SDK_ROOT=$SDK_PATH

# Переходим в директорию Android
cd android || { echo "Ошибка: Не удалось перейти в директорию android"; exit 1; }

# Очищаем предыдущие сборки
echo "Очищаем предыдущие сборки..."
./gradlew clean

# Собираем APK
echo "Собираем APK для пользователей..."
./gradlew assembleRelease

# Проверяем, что сборка прошла успешно
if [ -f "$PROJECT_DIR/android/app/build/outputs/apk/release/app-release.apk" ]; then
    # Копируем APK на рабочий стол
    echo "Копируем APK на рабочий стол: $OUTPUT_FILE"
    cp "$PROJECT_DIR/android/app/build/outputs/apk/release/app-release.apk" "$OUTPUT_FILE"
    
    # Создаем информацию о версии
    INFO_FILE="$OUTPUT_DIR/DomGoMobile-v$APP_VERSION-info.txt"
    echo "DomGoMobile версия $APP_VERSION (для пользователей)" > "$INFO_FILE"
    echo "Дата сборки: $(date)" >> "$INFO_FILE"
    echo "APK сохранен на рабочем столе: $OUTPUT_FILE" >> "$INFO_FILE"
    echo "Размер файла: $(du -h "$OUTPUT_FILE" | cut -f1)" >> "$INFO_FILE"
    
    echo "=== Сборка APK успешно завершена! ==="
    echo "Файл сохранен: $OUTPUT_FILE"
    echo "Информация о сборке: $INFO_FILE"
else
    echo "Ошибка: APK не был создан. Проверьте логи сборки."
    exit 1
fi
