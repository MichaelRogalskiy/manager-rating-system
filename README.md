# Elomenedger - Система оцінювання менеджерів

Інтерактивний веб-сайт для оцінювання менеджерів через парні порівняння з використанням ELO-рейтингу.

## 🎯 Особливості

- **Парні порівняння**: Керівники обирають сильнішого менеджера з двох карток
- **ELO рейтинг**: Система рейтингу з динамічним K-фактором
- **Активний алгоритм добору пар**: Оптимізація кількості порівнянь для стабільного рейтингу
- **Персональні та зведені рейтинги**: Індивідуальні результати + загальний рейтинг компанії
- **Імпорт/Експорт CSV**: Завантаження менеджерів та експорт результатів
- **Українська локалізація**: Повністю україномовний інтерфейс
- **Адмін панель**: Керування системою та перегляд статистики

## 🛠 Технології

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **State Management**: Zustand
- **Database**: PostgreSQL з Prisma ORM
- **UI Components**: Custom UI library з HeadlessUI
- **Validation**: Zod
- **Export**: CSV generation

## 📊 Архітектура рейтингу

### ELO система
- **Ініціалізація**: 1500 рейтингу для всіх менеджерів
- **Динамічний K-фактор**: `K = K0 / (1 + gamesMin / (1 + min(games)))`
- **Нормалізація**: Центрування для зменшення упередженості рецензентів

### Алгоритм добору пар
1. Уникати повторів порівнянь
2. Пріоритет менеджерам з найменшою кількістю ігор
3. Близькі рейтинги мають вищий пріоритет
4. Псевдовипадковий вибір з урахуванням сесії

## 🚀 Швидкий старт

### Вимоги
- Node.js 18+ 
- PostgreSQL 12+
- npm/yarn/pnpm

### Установка

1. **Клонуйте репозиторій**
```bash
git clone <your-repo-url>
cd elomenedger
```

2. **Встановіть залежності**
```bash
npm install
```

3. **Налаштуйте базу даних**
```bash
# Створіть .env файл на основі .env.example
cp .env.example .env

# Редагуйте DATABASE_URL у .env файлі
# DATABASE_URL="postgresql://username:password@localhost:5432/elomenedger?schema=public"
```

4. **Ініціалізуйте базу даних**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. **Запустіть development сервер**
```bash
npm run dev
```

6. **Відкрийте в браузері**
- Основна система: http://localhost:3000
- Адмін панель: http://localhost:3000?admin=true

## 📝 Використання

### Для рецензентів (керівників)
1. Введіть повне ім'я на екрані інструкцій
2. Порівнюйте менеджерів попарно, обираючи сильнішого
3. Використовуйте клавіатурні скорочення: `←` / `→` для вибору, `S` для пропуску
4. Переглядайте персональний рейтинг після завершення
5. Експортуйте результати у CSV

### Для адміністраторів  
1. Відкрийте `http://localhost:3000?admin=true`
2. Імпортуйте список менеджерів через CSV
3. Переглядайте зведений рейтинг компанії
4. Перераховуйте рейтинги після нових порівнянь
5. Експортуйте результати

## 📊 Формат CSV

### Імпорт менеджерів
Підтримується два формати заголовків:

**Англійський:**
```csv
id,last_name,first_name,patronymic,position
1,Іванов,Олександр,Петрович,Керівник відділу продажів
```

**Український:**
```csv
ID,Прізвище,Ім'я,По батькові,Посада
1,Іванов,Олександр,Петрович,Керівник відділу продажів  
```

### Експорт рейтингів
```csv
place,manager_id,full_name,position,rating
1,1,Іванов Олександр Петрович,Керівник відділу продажів,1650.5
```

## ⚙️ Конфігурація

Основні параметри системи (у `src/lib/rating/elo.ts`):

```typescript
const config = {
  K0: 50,                    // Базовий K-фактор
  gamesMin: 10,              // Мінімум ігор для зниження K
  minGamesPerManager: 6,     // Мін. порівнянь на менеджера
  m: 1.8                     // Множник для цільової кількості порівнянь
};
```

## 🏗 Структура проекту

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            
│   ├── screens/           # Main app screens
│   ├── ui/                # Reusable UI components
│   └── App.tsx            # Main app logic
├── lib/                   
│   ├── rating/            # ELO system & pairing algorithms
│   ├── csv/               # CSV import/export
│   ├── locales/           # Ukrainian translations
│   └── utils.ts           # Shared utilities
├── store/                 # Zustand state management
├── types/                 # TypeScript type definitions
└── prisma/               # Database schema
```

## 🔗 API Endpoints

- `POST /api/session` - Створити сесію рецензента
- `GET /api/pair` - Отримати наступну пару для порівняння
- `POST /api/vote` - Записати результат порівняння  
- `GET /api/ranking/self` - Персональний рейтинг
- `GET /api/ranking/company` - Зведений рейтинг
- `POST /api/import` - Імпорт менеджерів з CSV
- `POST /api/recompute` - Перерахунок зведених рейтингів

## 📈 Деплой

### Vercel (рекомендується)
1. Підключіть PostgreSQL базу (Supabase, PlanetScale, тощо)
2. Налаштуйте змінні середовища
3. Підключіть Git репозиторій до Vercel
4. Деплойте автоматично

### Docker
```bash
# Збудувати image
docker build -t elomenedger .

# Запустити з PostgreSQL
docker-compose up -d
```

## 🤝 Розробка

### Команди
```bash
npm run dev          # Development server
npm run build        # Production build  
npm run start        # Start production server
npm run lint         # ESLint перевірка
npm run type-check   # TypeScript перевірка
```

### База даних
```bash
npx prisma studio           # Відкрити Prisma Studio
npx prisma migrate dev       # Створити нову міграцію
npx prisma db push           # Синхронізувати схему (dev only)
npx prisma generate          # Регенерувати Prisma Client
```

## 📄 Ліцензія

MIT License - див. [LICENSE](LICENSE) файл.
# manager-rating-system
