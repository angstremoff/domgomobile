#!/bin/bash
# Скрипт для создания релиза на GitHub и загрузки APK

# Версия релиза
VERSION="v0.8.3"
# Имя релиза
RELEASE_NAME="Версия 0.8.3"
# Описание релиза
RELEASE_DESCRIPTION="Исправлены глубинные ссылки и улучшен текст шаринга объявлений"
# Путь к APK файлу
APK_PATH="/Users/savaleserg/Downloads/domgo.apk"
# Имя файла для загрузки
APK_NAME="domgo-v0.8.3.apk"
# Репозиторий GitHub
REPO="angstremoff/domgomobile"

# Подтверждаем релиз
echo "Создаем релиз $VERSION для репозитория $REPO"
echo "Описание: $RELEASE_DESCRIPTION"
echo "APK файл: $APK_PATH"
echo "Нажмите Enter для продолжения или Ctrl+C для отмены"
read

# Проверяем наличие файла APK
if [ ! -f "$APK_PATH" ]; then
  echo "Ошибка: APK файл не найден: $APK_PATH"
  exit 1
fi

# Создаем релиз через GitHub API
echo "Открытие браузера для создания релиза..."
open "https://github.com/$REPO/releases/new?tag=$VERSION&title=$RELEASE_NAME&body=$RELEASE_DESCRIPTION"

echo "Теперь загрузите APK файл с помощью формы на GitHub."
echo "Путь к файлу: $APK_PATH"
