# DomGo.rs - Веб-сайт

Веб-версия приложения DomGoMobile на Next.js 15 с App Router.

## Особенности

- ✅ **Next.js 15** - SSR, SSG, App Router
- ✅ **Tailwind CSS** - Современный минимализм
- ✅ **TypeScript** - Полная типизация
- ✅ **Supabase** - Auth + Database
- ✅ **i18next** - Локализация (RU/SR)
- ✅ **next-themes** - Темная/Светлая тема
- ✅ **SEO оптимизация** - Meta теги, Sitemap, Robots.txt

## Структура проекта

```
web/
├── app/                # Next.js App Router
│   ├── layout.tsx      # Корневой layout
│   ├── page.tsx        # Главная страница
│   └── (routes)/       # Маршруты приложения
├── components/         # React компоненты
│   └── layout/         # Header, Footer
├── lib/
│   └── supabase/       # Supabase клиенты (browser/server)
├── providers/          # React Context провайдеры
├── styles/             # CSS стили
└── public/             # Статические файлы
```

## Переиспользование кода

Проект импортирует общие модули из основного приложения:

- **Типы БД**: `@shared/lib/database.types`
- **Переводы**: `@shared/translations/{ru,sr}.json`
- **Утилиты**: `@shared/utils/*`
- **Константы**: `@shared/constants/colors`

## Быстрый старт

### 1. Настройка переменных окружения

Скопируйте `.env.local` и заполните значения:

```bash
# Supabase (из основного проекта)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Site
NEXT_PUBLIC_SITE_URL=https://domgo.rs
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Запуск dev сервера

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

## Команды

```bash
npm run dev      # Запуск dev сервера
npm run build    # Production сборка
npm run start    # Запуск production сервера
npm run lint     # ESLint проверка
```

## Развертывание

### Vercel (рекомендуется)

1. Установите Vercel CLI: `npm i -g vercel`
2. Выполните: `vercel`
3. Следуйте инструкциям

### Render / Netlify

1. Подключите GitHub репозиторий
2. Укажите папку `web/` как корневую
3. Команда сборки: `npm run build`
4. Выходная папка: `.next`

## SEO

Проект включает:
- ✅ Dynamic meta tags для объявлений
- ✅ Open Graph теги
- ✅ Sitemap.xml (динамический)
- ✅ Robots.txt
- ✅ JSON-LD structured data (TODO)

## Безопасное удаление

Для удаления веб-версии без повреждения основного проекта:

```bash
cd /Users/angstremoff/Documents/GitHub/domgomobile
rm -rf web/
```

Все изменения изолированы в папке `web/`, основной проект не затронут.

## Реализованные функции

✅ **Завершено:**
- [x] Страницы листингов (/prodaja, /izdavanje, /novogradnja) с SSR
- [x] Детали объявления с полными SEO метаданными
- [x] PropertyCard и PropertyGrid компоненты
- [x] Авторизация (вход/регистрация через Supabase Auth)
- [x] Личный кабинет (профиль, избранное, мои объявления)
- [x] Динамический sitemap.xml
- [x] Robots.txt
- [x] Темная/светлая тема
- [x] Локализация (RU/SR)
- [x] Middleware для защиты приватных маршрутов

⏳ **Для дальнейшей разработки:**
- [ ] Фильтры и расширенный поиск
- [ ] Добавление/редактирование объявлений
- [ ] Карта объектов (Leaflet)
- [ ] Агентства
- [ ] JSON-LD structured data
- [ ] Пагинация с Infinite Scroll
- [ ] Оптимизация изображений

## Технические детали

### Переиспользуемые модули

Проект импортирует из основного приложения (`../src/`):
- `database.types.ts` - типы PostgreSQL
- `translations/*.json` - переводы (ru, sr)
- `utils/cacheManager.ts` - LRU кэш
- `utils/apiHelpers.ts` - retry, withTimeout
- `utils/filterHelpers.ts` - логика фильтрации
- `constants/colors.ts` - цветовая схема

### Адаптированные модули

В папке `web/lib/`:
- `supabase/client.ts` - браузерный клиент (@supabase/ssr)
- `supabase/server.ts` - серверный клиент для SSR
- `supabase/middleware.ts` - защита маршрутов

## Текущее состояние

**Dev сервер запущен:** http://localhost:3000

**Доступные страницы:**
- `/` - Главная
- `/prodaja` - Продажа недвижимости
- `/izdavanje` - Аренда
- `/novogradnja` - Новостройки
- `/prodaja/[id]`, `/izdavanje/[id]` - Детали объявления
- `/prijava` - Вход
- `/registracija` - Регистрация
- `/profil` - Личный кабинет
- `/profil/omiljeno` - Избранное
- `/profil/moji-oglasi` - Мои объявления

## Лицензия

Часть проекта DomGoMobile
