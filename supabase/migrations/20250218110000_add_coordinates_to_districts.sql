begin;

-- Добавляем координаты для районов
alter table if exists districts add column if not exists latitude text;
alter table if exists districts add column if not exists longitude text;

commit;

-- Откат:
-- alter table if exists districts drop column if exists latitude;
-- alter table if exists districts drop column if exists longitude;
