# Инструкция по настройке и запуску

## Предварительные требования

- Node.js 18+
- npm или yarn
- Настроенный Supabase проект (из основного приложения DomGoMobile)

## Шаг 1: Установка зависимостей

```bash
cd /Users/angstremoff/Documents/GitHub/domgomobile/web
npm install
```

## Шаг 2: Настройка переменных окружения

1. Скопируйте пример:
```bash
cp .env.example .env.local
```

2. Откройте `.env.local` и заполните значения:

```env
# Эти значения возьмите из корневого .env проекта
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Для локальной разработки
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Шаг 3: Проверка типов

Убедитесь, что типы базы данных актуальны:

```bash
# Из корня проекта domgomobile
cd ..
supabase gen types typescript --project-id your-project-id > src/lib/database.types.ts
```

## Шаг 4: Запуск dev сервера

```bash
cd web
npm run dev
```

Откройте http://localhost:3000

## Шаг 5: Проверка работы

1. **Главная страница** - должна загрузиться без ошибок
2. **Листинги** - `/prodaja`, `/izdavanje`, `/novogradnja` должны показывать объявления
3. **Детали** - клик по объявлению должен открыть детальную страницу
4. **Авторизация** - `/prijava` и `/registracija` должны работать
5. **Личный кабинет** - после входа должен быть доступен `/profil`

## Возможные проблемы

### Ошибка "Invalid URL"
- Проверьте, что `NEXT_PUBLIC_SUPABASE_URL` корректный
- URL должен начинаться с `https://`

### Ошибка "Invalid API key"
- Проверьте `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Ключ должен быть anon key, а не service_role key

### Ошибка импорта типов
- Убедитесь, что `../src/lib/database.types.ts` существует
- Проверьте, что `tsconfig.json` содержит правильные пути

### Ошибки при сборке
```bash
# Очистите кэш и переустановите зависимости
rm -rf node_modules .next
npm install
npm run dev
```

## Production сборка

```bash
npm run build
npm run start
```

## Деплой

### Vercel (рекомендуется)

1. Установите Vercel CLI:
```bash
npm i -g vercel
```

2. Войдите и разверните:
```bash
vercel
```

3. Добавьте переменные окружения в Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL=https://domgo.rs`

### Другие платформы

- **Netlify**: Укажите папку `web/` и команду сборки `npm run build`
- **Render**: Аналогично, укажите корневую папку как `web/`

## Полезные команды

```bash
npm run dev       # Разработка
npm run build     # Production сборка
npm run start     # Запуск production
npm run lint      # ESLint проверка
```

## Поддержка

При возникновении проблем:
1. Проверьте логи dev сервера
2. Убедитесь, что Supabase проект активен
3. Проверьте права доступа (RLS) в Supabase
