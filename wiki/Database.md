# 🗄️ База данных

## 📊 Обзор

DomGoMobile использует **Supabase** (PostgreSQL) в качестве основной базы данных с включенной системой **Row Level Security (RLS)** для защиты данных пользователей.

### 🏗️ Архитектура БД

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│    users    │────►│ agency_profiles  │     │   cities    │
└─────────────┘     └──────────────────┘     └─────────────┘
       │                                             │
       └─────────────┐                               │
                     ▼                               ▼
                ┌─────────────────────┐              │
                │    properties      │◄─────────────┘
                └─────────────────────┘
                         │
                         ▼
                ┌─────────────────────┐
                │     favorites      │
                └─────────────────────┘
```

## 📋 Схема таблиц

### 👥 users - Пользователи
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_agency BOOLEAN DEFAULT false
);
```

**Описание полей:**
- `id` - Уникальный идентификатор (UUID)
- `email` - Email адрес (обязательный, уникальный)
- `name` - Имя пользователя
- `is_agency` - Флаг для определения агентств

### 🏢 agency_profiles - Профили агентств
```sql
CREATE TABLE agency_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  location TEXT,
  logo_url TEXT,
  description TEXT,
  site TEXT
);
```

### 🏙️ cities - Города
```sql
CREATE TABLE cities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  coordinates JSON,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 🏡 properties - Объявления
```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sale', 'rent')),
  property_type TEXT NOT NULL,
  price DECIMAL NOT NULL,
  area DECIMAL NOT NULL,
  rooms INTEGER NOT NULL,
  location TEXT NOT NULL,
  city_id INTEGER REFERENCES cities(id),
  images TEXT[] DEFAULT '{}',
  features TEXT[],
  coordinates JSON,
  status TEXT DEFAULT 'active',
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agency_profiles(id)
);
```

### ❤️ favorites - Избранное
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  UNIQUE(user_id, property_id)
);
```

## 🔐 Row Level Security (RLS)

### Политики безопасности users
```sql
-- Пользователи видят только свой профиль
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid() = id);

-- Пользователи могут обновлять только свой профиль
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid() = id);
```

### Политики для properties
```sql
-- Все видят активные объявления
CREATE POLICY "Anyone can view active properties" ON properties
FOR SELECT USING (status = 'active' OR auth.uid() = user_id);

-- Владельцы управляют своими объявлениями
CREATE POLICY "Users can manage own properties" ON properties
FOR ALL USING (auth.uid() = user_id);
```

### Политики для favorites
```sql
-- Пользователи управляют только своим избранным
CREATE POLICY "Users can manage own favorites" ON favorites
FOR ALL USING (auth.uid() = user_id);
```

## 📝 Миграции

### Создание миграции
```bash
# Создать новую миграцию
supabase migration new add_property_features

# Применить локально
supabase db reset

# Применить на production
supabase db push
```

### Пример миграции
```sql
-- supabase/migrations/20240101000000_initial_schema.sql

-- Создание таблицы пользователей
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  is_agency BOOLEAN DEFAULT false
);

-- Включение RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Создание политик
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid() = id);
```

## 🔄 Генерация TypeScript типов

```bash
# Генерация типов из схемы
supabase gen types typescript --project-id bondvgkachyjxqxsrcvj > src/lib/database.types.ts
```

### Использование типов в коде
```typescript
import { Database } from '../lib/database.types';

type Property = Database['public']['Tables']['properties']['Row'];
type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'];

// Типизированный клиент
export const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
```

## 📊 Индексы производительности

```sql
-- Основные индексы
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_city_id ON properties(city_id);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_created_at ON properties(created_at DESC);

-- Комбинированные индексы
CREATE INDEX idx_properties_type_city ON properties(type, city_id);
CREATE INDEX idx_properties_price_range ON properties(price, area);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
```

## 🔄 Real-time подписки

```typescript
// Подписка на изменения в объявлениях
useEffect(() => {
  const subscription = supabase
    .channel('properties')
    .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'properties' }, 
        (payload) => {
          console.log('Изменение в properties:', payload);
          // Обновить локальное состояние
        })
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}, []);
```

## 🛠️ Полезные SQL запросы

### Получение объявлений с информацией о городе
```sql
SELECT p.*, c.name as city_name
FROM properties p
LEFT JOIN cities c ON p.city_id = c.id
WHERE p.status = 'active'
ORDER BY p.created_at DESC;
```

### Статистика по пользователю
```sql
SELECT 
  u.name,
  COUNT(p.id) as total_properties,
  COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_properties
FROM users u
LEFT JOIN properties p ON u.id = p.user_id
WHERE u.id = $1
GROUP BY u.id, u.name;
```

### Поиск по фильтрам
```sql
SELECT * FROM properties 
WHERE 
  status = 'active'
  AND type = $1
  AND price BETWEEN $2 AND $3
  AND area >= $4
  AND city_id = $5
ORDER BY created_at DESC
LIMIT 20;
```

## 🔧 Резервное копирование

```bash
# Создание бэкапа через Supabase CLI
supabase db dump --data-only > backup.sql

# Восстановление из бэкапа
supabase db reset
psql -h localhost -p 54322 -U postgres -d postgres < backup.sql
```