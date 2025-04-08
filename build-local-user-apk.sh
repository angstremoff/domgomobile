#!/bin/bash

# Скрипт для локальной сборки APK для пользователей
# Автор: Cascade

# Путь к проекту
PROJECT_DIR="/Users/savaleserg/CascadeProjects/DomGoMobile"
OUTPUT_DIR="/Users/savaleserg/Desktop"
APP_VERSION=$(grep -m 1 '"version":' "$PROJECT_DIR/app.json" | awk -F: '{ print $2 }' | sed 's/[", ]//g')
OUTPUT_FILE="$OUTPUT_DIR/DomGoMobile-v$APP_VERSION-release.apk"

# Функция для проверки результата команды
check_result() {
  if [ $? -ne 0 ]; then
    echo "❌ Ошибка: $1"
    exit 1
  fi
}

# Начинаем процесс сборки
echo "===== Сборка APK для пользователей ====="
echo "Версия: $APP_VERSION"

# Переходим в каталог проекта
cd "$PROJECT_DIR" || { echo "❌ Ошибка: Не удалось перейти в директорию проекта"; exit 1; }

# Настройка переменных окружения для Android SDK
export ANDROID_SDK_ROOT="/Users/savaleserg/Library/Android/sdk"
export ANDROID_HOME="/Users/savaleserg/Library/Android/sdk"
export PATH="$PATH:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/tools"

# Создаем local.properties если его нет
if [ ! -f "./android/local.properties" ]; then
  echo "➡️ Создаем local.properties..."
  echo "sdk.dir=/Users/savaleserg/Library/Android/sdk" > ./android/local.properties
  check_result "Не удалось создать local.properties"
fi

# Устанавливаем зависимости
echo "➡️ Устанавливаем зависимости..."
npm install
check_result "Не удалось установить зависимости"

# Подготавливаем проект для Android
echo "➡️ Подготавливаем проект для Android..."
npx expo prebuild --platform android --clean
check_result "Не удалось подготовить проект для Android"

# Собираем релизную версию APK
echo "➡️ Собираем релизную версию APK..."
cd android && ./gradlew assembleRelease
check_result "Не удалось собрать APK"

# Копируем APK файл на рабочий стол
echo "➡️ Копируем APK на рабочий стол..."
mkdir -p "$OUTPUT_DIR"
cp ./app/build/outputs/apk/release/app-release.apk "$OUTPUT_FILE"
check_result "Не удалось скопировать APK файл"

# Создаем текстовый файл с информацией о сборке
INFO_FILE="$OUTPUT_DIR/DomGoMobile-v$APP_VERSION-info.txt"
echo "DomGoMobile версия $APP_VERSION" > "$INFO_FILE"
echo "Дата сборки: $(date)" >> "$INFO_FILE"
echo "Тип сборки: релизная версия для пользователей" >> "$INFO_FILE" 
echo "Размер файла: $(du -h "$OUTPUT_FILE" | cut -f1)" >> "$INFO_FILE"

echo "===== Сборка завершена успешно! ====="
echo "APK файл: $OUTPUT_FILE"
echo "Информация: $INFO_FILE"
