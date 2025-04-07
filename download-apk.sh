#!/bin/bash

# Скрипт для сборки и загрузки APK файла с помощью EAS
# Преимущество: EAS Build правильно настраивает компиляцию и обходит конфликты ресурсов

# Путь к проекту
PROJECT_DIR="/Users/savaleserg/CascadeProjects/DomGoMobile"
# Путь для выходного APK файла
OUTPUT_DIR="/Users/savaleserg/Desktop"

# Получаем версию из app.json
APP_VERSION=$(grep -m 1 '"version":' $PROJECT_DIR/app.json | awk -F: '{ print $2 }' | sed 's/[", ]//g')
OUTPUT_FILE="$OUTPUT_DIR/DomGoMobile-v$APP_VERSION-user.apk"

echo "=== Скачивание APK для DomGoMobile версии $APP_VERSION ==="

# Переходим в директорию проекта
cd "$PROJECT_DIR" || { echo "Ошибка: Не удалось перейти в директорию проекта"; exit 1; }

# Создаем локальный билд и сразу скачиваем артефакт
echo "Запускаем сборку и скачивание APK..."
npx eas build --platform android --profile preview --local --output="$OUTPUT_FILE"

# Проверяем, что файл был создан
if [ -f "$OUTPUT_FILE" ]; then
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
