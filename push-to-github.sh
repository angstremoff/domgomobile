#!/bin/bash

# Скрипт для быстрой загрузки изменений на GitHub
# После загрузки Expo автоматически запустит сборку

# Переходим в директорию проекта
cd /Users/savaleserg/CascadeProjects/DomGoMobile

echo "===== Загрузка DomGoMobile на GitHub ====="

# Проверяем наличие изменений
if ! git status --porcelain | grep -q .; then
  echo "❌ Нет изменений для отправки на GitHub"
  exit 0
fi

# Показываем статус
echo "Изменения для отправки:"
git status -s

# Запрашиваем сообщение коммита
echo ""
echo "Введите сообщение коммита:"
read -r commit_message

# Если сообщение пустое, используем стандартное
if [ -z "$commit_message" ]; then
  commit_message="Обновление проекта DomGoMobile"
fi

# Добавляем все изменения и коммитим
echo "Добавляем изменения в Git..."
git add .
git commit -m "$commit_message"

# Отправляем на GitHub
echo "Отправляем изменения на GitHub..."
git push

echo "✅ Готово! Изменения загружены на GitHub."
echo "Expo автоматически запустит сборку согласно настройкам."
echo "Вы можете проверить статус сборки на https://expo.dev"
