# 🏠 DomGoMobile

<div align="center">

![DomGoMobile Logo](./assets/icon.png)

**Современное мобильное приложение для поиска и размещения объявлений о недвижимости**

[![Version](https://img.shields.io/badge/version-0.9.2-blue.svg)](./package.json)
[![React Native](https://img.shields.io/badge/React%20Native-0.76.9-61DAFB.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-52.0.47-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.39.3-3ECF8E.svg)](https://supabase.com/)

[📖 **Wiki Documentation**](./WIKI.md) • [🚀 **Quick Start**](#быстрый-старт) • [🤝 **Contributing**](#участие-в-проекте)

</div>

## ✨ О проекте

**DomGoMobile** - это кросс-платформенное мобильное приложение для поиска и размещения объявлений о недвижимости, созданное с использованием современного стека технологий React Native + Expo + Supabase.

### 🎯 Ключевые особенности
- 🔍 **Умный поиск** с продвинутой фильтрацией
- ❤️ **Система избранного** для сохранения объектов
- 📝 **Легкое создание объявлений** с фото
- 🗺️ **Интерактивная карта** с геолокацией
- 🌍 **Мультиязычность** (русский/сербский)
- 🏢 **Поддержка агентств** недвижимости
- 🔐 **Безопасность данных** через Supabase

## 📱 Скриншоты

<div align="center">
  <img src="./assets/screenshots/home.png" width="200" alt="Главная" />
  <img src="./assets/screenshots/search.png" width="200" alt="Поиск" />
  <img src="./assets/screenshots/detail.png" width="200" alt="Детали" />
  <img src="./assets/screenshots/profile.png" width="200" alt="Профиль" />
</div>

## 🚀 Быстрый старт

### Предварительные требования
- Node.js 18.0+ (рекомендуется v23.7.0)
- npm 10.9.2+
- Android Studio (для Android разработки)
- Xcode (для iOS разработки, только macOS)

### Установка
```bash
# Клонирование репозитория
git clone https://github.com/angstremoff/domgomobile.git
cd domgomobile

# Установка зависимостей
npm install

# Настройка окружения
cp .env.example .env
# Отредактируйте .env файл с вашими ключами

# Запуск приложения
npm start
```

### Сборка APK
```bash
# Быстрая локальная сборка
./build-simple-apk.sh

# Полная оптимизированная сборка
./build-local-apk.sh
```

## 🛠️ Технологический стек

<table>
<tr>
<td align="center"><strong>Frontend</strong></td>
<td align="center"><strong>Backend</strong></td>
<td align="center"><strong>DevOps</strong></td>
</tr>
<tr>
<td>

- React Native 0.76.9
- Expo ~52.0.47  
- TypeScript ^5.9.2
- React Navigation 6.x
- React Native Maps
- i18next (локализация)

</td>
<td>

- Supabase (BaaS)
- PostgreSQL
- Row Level Security
- Real-time subscriptions
- Storage (изображения)

</td>
<td>

- EAS Build
- GitHub Actions
- Sentry (мониторинг)
- Expo Updates (OTA)

</td>
</tr>
</table>

## 📚 Документация

Полная документация проекта доступна в **[Wiki](./WIKI.md)**:

| Раздел | Описание |
|--------|---------|
| 📋 [Обзор проекта](./wiki/Project-Overview.md) | Цели, аудитория, функциональность |
| ⚙️ [Установка](./wiki/Installation.md) | Настройка окружения и запуск |
| 🏗️ [Архитектура](./wiki/Architecture.md) | Техническая архитектура системы |
| 🚀 [Разработка](./wiki/Development.md) | Руководство для разработчиков |
| 🗄️ [База данных](./wiki/Database.md) | Схема БД и миграции |
| 🐛 [Устранение неполадок](./wiki/Troubleshooting.md) | Решение типичных проблем |
| ❓ [FAQ](./wiki/FAQ.md) | Часто задаваемые вопросы |

## 🤝 Участие в проекте

Мы приветствуем вклад в развитие DomGoMobile! 

### Как внести вклад:
1. **Fork** репозитория
2. Создайте **ветку** для новой функции (`git checkout -b feature/amazing-feature`)
3. **Коммитьте** изменения (`git commit -m 'feat: добавлена потрясающая функция'`)
4. **Push** в ветку (`git push origin feature/amazing-feature`)
5. Откройте **Pull Request**

### Стандарты разработки:
- 📝 Используйте **TypeScript** для всего нового кода
- 🧪 Добавляйте **тесты** для новой функциональности
- 📖 Обновляйте **документацию**
- 🎨 Следуйте **ESLint** правилам проекта
- 🇷🇺 Комментарии и документация на **русском языке**

## 📊 Статус проекта

| Параметр | Значение |
|----------|----------|
| 📦 Версия | 0.9.2 |
| 🚀 Статус | В активной разработке |
| 📱 Платформы | Android, iOS |
| 🌍 Языки | Русский, Сербский |
| 🏗️ Архитектура | React Native + Expo + Supabase |

## 🔗 Полезные ссылки

- 📱 [Скачать APK](./domgo.apk) - Последняя версия для Android
- 📖 [Полная документация](./WIKI.md) - Wiki проекта
- 🗄️ [Схема базы данных](./DATABASE_SCHEMA.md) - Структура БД
- 📋 [Правила разработки](./RULES.md) - Стандарты проекта
- 🐛 [Сообщить о баге](https://github.com/angstremoff/domgomobile/issues) - GitHub Issues

## 🎯 Дорожная карта

### v1.0 (Ближайшие планы)
- [ ] Push-уведомления
- [ ] Улучшенные фильтры поиска
- [ ] Веб-версия приложения
- [ ] Система рейтингов и отзывов

### v2.0 (Долгосрочные планы)
- [ ] ИИ-рекомендации объектов
- [ ] Встроенный чат с продавцами
- [ ] Аналитика рынка недвижимости
- [ ] Поддержка дополнительных языков

## Лицензия | Licenca

© 2025 DomGo. Все права защищены.
