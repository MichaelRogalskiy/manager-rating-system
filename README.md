# Manager Rating System 🏆

Система оцінки менеджерів з використанням Bradley-Terry моделі та онлайн SGD алгоритмів.

## Особливості

- 🎯 **Bradley-Terry модель** для парних порівнянь
- 📊 **Онлайн SGD** для real-time оновлення рейтингів  
- 🖱️ **Drag & Drop** інтерфейс + кнопки для зручності
- 📈 **Прогрес трекінг** з автоматичним переходом на результати
- 🌐 **Українська мова** інтерфейсу
- 🔧 **Толерантний дизайн** ("Потребує розвитку" замість "Найгірший")

## Технології

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, dnd-kit
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Math**: mathjs для обчислень Bradley-Terry моделі

## Локальний запуск

```bash
# Встановити залежності
npm install

# Налаштувати базу даних
cp .env.example .env
# Відредагувати DATABASE_URL в .env

# Запустити міграції
npx prisma db push

# Імпортувати дані менеджерів
npm run dev
curl -X POST http://localhost:3000/api/managers/import-csv

# Запустити додаток
npm run dev
```

## Структура додатку

- `/` - Головна сторінка (створення рецензента)
- `/rating/[reviewerId]` - Інтерфейс оцінювання з прогресом
- `/leaderboard/global` - Глобальний рейтинг
- `/leaderboard/reviewer/[reviewerId]` - Персональний рейтинг
- `/health` - Статистика системи

## API Endpoints

- `POST /api/reviewers/create` - Створити рецензента
- `POST /api/session/start` - Почати сесію оцінювання
- `GET /api/screen/next` - Отримати наступний екран
- `POST /api/screen/submit` - Відправити оцінку
- `GET /api/leaderboard/global` - Глобальний рейтинг
- `GET /api/leaderboard/reviewer/[id]` - Персональний рейтинг

## Розгортання

1. Fork цей репозиторій
2. Підключіть PostgreSQL базу (Railway, Supabase, або Neon)
3. Розгорніть на Vercel з environment variables
4. Запустіть міграції через Vercel Functions

---

🎉 **Готово до продакшну!** Система оцінила 36 менеджерів Monobank з реальними результатами.
