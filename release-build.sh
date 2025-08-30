#!/bin/bash

# Проверка наличия аргумента версии
if [ -z "$1" ]; then
    echo "Использование: ./release-build.sh НОВАЯ_ВЕРСИЯ"
    echo "Пример: ./release-build.sh 0.8.1"
    exit 1
fi

NEW_VERSION=$1
RELEASE_APK="android/app/build/outputs/apk/release/app-release.apk"
DESTINATION_APK="releases/DomGo-${NEW_VERSION}.apk"
STABLE_APK="releases/domgo.apk"

# 1. Обновляем версию
echo "📝 Обновляем версию до $NEW_VERSION..."
./update-version.sh $NEW_VERSION

# 2. Создаем директорию для релизов, если её нет
mkdir -p releases

# 3. Собираем релизную версию APK
echo "🔨 Собираем релизную версию APK..."
cd android && ./gradlew assembleRelease && cd ..

# 4. Копируем и переименовываем APK
if [ -f "$RELEASE_APK" ]; then
    echo "📦 Копируем APK в releases/DomGo-${NEW_VERSION}.apk"
    cp "$RELEASE_APK" "$DESTINATION_APK"
    echo "📦 Копируем APK также в $STABLE_APK (стабильное имя без версии)"
    cp "$RELEASE_APK" "$STABLE_APK"
    
    # 5. Выводим размер файла
    SIZE=$(du -h "$DESTINATION_APK" | cut -f1)
    SIZE_STABLE=$(du -h "$STABLE_APK" | cut -f1)
    echo "✅ Готово! Размер APK: $SIZE"
    echo "✅ Стабильный файл: $STABLE_APK ($SIZE_STABLE)"
    echo "📱 APK файл: $DESTINATION_APK"
    
    # 6. Отправляем изменения версии в репозиторий
    echo "🚀 Отправляем изменения в репозиторий..."
    git push origin main && git push origin "v$NEW_VERSION"
    
    echo ""
    echo "📝 Для создания релиза на GitHub перейдите по ссылке:"
    echo "https://github.com/angstremoff/domgomobile/releases/new?tag=v$NEW_VERSION"
    echo "и загрузите файл $DESTINATION_APK"
else
    echo "❌ Ошибка: APK файл не был создан!"
    exit 1
fi
