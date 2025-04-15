#!/bin/bash

# Проверка наличия аргумента версии
if [ -z "$1" ]; then
    echo "Использование: ./release.sh НОВАЯ_ВЕРСИЯ"
    echo "Пример: ./release.sh 0.7.9"
    exit 1
fi

NEW_VERSION=$1

# Запуск скрипта обновления версии
./update-version.sh $NEW_VERSION

# Отправка изменений на GitHub
git push origin main && git push origin "v$NEW_VERSION"

# Выводим сообщение о создании релиза
echo "✅ Релиз v$NEW_VERSION отправлен на GitHub"
echo "⏳ Ожидайте завершения автоматической сборки APK..."
echo "📱 APK будет доступен по адресу: https://github.com/angstremoff/domgomobile/releases/tag/v$NEW_VERSION"
