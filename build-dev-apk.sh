#!/bin/bash

# Скрипт для сборки dev APK 
# Автор: Cascade

# Переходим в директорию проекта
cd /Users/savaleserg/CascadeProjects/DomGoMobile

echo "=== Сборка Development APK для DomGoMobile ==="

# Запускаем сборку в профиле development
npx eas build --platform android --profile development --local --output=/Users/savaleserg/Desktop/DomGoMobile-dev.apk

if [ -f "/Users/savaleserg/Desktop/DomGoMobile-dev.apk" ]; then
    echo "✅ APK успешно собран и сохранен на рабочий стол"
else
    echo "❌ Ошибка при сборке APK"
fi
