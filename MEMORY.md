# 🧠 Память проекта DomGoMobile

## 1. Коммуникация и правила
- Общение, комментарии и документация **строго на русском языке** (`RULES.md`). Английский запрещён даже в логах.
- Учитываем весь предыдущий контекст разговора; не задаём вопросы, на которые уже был ответ.
- Придерживаемся TypeScript без `any`; соблюдаем `typescript_safety`, `ui_consistency`, `performance_optimization`, `database_consistency`.
- Любые изменения схемы Supabase проходят через миграции + `supabase gen types typescript`.
- UI: поддерживаем светлую/тёмную тему и систему переводов (`ru`, `sr`).

## 2. Архитектура и стек
- Платформы: Android, iOS, web (desktop/mobile). React Native 0.76.9 + Expo ~52 + TypeScript 5.9.2 + Hermes. Веб-версия на React Native Web.
- Старт: `index.ts` инициализирует Sentry и регистрирует `App.tsx`. Навигация (`AppNavigator`) обёрнута в Auth/Language/Theme/Favorites/Property/Alert провайдеры + `ErrorBoundary`.
- Deep Link-и: `domgomobile://auth/callback`, `domgomobile://property/...`, `domgo.rs/property/...`. Для шаринга используется GitHub Pages `property.html` с fallback (экран «Открываем объявление…» предлагающий Web/Play Store).

## 3. Основные сервисы и модули
- `src/services/propertyService.ts`: CRUD объявлений в Supabase, пагинация, retry, загрузка изображений ≤5 МБ (jpg/jpeg/png/webp), работа с Supabase Storage, LRU-кэши `propertyCache`/`apiCache`.
- `src/contexts/PropertyContext.tsx`: хранение списков (`all/sale/rent/newBuildings`), throttling запросов (≥5 минут), выбор города, инкрементальная загрузка.
- `AuthContext`/`FavoritesContext`: Supabase Auth + таблица `favorites`. Сессии в AsyncStorage (`autoRefreshToken`, `persistSession` включены).
- `AppVersionManager`: отслеживает версию приложения/сборки, очищает AsyncStorage/FileSystem/LRU при смене версии. Expo OTA отключены, поэтому перезапуск приложения делается вручную.
- Observability: `src/utils/sentry.ts` (DSN из `.env`, тег `app.version`) и `src/utils/logger.ts`.
- Локализация: i18next (`src/translations/{ru,sr}.json`). Любые новые строки добавляем в оба файла.

## 4. Данные и Supabase
- База описана в `DATABASE_SCHEMA.md` + `supabase/export/*`. Таблицы: `users`, `cities`, `properties`, `agency_profiles`, `favorites`.
- Включён RLS: действия учитывают `user_id`/`agency_id`. Требуемые поля объявлений перечислены в `RULES.md`.
- После изменения схемы: миграция + `supabase gen types typescript`.

## 5. Сборка и релизы
### 5.1 Скрипты
- Локальные APK: `build-simple-apk.sh`, `build-local-apk.sh`, `build-dev-apk.sh`, `build-local-user-apk.sh`.
- Прочие утилиты: `build-apk-eas.sh`, `build-and-upload.sh`, `release-build.sh`, `release.sh`, `create-release.sh`, `easy-build-apk.sh`, `build-simple-apk.sh`, `update-version.sh`, `generate-keystore.sh`, `download-apk.sh`.
- Выпуск AAB: `./build-release-bundle.sh` (оборачивает `gradlew bundleRelease` и кладёт `~/Desktop/DomGoMobile-<версия>-release.aab`).
- Релизный APK для локального QA: `android/app/build/outputs/apk/release/app-release.apk`. Установка через `adb install -r`.

### 5.2 Процесс публикации
- Expo OTA отключены. Каждое обновление публикуется через Google Play/App Store.
- Минимальные разрешения: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `READ_MEDIA_IMAGES/VIDEO`, `INTERNET`, `VIBRATE`. Чувствительные права (`RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW`, `WRITE_EXTERNAL_STORAGE`) убраны.
- Настройки -> «Проверить обновления» ведёт в Google Play (`https://play.google.com/store/apps/details?id=com.anonymous.DomGoMobile`). Для iOS добавим ссылку после релиза.
- Release checklist для Play Console:
  1. Подготовить `.aab` (см. выше) и включить Play App Signing.
  2. Опубликовать Privacy Policy (`PRIVACY_POLICY.md`) на публичном URL и указать его в Store Listing.
  3. Заполнить Data Safety (собираем email, фото/контент объявлений, избранное, логи ошибок/Sentry, геолокацию по запросу пользователя).
  4. Заполнить раздел App Content → User Generated Content: правила модерации из `RULES.md`, контакты для жалоб.
  5. Добавить скриншоты ≥1080px, иконку 512×512, описания, контактный e-mail/сайт.
  6. Пройти Internal testing (получить Pre-launch report) и после проверки выкатывать Production.
- GitHub CLI `gh` авторизован (user `angstremoff`, scopes `repo`,`workflow`). Команда для перезаливки APK: `gh release upload v<версия> releases/domgo.apk --clobber`.

## 6. Документация и инструменты
- README, WIKI (+ `wiki/*.md`), `AUDIT_REPORT.md`, `IMPLEMENTATION_REPORT.md`, `DATABASE_SCHEMA.md`, `OPTIMIZATION_REPORT.md`, `FIXES_REPORT.md`, `CODE_REVIEW_REPORT.md`, `FINAL_SUMMARY.md`, `FULL_OPTIMIZATION_COMPLETE.md`, `TESTING_CHECKLIST.md`.
- `EXPO_UPDATES_SETUP.md` и `GITHUB_ACTIONS_SETUP.md` помечены как архивные (OTA больше не используются).
- Для диагностики доступен MCP Context7 (`docs/context7-setup.md`).

## 7. Важные напоминания
- DomGoMobile поддерживает четыре платформы, но бизнес-логика едина; различия только в верстке/UX.
- При шаринге объявлений используем `https://angstremoff.github.io/domgomobile/property.html?id=<ID>` — страница пытается открыть приложение, если нет — предлагает Web + Google Play.
- Любые новые задачи, связанные с публикацией, должны учитывать требования Google Play и наличие AAB; APK используется только для локального тестирования.
