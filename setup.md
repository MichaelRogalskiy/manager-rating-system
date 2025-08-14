# Manager Rating System - Setup & Testing Guide

## Prerequisites
- Node.js 18+ 
- PostgreSQL 12+ (or Docker)

## Quick Setup

### 1. Database Setup

**Option A: Docker (Recommended)**
```bash
# Start PostgreSQL in Docker
docker run --name postgres-manager-rating \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=manager_rating_system \
  -p 5432:5432 \
  -d postgres:15

# Check if running
docker ps
```

**Option B: Local PostgreSQL**
```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb manager_rating_system
```

### 2. Environment Setup
The `.env` file is already configured for Docker setup. If using local PostgreSQL, update the DATABASE_URL:

```bash
# For local PostgreSQL (update username if different)
DATABASE_URL="postgresql://[your-username]@localhost:5432/manager_rating_system?schema=public"
```

### 3. Initialize Database
```bash
# Create database tables
npx prisma db push

# Verify schema
npx prisma studio
```

### 4. Import Manager Data
```bash
# The system will automatically import from "List of managers.csv"
# Make sure the CSV file is in the root directory
```

### 5. Start Development Server
```bash
npm run dev
```

## Testing the System

### 1. Open Application
Navigate to: http://localhost:3000

### 2. Import Managers (First Time)
```bash
# Use API endpoint to import CSV data
curl -X POST http://localhost:3000/api/managers/import
```

### 3. Test Flow
1. **Home Page**: View system overview and reviewers
2. **Start Rating**: Click "Оцінювати" for any active reviewer
3. **Rating Process**: 
   - Select 3 top managers
   - Select 1 worst manager
   - Leave others in middle or mark as "Не знаю"
   - Click "Далі"
4. **Continue Rating**: System will generate new screens automatically

### 4. API Testing
```bash
# Test API endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/managers/import
curl http://localhost:3000/api/leaderboard/global
```

### 5. Database Inspection
```bash
# Open Prisma Studio to view data
npx prisma studio
```

## Sample Test Data

The system expects a CSV file with Ukrainian manager names. Create `List of managers.csv`:

```csv
name,position
Олександр Петренко,Менеджер з продажів
Марія Коваленко,Менеджер проєктів
Дмитро Сидоренко,Менеджер з маркетингу
Анна Шевченко,Менеджер HR
Василь Бондаренко,Менеджер розробки
Катерина Мельник,Менеджер фінансів
...
```

## Common Issues

### Database Connection
- Ensure PostgreSQL is running on port 5432
- Check DATABASE_URL in .env matches your setup
- For Docker: `docker logs postgres-manager-rating`

### Build Issues
- Run `npm install` to ensure all dependencies
- Run `npx prisma generate` after database changes

### Port Conflicts
- Change port in package.json if 3000 is occupied:
```json
"dev": "next dev -p 3001"
```

## System Features to Test

1. **Manager Selection**: Adaptive algorithm chooses 7 managers optimally
2. **Real-time Updates**: Bradley-Terry model updates after each submission
3. **Consensus Detection**: Compare rankings between reviewers
4. **Quality Metrics**: View system health and statistics
5. **Ukrainian Interface**: All text is in Ukrainian
6. **Responsive Design**: Works on desktop and mobile

## Production Deployment

For production:
1. Set up production PostgreSQL database
2. Update DATABASE_URL for production
3. Run `npm run build`
4. Deploy to Vercel, Railway, or similar platform