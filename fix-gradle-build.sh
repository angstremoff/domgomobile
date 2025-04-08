#!/bin/bash

# Скрипт для исправления проблем с Gradle при сборке APK
# Автор: Cascade

PROJECT_DIR="/Users/savaleserg/CascadeProjects/DomGoMobile"

# Переходим в проект
cd "$PROJECT_DIR" || exit 1

# Очищаем кэш Gradle
echo "Очищаем кэш Gradle..."
cd android && ./gradlew clean && cd ..

# Устанавливаем переменные окружения для Android SDK
export ANDROID_SDK_ROOT="/Users/savaleserg/Library/Android/sdk"
export ANDROID_HOME="/Users/savaleserg/Library/Android/sdk"

# Обновляем скрипт для сборки developer APK (более простой способ)
echo "#!/bin/bash

# Сборка developer APK без излишней сложности
cd /Users/savaleserg/CascadeProjects/DomGoMobile

# Пересоздаем проект для Android
npx expo prebuild --platform android --clean

# Собираем APK
cd android && ./gradlew assembleDebug

# Копируем APK на рабочий стол
mkdir -p ~/Desktop
cp ./app/build/outputs/apk/debug/app-debug.apk ~/Desktop/DomGoMobile-debug.apk

echo 'APK скопирован на рабочий стол: ~/Desktop/DomGoMobile-debug.apk'
" > "$PROJECT_DIR/build-simple-apk.sh"

chmod +x "$PROJECT_DIR/build-simple-apk.sh"

echo "Создан упрощенный скрипт сборки: build-simple-apk.sh"
echo "Запустите его командой: ./build-simple-apk.sh"
