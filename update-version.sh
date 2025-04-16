#!/bin/bash

# Скрипт для автоматического обновления версии и создания тега

# Проверка наличия аргумента версии
if [ -z "$1" ]; then
    echo "Использование: ./update-version.sh НОВАЯ_ВЕРСИЯ"
    echo "Примеры: "
    echo "  - Мажорное обновление:  ./update-version.sh 0.9.0"
    echo "  - Минорное обновление:  ./update-version.sh 0.8.1"
    echo "  - Микро-обновление:   ./update-version.sh 0.8.0.1"
    exit 1
fi

NEW_VERSION=$1

# Получение текущей версии из package.json
CURRENT_VERSION=$(grep -o '"version": "[^"]*"' package.json | cut -d '"' -f 4)

echo "Обновление версии: $CURRENT_VERSION -> $NEW_VERSION"

# Обновление package.json (поддержка 4-х компонентных версий)
sed -i '' "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\(\.[0-9]*\)\{0,1\}\",/\"version\": \"$NEW_VERSION\",/" package.json

# Обновление app.json
sed -i '' "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\(\.[0-9]*\)\{0,1\}\",/\"version\": \"$NEW_VERSION\",/" app.json

# Обновление android/app/build.gradle
sed -i '' "s/versionName \"[0-9]*\.[0-9]*\.[0-9]*\(\.[0-9]*\)\{0,1\}\"/versionName \"$NEW_VERSION\"/" android/app/build.gradle

# Обновление versionCode (увеличение на 1)
CURRENT_VERSION_CODE=$(grep -o 'versionCode [0-9]*' android/app/build.gradle | awk '{print $2}')
NEW_VERSION_CODE=$((CURRENT_VERSION_CODE + 1))
sed -i '' "s/versionCode $CURRENT_VERSION_CODE/versionCode $NEW_VERSION_CODE/" android/app/build.gradle

# Установка зависимостей для обновления package-lock.json
npm install

# Создание коммита
git add package.json app.json android/app/build.gradle package-lock.json
git commit -m "Версия $NEW_VERSION: обновление номера версии"

# Создание тега
git tag -a "v$NEW_VERSION" -m "Версия $NEW_VERSION"

echo "\n✅ Версия обновлена: $CURRENT_VERSION → $NEW_VERSION"
echo "✅ Андроид versionCode: $CURRENT_VERSION_CODE → $NEW_VERSION_CODE"
echo "✅ Создан тег: v$NEW_VERSION"
echo "\nℹ️ Чтобы отправить изменения на GitHub и запустить сборку, выполните:"
echo "git push origin main && git push origin v$NEW_VERSION"
