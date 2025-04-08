#!/bin/bash

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

