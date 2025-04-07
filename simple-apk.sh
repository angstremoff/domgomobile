#!/bin/bash

# Самый простой скрипт для создания APK
# Автор: Cascade

cd /Users/savaleserg/CascadeProjects/DomGoMobile

echo "=== Простая сборка APK для DomGoMobile ==="
echo "1. Устанавливаем зависимости..."
npm install

echo "2. Запускаем сборку Android..."
# Создаем файл local.properties, если его нет
if [ ! -f "./android/local.properties" ]; then
  echo "sdk.dir=/Users/savaleserg/Library/Android/sdk" > ./android/local.properties
  echo "✅ Создан файл local.properties"
fi

# Запускаем простую сборку без EAS
echo "3. Сборка APK..."
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleDebug

# Копируем APK на рабочий стол
echo "4. Копирование APK на рабочий стол..."
mkdir -p /Users/savaleserg/Desktop
cp ./app/build/outputs/apk/debug/app-debug.apk /Users/savaleserg/Desktop/DomGoMobile-debug.apk

echo "=== Готово! ==="
echo "APK сохранен в: /Users/savaleserg/Desktop/DomGoMobile-debug.apk"
