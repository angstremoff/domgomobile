#!/bin/bash

# Универсальный скрипт для сборки APK и загрузки на GitHub
# Автор: Cascade

# Основные параметры
PROJECT_DIR="/Users/savaleserg/CascadeProjects/DomGoMobile"
APP_VERSION=$(grep -m 1 '"version":' $PROJECT_DIR/app.json | awk -F: '{ print $2 }' | sed 's/[", ]//g')
OUTPUT_DIR="/Users/savaleserg/Desktop"
OUTPUT_FILE="$OUTPUT_DIR/DomGoMobile-v$APP_VERSION.apk"

# Функция для проверки успешности выполнения команды
check_result() {
  if [ $? -ne 0 ]; then
    echo "❌ Ошибка: $1"
    exit 1
  fi
}

# Начинаем сборку
echo "=== Сборка APK для DomGoMobile версии $APP_VERSION ==="
echo "Подготовка проекта..."

# Переходим в директорию проекта
cd "$PROJECT_DIR" || { echo "❌ Ошибка: Не удалось перейти в директорию проекта"; exit 1; }

# Удаляем старые сборки если они есть
rm -rf ./android/app/build/outputs/apk 2>/dev/null

# Установка зависимостей
echo "Устанавливаем зависимости..."
npm install
check_result "Не удалось установить зависимости"

# Создание local.properties в android директории
echo "Создаем local.properties..."
mkdir -p ./android
echo "sdk.dir=/Users/savaleserg/Library/Android/sdk" > ./android/local.properties
check_result "Не удалось создать local.properties"

# Чистка и прекомпиляция
echo "Запускаем пребилд проекта..."
npx expo prebuild --platform android --clean
check_result "Ошибка пребилда"

# Сборка APK
echo "Собираем APK через Gradle..."
cd android && ./gradlew assembleDebug
check_result "Ошибка сборки APK"

# Копирование APK на рабочий стол
echo "Копируем APK файл на рабочий стол..."
mkdir -p "$OUTPUT_DIR"
cp ./app/build/outputs/apk/debug/app-debug.apk "$OUTPUT_FILE"
check_result "Не удалось скопировать APK файл"

echo "✅ APK файл успешно собран и сохранен: $OUTPUT_FILE"

# Загрузка на GitHub
echo "Хотите загрузить изменения на GitHub? (y/n)"
read -r upload

if [ "$upload" = "y" ]; then
  echo "Загружаем изменения на GitHub..."
  cd "$PROJECT_DIR"
  
  # Проверка наличия изменений
  if git status --porcelain | grep -q .; then
    echo "Добавляем изменения в Git..."
    git add .
    git status
    
    echo "Введите описание коммита:"
    read -r commit_message
    
    git commit -m "$commit_message"
    check_result "Ошибка при создании коммита"
    
    git push
    check_result "Ошибка при загрузке на GitHub"
    
    echo "✅ Изменения успешно загружены на GitHub"
  else
    echo "Нет изменений для загрузки на GitHub"
  fi
fi

echo "=== Сборка и загрузка завершены успешно! ==="
