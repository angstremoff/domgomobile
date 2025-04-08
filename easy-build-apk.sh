#!/bin/bash

# Самый простой скрипт для сборки APK
# Автор: Cascade

echo "===== Простая сборка APK для DomGoMobile ====="

# Переходим в каталог проекта
cd /Users/savaleserg/CascadeProjects/DomGoMobile

# Создаем APK напрямую через EAS без сложных настроек
echo "Запускаем сборку APK через EAS локально..."
npx eas build --platform android --local

echo "===== Сборка завершена ====="
echo "APK файл должен быть в указанной директории"
