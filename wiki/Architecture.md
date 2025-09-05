# 🏗️ Архитектура DomGoMobile

## 📐 Общая архитектура

### Высокоуровневая схема
```
┌─────────────────────────────────────────────────────────┐
│                Mobile Application                        │
│              (React Native + Expo)                      │
├─────────────────────────────────────────────────────────┤
│  📱 Presentation Layer                                   │
│  • React Native Components                              │
│  • Navigation (React Navigation)                        │
│  • UI/UX (Custom Components)                           │
├─────────────────────────────────────────────────────────┤
│  🧠 Business Logic Layer                                │
│  • Context API (State Management)                      │
│  • Custom Hooks                                        │
│  • Services Layer                                      │
├─────────────────────────────────────────────────────────┤
│  🗄️ Data Layer                                          │
│  • Supabase Client                                     │
│  • AsyncStorage (Local Cache)                          │
│  • TypeScript Types                                    │
├─────────────────────────────────────────────────────────┤
│  ☁️ Backend Services (Supabase BaaS)                    │
│  • PostgreSQL Database                                 │
│  • Row Level Security (RLS)                           │
│  • Real-time Subscriptions                            │
│  • Authentication                                      │
│  • Storage (Images)                                    │
└─────────────────────────────────────────────────────────┘
```

## 🗂️ Структура проекта

### Основная архитектура папок
```
domgomobile/
├── 📁 src/                      # Исходный код приложения
│   ├── 🧩 components/           # Переиспользуемые UI компоненты
│   │   ├── PropertyCard.tsx     # Карточка объявления
│   │   ├── SearchBar.tsx        # Поисковая строка
│   │   ├── FilterModal.tsx      # Модальное окно фильтров
│   │   └── MapView.tsx          # Компонент карты
│   │
│   ├── 📱 screens/              # Экраны приложения
│   │   ├── HomeScreen.tsx       # Главный экран с лентой
│   │   ├── SearchScreen.tsx     # Экран поиска
│   │   ├── PropertyDetailScreen.tsx # Детали объявления
│   │   ├── CreatePropertyScreen.tsx # Создание объявления
│   │   ├── ProfileScreen.tsx    # Профиль пользователя
│   │   └── FavoritesScreen.tsx  # Избранные объявления
│   │
│   ├── 🗂️ contexts/             # React Context провайдеры
│   │   ├── AuthContext.tsx      # Аутентификация
│   │   ├── PropertyContext.tsx  # Управление объявлениями
│   │   ├── ThemeContext.tsx     # Темы приложения
│   │   └── LanguageContext.tsx  # Мультиязычность
│   │
│   ├── 🔧 services/             # Бизнес-логика и API
│   │   ├── propertyService.ts   # Работа с объявлениями
│   │   ├── authService.ts       # Аутентификация
│   │   ├── imageService.ts      # Работа с изображениями
│   │   └── locationService.ts   # Геолокация
│   │
│   ├── 🌐 navigation/           # Настройка навигации
│   │   └── AppNavigator.tsx     # Основной навигатор
│   │
│   ├── 🎨 styles/               # Стили и темы
│   │   ├── themes.ts            # Определения тем
│   │   └── globalStyles.ts      # Глобальные стили
│   │
│   ├── 🌍 translations/         # Локализация
│   │   ├── ru.json              # Русские переводы
│   │   └── sr.json              # Сербские переводы
│   │
│   ├── 📊 types/                # TypeScript определения
│   │   ├── property.types.ts    # Типы объявлений
│   │   ├── user.types.ts        # Типы пользователей
│   │   └── navigation.types.ts  # Типы навигации
│   │
│   ├── 🛠️ utils/                # Утилиты и хелперы
│   │   ├── imageUtils.ts        # Работа с изображениями
│   │   ├── validation.ts        # Валидация данных
│   │   └── formatters.ts        # Форматирование
│   │
│   ├── 🔗 lib/                  # Внешние библиотеки
│   │   ├── supabase.ts          # Клиент Supabase
│   │   └── database.types.ts    # Типы БД
│   │
│   └── 📏 constants/            # Константы
│       └── index.ts             # Общие константы
│
├── 📁 assets/                   # Статические ресурсы
│   ├── images/                  # Изображения
│   ├── icons/                   # Иконки
│   └── fonts/                   # Шрифты
│
├── 📁 android/                  # Нативная часть Android
├── 📁 ios/                      # Нативная часть iOS
├── 📁 scripts/                  # Скрипты автоматизации
├── 📄 App.tsx                   # Корневой компонент
├── 📄 package.json              # Зависимости проекта
└── 📄 app.json                  # Конфигурация Expo
```

## 🔄 Поток данных

### State Management через Context API
```typescript
// Архитектурный паттерн управления состоянием
UserAction → Component → Context → Service → Supabase → Database
    ↑                                                      ↓
UI Update ← State Update ← Response ← API Response ← Query Result
```

### Пример реализации Context
```typescript
// PropertyContext.tsx
interface PropertyContextType {
  properties: Property[];
  loading: boolean;
  error: string | null;
  fetchProperties: () => Promise<void>;
  createProperty: (property: PropertyCreate) => Promise<void>;
  updateProperty: (id: string, updates: PropertyUpdate) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
}

export const PropertyProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(propertyReducer, initialState);
  
  const fetchProperties = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await propertyService.getAll();
      dispatch({ type: 'SET_PROPERTIES', payload: data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  return (
    <PropertyContext.Provider value={{ ...state, fetchProperties }}>
      {children}
    </PropertyContext.Provider>
  );
};
```

## 🧩 Архитектурные паттерны

### 1. Component-Based Architecture
- **Atomic Design** - компоненты разбиты на атомы, молекулы, организмы
- **Composition over Inheritance** - композиция компонентов
- **Single Responsibility** - один компонент = одна ответственность

### 2. Layered Architecture
```
┌─────────────────┐
│ Presentation    │ ← React Components, Screens
├─────────────────┤
│ Application     │ ← Business Logic, Hooks
├─────────────────┤
│ Domain          │ ← Types, Interfaces, Models
├─────────────────┤
│ Infrastructure  │ ← Services, API Clients
└─────────────────┘
```

### 3. Service Layer Pattern
```typescript
// Пример сервисного слоя
export class PropertyService {
  private supabase = createSupabaseClient();

  async getAll(filters?: PropertyFilters): Promise<Property[]> {
    let query = this.supabase.from('properties').select('*');
    
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    
    return data;
  }

  async create(property: PropertyCreate): Promise<Property> {
    const { data, error } = await this.supabase
      .from('properties')
      .insert(property)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }
}
```

## 🔐 Безопасность архитектуры

### Row Level Security (RLS)
```sql
-- Пример политики безопасности
CREATE POLICY "Users can only see active properties" 
ON properties FOR SELECT 
USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Users can only edit own properties" 
ON properties FOR ALL 
USING (auth.uid() = user_id);
```

### Типизация данных
```typescript
// Строгая типизация через TypeScript
interface Property {
  id: string;
  title: string;
  price: number;
  type: 'sale' | 'rent';
  user_id: string;
  created_at: string;
}

// Валидация на уровне сервиса
const validateProperty = (property: PropertyCreate): ValidationResult => {
  const errors: string[] = [];
  
  if (!property.title || property.title.length < 5) {
    errors.push('Заголовок должен содержать минимум 5 символов');
  }
  
  if (property.price <= 0) {
    errors.push('Цена должна быть положительным числом');
  }
  
  return { isValid: errors.length === 0, errors };
};
```

## 📱 Навигационная архитектура

### Stack Navigation Structure
```
App Navigator (Stack)
├── Auth Stack
│   ├── Login Screen
│   ├── Register Screen
│   └── Reset Password Screen
│
└── Main Stack
    ├── Tab Navigator
    │   ├── Home Tab
    │   ├── Search Tab
    │   ├── Favorites Tab
    │   └── Profile Tab
    │
    └── Modal Stack
        ├── Property Detail Screen
        ├── Create Property Screen
        ├── Edit Property Screen
        └── Settings Screen
```

## 🎯 Принципы проектирования

### SOLID Principles
- **Single Responsibility** - каждый модуль имеет одну причину для изменения
- **Open/Closed** - открыт для расширения, закрыт для модификации
- **Liskov Substitution** - объекты должны быть заменяемы экземплярами подтипов
- **Interface Segregation** - много специализированных интерфейсов лучше одного общего
- **Dependency Inversion** - зависимость от абстракций, а не от конкретных реализаций

### Performance Considerations
- **Code Splitting** - разделение кода на chunks
- **Lazy Loading** - ленивая загрузка компонентов
- **Memoization** - кэширование результатов вычислений
- **Virtual Lists** - виртуализация длинных списков

### Scalability Patterns
- **Modular Architecture** - модульная структура
- **Plugin Architecture** - возможность подключения плагинов
- **Micro-frontends** - независимые фрагменты UI (для будущего роста)

## 🔄 CI/CD Architecture

### Build Pipeline
```
GitHub Push → GitHub Actions → EAS Build → Distribution
     ↓              ↓             ↓           ↓
  Code Review → Tests & Lint → APK/IPA → App Stores
```

### Quality Gates
1. **Static Analysis** - ESLint, TypeScript compiler
2. **Unit Tests** - Jest testing framework
3. **Integration Tests** - Detox E2E tests
4. **Security Scan** - Snyk vulnerability scanning
5. **Performance Tests** - Bundle size analysis