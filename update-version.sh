#!/bin/bash

# Скрипт для автоматического обновления версии и создания тега

# Проверка наличия аргумента версии
if [ -z "$1" ]; then
    echo "Использование: ./update-version.sh НОВАЯ_ВЕРСИЯ"
    echo "Пример: ./update-version.sh 0.7.7"
    exit 1
fi

NEW_VERSION=$1

# Обновление package.json
sed -i '' "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\",/\"version\": \"$NEW_VERSION\",/" package.json

# Обновление app.json
sed -i '' "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\",/\"version\": \"$NEW_VERSION\",/" app.json

# Обновление android/app/build.gradle
sed -i '' "s/versionName \"[0-9]*\.[0-9]*\.[0-9]*\"/versionName \"$NEW_VERSION\"/" android/app/build.gradle

# Установка зависимостей для обновления package-lock.json
npm install

# Создание коммита
git add package.json app.json android/app/build.gradle package-lock.json
git commit -m "Версия $NEW_VERSION: обновление номера версии"

# Создание тега
git tag -a "v$NEW_VERSION" -m "Версия $NEW_VERSION"

echo "Версия обновлена до $NEW_VERSION, создан тег v$NEW_VERSION"
echo "Чтобы отправить изменения на GitHub и запустить сборку, выполните:"
echo "git push origin main && git push origin v$NEW_VERSION"
