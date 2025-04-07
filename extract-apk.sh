#!/bin/bash

# Простой скрипт для извлечения APK из эмулятора Android
# Автор: Cascade

# Путь к проекту и выходным файлам
OUTPUT_DIR="/Users/savaleserg/Desktop"
APP_VERSION="0.3.0"
OUTPUT_FILE="$OUTPUT_DIR/DomGoMobile-v$APP_VERSION-user.apk"

# Путь к инструментам Android
ADB="/Users/savaleserg/Library/Android/sdk/platform-tools/adb"

echo "=== Извлечение APK для DomGoMobile версии $APP_VERSION ==="

# Проверяем, запущен ли эмулятор
echo "Проверяем подключение к эмулятору..."
$ADB devices | grep emulator > /dev/null
if [ $? -ne 0 ]; then
  echo "❌ Эмулятор не найден. Запустите эмулятор Android и приложение DomGoMobile перед использованием скрипта."
  exit 1
fi

# Получаем путь к APK в эмуляторе
echo "Ищем путь к установленному APK..."
APK_PATH=$($ADB shell pm path com.anonymous.DomGoMobile | grep -o "package:.*" | sed "s/package://")

if [ -z "$APK_PATH" ]; then
  echo "❌ Приложение DomGoMobile не найдено в эмуляторе. Сначала установите приложение."
  exit 1
fi

# Извлекаем APK файл
echo "✅ Приложение найдено. Извлекаем APK..."
$ADB pull "$APK_PATH" "$OUTPUT_FILE"

# Проверяем, что файл был извлечен
if [ -f "$OUTPUT_FILE" ]; then
    # Создаем информацию о версии
    INFO_FILE="$OUTPUT_DIR/DomGoMobile-v$APP_VERSION-info.txt"
    echo "DomGoMobile версия $APP_VERSION (из эмулятора)" > "$INFO_FILE"
    echo "Дата извлечения: $(date)" >> "$INFO_FILE"
    echo "APK сохранен на рабочий стол: $OUTPUT_FILE" >> "$INFO_FILE"
    echo "Размер файла: $(du -h "$OUTPUT_FILE" | cut -f1)" >> "$INFO_FILE"
    
    echo "=== ✅ APK успешно извлечен! ==="
    echo "Файл сохранен: $OUTPUT_FILE"
    echo "Информация: $INFO_FILE"
else
    echo "❌ Ошибка: APK не был извлечен. Проверьте подключение к эмулятору."
    exit 1
fi
