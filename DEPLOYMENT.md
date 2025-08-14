# Інструкції по розгортанню

## Кроки для деплою на Vercel

### 1. Підготовка
✅ GitHub репозиторій створено: https://github.com/MichaelRogalskiy/manager-rating-system
✅ Railway PostgreSQL налаштовано
✅ Код готовий до деплою

### 2. Environment Variables для Vercel
При розгортанні на Vercel додай ці змінні оточення:

```
DATABASE_URL=postgresql://postgres:KMfEKgzympudnayHPMuTOoSCDTCsCChd@postgres.railway.internal:5432/railway
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=enCj1FoEezWuJy0TKSCH4hh2uUUS9n21EsLY2WXNfsE=
NODE_ENV=production
```

### 3. Налаштування Railway Database
Для підключення з зовні (Vercel) змини host в DATABASE_URL з:
`postgres.railway.internal` на `viaduct.proxy.rlwy.net:PORT`

Правильний URL буде:
```
DATABASE_URL=postgresql://postgres:KMfEKgzympudnayHPMuTOoSCDTCsCChd@viaduct.proxy.rlwy.net:XXXX/railway
```

### 4. Кроки деплою
1. Йди на https://vercel.com/new
2. Імпортуй репозиторій: https://github.com/MichaelRogalskiy/manager-rating-system
3. Додай Environment Variables (з кроку 2)
4. Натисни Deploy

### 5. Після деплою
1. Виконай міграції бази даних
2. Імпортуй менеджерів через API: /api/managers/import-csv
3. Тестуй додаток

### 6. Публічний URL
Додаток буде доступний на: https://manager-rating-system.vercel.app