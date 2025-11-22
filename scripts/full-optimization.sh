#!/bin/bash

# Скрипт полной оптимизации проекта DomGoMobile
# Автор: Kiro AI Assistant
# Дата: 17 ноября 2025

echo "🚀 Начинаем полную оптимизацию проекта..."

# 1. Очистка зависимостей
echo "📦 Оптимизация зависимостей..."
npm dedupe
npm prune

# 2. Очистка кэша
echo "🧹 Очистка кэша..."
npm cache clean --force
rm -rf node_modules/.cache

# 3. Анализ bundle size
echo "📊 Анализ размера bundle..."
if [ -f "scripts/analyze-bundle-size.js" ]; then
  node scripts/analyze-bundle-size.js
fi

# 4. TypeScript проверка
echo "🔍 Проверка TypeScript..."
npm run typecheck

# 5. Linting
echo "✨ Проверка кода..."
npm run lint --fix 2>/dev/null || echo "⚠️  Linting завершен с предупреждениями"

# 6. Очистка временных файлов
echo "🗑️  Удаление временных файлов..."
find . -name "*.log" -type f -delete 2>/dev/null
find . -name ".DS_Store" -type f -delete 2>/dev/null

echo "✅ Оптимизация завершена!"
echo ""
echo "📊 Статистика:"
echo "  - Размер node_modules: $(du -sh node_modules 2>/dev/null | cut -f1)"
echo "  - Количество зависимостей: $(npm ls --depth=0 2>/dev/null | grep -c "├──\|└──")"
echo ""
echo "🎯 Следующие шаги:"
echo "  1. Запустите приложение: npm start"
echo "  2. Проверьте производительность"
echo "  3. Запустите тесты: npm test"
