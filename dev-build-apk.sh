#!/bin/bash

# Скрипт для создания Development Build APK файла Expo

# Путь к проекту
PROJECT_DIR="/Users/savaleserg/CascadeProjects/DomGoMobile"
# Путь для выходного APK файла
OUTPUT_DIR="/Users/savaleserg/Desktop"

# Получаем версию из app.json
APP_VERSION=$(grep -m 1 '"version":' $PROJECT_DIR/app.json | awk -F: '{ print $2 }' | sed 's/[", ]//g')
OUTPUT_FILE="$OUTPUT_DIR/DomGoMobile-v$APP_VERSION-dev.apk"

echo "=== Создание Development Build APK для DomGoMobile версии $APP_VERSION ==="

# Переходим в директорию проекта
cd "$PROJECT_DIR" || { echo "Ошибка: Не удалось перейти в директорию проекта"; exit 1; }

# Проверяем, запущен ли эмулятор
echo "Проверяем запущенные эмуляторы..."
EMULATOR_NAME=$($ANDROID_HOME/emulator/emulator -list-avds | head -n 1)

if [ -z "$EMULATOR_NAME" ]; then
  echo "Ошибка: Не найден ни один эмулятор Android. Пожалуйста, создайте эмулятор сначала."
  exit 1
fi

# Запускаем сервер Expo
echo "Запускаем сервер Expo в фоновом режиме..."
npx expo start > /dev/null 2>&1 &
EXPO_PID=$!

echo "Ожидаем запуска сервера Expo (20 секунд)..."
sleep 20

# Получаем APK файл из эмулятора
echo "Извлекаем Development Build APK из эмулятора..."
$ANDROID_HOME/platform-tools/adb -e shell "pm path com.anonymous.DomGoMobile" | grep -o "package:.*" | sed "s/package://" | xargs -I {} $ANDROID_HOME/platform-tools/adb -e pull {} $OUTPUT_FILE

# Останавливаем сервер Expo
echo "Останавливаем сервер Expo..."
kill $EXPO_PID

# Проверяем, что файл был создан
if [ -f "$OUTPUT_FILE" ]; then
    # Создаем информацию о версии
    INFO_FILE="$OUTPUT_DIR/DomGoMobile-v$APP_VERSION-info.txt"
    echo "DomGoMobile версия $APP_VERSION (development build)" > "$INFO_FILE"
    echo "Дата сборки: $(date)" >> "$INFO_FILE"
    echo "APK сохранен на рабочем столе: $OUTPUT_FILE" >> "$INFO_FILE"
    echo "Размер файла: $(du -h "$OUTPUT_FILE" | cut -f1)" >> "$INFO_FILE"
    
    echo "=== Сборка APK успешно завершена! ==="
    echo "Файл сохранен: $OUTPUT_FILE"
    echo "Информация о сборке: $INFO_FILE"
else
    echo "Ошибка: APK не был извлечен. Убедитесь, что приложение установлено на эмуляторе."
    exit 1
fi
