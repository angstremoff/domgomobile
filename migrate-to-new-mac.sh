#!/bin/bash

# Скрипт миграции настроек разработки DomGoMobile на новый MacBook
# Использование: ./migrate-to-new-mac.sh

echo "🚀 Начинаем миграцию настроек разработки DomGoMobile..."

# 1. Экспорт глобальных npm пакетов
echo "📦 Экспортируем глобальные npm пакеты..."
npm list -g --depth=0 > ~/domgomobile-global-packages.txt
echo "✅ Глобальные пакеты экспортированы в ~/domgomobile-global-packages.txt"

# 2. Создание архива конфигурационных файлов
echo "⚙️ Архивируем конфигурационные файлы..."
cd ~
tar -czf domgomobile-dev-config.tar.gz \
    .zshrc .gitconfig \
    .ssh/id_ed25519 .ssh/id_ed25519.pub .ssh/config \
    2>/dev/null || echo "⚠️ Некоторые файлы отсутствуют, продолжаем..."

echo "✅ Конфигурационные файлы заархивированы в ~/domgomobile-dev-config.tar.gz"

# 3. Создание инструкции по восстановлению
cat > ~/domgomobile-setup-instructions.txt << 'EOF'
ИНСТРУКЦИЯ ПО ВОССТАНОВЛЕНИЮ НАСТРОЕК DOMGOMOBILE НА НОВОМ MACBOOK

1. УСТАНОВКА НЕОБХОДИМЫХ ИНСТРУМЕНТОВ:
   - Установите Node.js с https://nodejs.org/
   - Установите Xcode через App Store (для iOS разработки)
   - Установите Android Studio (для Android разработки)

2. ВОССТАНОВЛЕНИЕ КОНФИГУРАЦИОННЫХ ФАЙЛОВ:
   tar -xzf domgomobile-dev-config.tar.gz -C ~/
   source ~/.zshrc

3. УСТАНОВКА ГЛОБАЛЬНЫХ ПАКЕТОВ:
   npm install -g $(cat domgomobile-global-packages.txt | grep -E "^[├└]─" | sed 's/[├└]─ //' | tr '\n' ' ')

4. НАСТРОЙКА GIT:
   git config --global user.name "ВАШЕ_ИМЯ"
   git config --global user.email "ВАШ_EMAIL"

5. НАСТРОЙКА SSH:
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/id_ed25519
   chmod 644 ~/.ssh/id_ed25519.pub
   ssh-add ~/.ssh/id_ed25519

6. УСТАНОВКА EXPO:
   npm install -g @expo/cli
   npx expo login

7. КЛОНИРОВАНИЕ ПРОЕКТА:
   git clone git@github.com:angstremoff/domgomobile.git
   cd domgomobile
   npm install

8. ЗАПУСК ПРОЕКТА:
   npm start

Готово! Теперь вы можете начать разработку на новом MacBook.
EOF

echo "✅ Инструкция создана в ~/domgomobile-setup-instructions.txt"

# 4. Создание скрипта восстановления на новом MacBook
cat > ~/domgomobile-restore.sh << 'EOF'
#!/bin/bash

# Скрипт восстановления настроек DomGoMobile на новом MacBook
# Использование: ./domgomobile-restore.sh

echo "🔧 Восстанавливаем настройки DomGoMobile на новом MacBook..."

# Проверка наличия архива
if [ ! -f "domgomobile-dev-config.tar.gz" ]; then
    echo "❌ Не найден архив domgomobile-dev-config.tar.gz"
    exit 1
fi

# Восстановление конфигурационных файлов
echo "⚙️ Восстанавливаем конфигурационные файлы..."
tar -xzf domgomobile-dev-config.tar.gz -C ~/
source ~/.zshrc

# Установка глобальных пакетов
echo "📦 Устанавливаем глобальные npm пакеты..."
if [ -f "domgomobile-global-packages.txt" ]; then
    npm install -g $(cat domgomobile-global-packages.txt | grep -E "^[├└]─" | sed 's/[├└]─ //' | tr '\n' ' ')
    echo "✅ Глобальные пакеты установлены"
else
    echo "⚠️ Файл domgomobile-global-packages.txt не найден"
fi

# Настройка SSH
echo "🔐 Настройка SSH..."
chmod 700 ~/.ssh 2>/dev/null || true
chmod 600 ~/.ssh/id_ed25519 2>/dev/null || true
chmod 644 ~/.ssh/id_ed25519.pub 2>/dev/null || true
ssh-add ~/.ssh/id_ed25519 2>/dev/null || true

echo "✅ Настройки восстановлены!"
echo "📖 Прочитайте инструкцию domgomobile-setup-instructions.txt для дальнейших шагов"
EOF

chmod +x ~/domgomobile-restore.sh

echo "✅ Скрипт восстановления создан в ~/domgomobile-restore.sh"

echo ""
echo "🎉 Миграция завершена!"
echo "Скопируйте следующие файлы на ваш новый MacBook:"
echo "  - ~/domgomobile-dev-config.tar.gz"
echo "  - ~/domgomobile-global-packages.txt" 
echo "  - ~/domgomobile-setup-instructions.txt"
echo "  - ~/domgomobile-restore.sh"
echo ""
echo "Затем на новом MacBook запустите: ./domgomobile-restore.sh"