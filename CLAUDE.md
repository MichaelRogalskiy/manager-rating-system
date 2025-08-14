# CLAUDE.md - Elomenedger Manager Rating System

## Project Overview
**Elomenedger** is a sophisticated manager evaluation system using paired comparisons and ELO rating algorithms. The application allows supervisors to evaluate managers through head-to-head comparisons, generating both personal and company-wide rankings.

**Tech Stack:**
- Frontend: Next.js 15 (App Router), React 19, TypeScript
- State Management: Zustand with persistence
- Database: PostgreSQL with Prisma ORM  
- Styling: Tailwind CSS 4
- UI: Custom components with HeadlessUI
- File Processing: CSV import/export
- Language: Ukrainian localization

## Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   │   ├── import/        # CSV import
│   │   ├── pair/          # Get next comparison pair
│   │   ├── ranking/       # Personal & company rankings
│   │   ├── recompute/     # Recalculate company ratings
│   │   ├── session/       # User session management
│   │   └── vote/          # Submit comparison votes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Entry point
├── components/            
│   ├── screens/           # Main application screens
│   │   ├── AdminDashboard.tsx
│   │   ├── ComparisonScreen.tsx
│   │   ├── InstructionScreen.tsx
│   │   └── ResultsScreen.tsx
│   ├── ui/                # Reusable UI components
│   └── App.tsx            # Main app logic & routing
├── lib/                   
│   ├── rating/            # ELO system & pairing algorithms
│   │   ├── elo.ts         # ELO rating calculations
│   │   └── pairing.ts     # Smart pair generation
│   ├── csv/               # CSV import/export utilities
│   ├── locales/           # Ukrainian translations
│   ├── api.ts             # API client functions
│   ├── auth.ts            # Authentication utilities
│   ├── db.ts              # Database connection
│   ├── export.ts          # CSV export functions
│   └── utils.ts           # Shared utilities
├── store/
│   └── appStore.ts        # Zustand state management
└── types/
    └── index.ts           # TypeScript definitions
```

## Key Features
1. **Paired Comparisons**: Supervisors compare managers head-to-head
2. **ELO Rating System**: Dynamic ratings with K-factor adaptation
3. **Smart Pairing Algorithm**: Optimizes comparison efficiency
4. **Personal & Company Rankings**: Individual and aggregated results
5. **CSV Import/Export**: Bulk manager upload and results download
6. **Admin Dashboard**: System management and statistics
7. **Ukrainian Interface**: Full localization

## Database Schema (Prisma)
- **managers**: Manager profiles (id, names, position)
- **raters**: Supervisors conducting evaluations
- **rater_sessions**: Active evaluation sessions
- **comparisons**: Pairwise comparison results
- **elo_scores**: Individual rater's ELO scores per manager
- **company_scores**: Aggregated company-wide ratings

## Key Algorithms

### ELO Rating System (`src/lib/rating/elo.ts`)
- **Initial Rating**: 1500 for all managers
- **Dynamic K-factor**: `K = K0 / (1 + gamesMin / (1 + min(games)))`
- **Company Rating**: Centered ratings to reduce rater bias
- **Configuration**:
  - `K0: 50` - Base K-factor
  - `gamesMin: 10` - Minimum games for K reduction
  - `minGamesPerManager: 6` - Minimum comparisons per manager
  - `m: 1.8` - Target comparison multiplier

### Active Pairing Algorithm (`src/lib/rating/pairing.ts`)
1. **Avoid Repeats**: Never show same pair twice to a rater
2. **Experience Priority**: Managers with fewer games get priority
3. **Rating Proximity**: Similar ratings preferred for meaningful comparisons
4. **Deterministic Randomness**: Seeded from session token for consistency
5. **Two Phases**: Round-robin for early stage, sophisticated pairing later

## Development Commands
```bash
# Development
npm run dev          # Start dev server with turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check

# Database
npx prisma studio           # Database browser
npx prisma migrate dev      # Create migration
npx prisma db push          # Sync schema (dev)
npx prisma generate         # Regenerate client
```

## Environment Setup
Required environment variables:
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/elomenedger?schema=public"
```

## API Endpoints
- `POST /api/session` - Create rater session
- `GET /api/pair?token=X` - Get next comparison pair
- `POST /api/vote` - Submit comparison result
- `GET /api/ranking/self?token=X` - Personal ranking
- `GET /api/ranking/company` - Company ranking
- `POST /api/import` - Import managers from CSV
- `POST /api/recompute` - Recalculate company ratings

## CSV Formats

### Manager Import
Supports both English and Ukrainian headers:
```csv
id,last_name,first_name,patronymic,position
ID,Прізвище,Ім'я,По батькові,Посада
```

### Ranking Export
```csv
place,manager_id,full_name,position,rating
```

## Common Tasks

### Adding New Managers
1. Use admin dashboard CSV import
2. Supported formats: English/Ukrainian headers
3. System handles ID conflicts and updates

### Viewing Results
- **Personal**: Available after completing minimum comparisons
- **Company**: Aggregated from all raters with bias correction
- **Export**: CSV download for both personal and company rankings

### Debugging Rating Issues
1. Check `elo_scores` table for individual rater data
2. Use `company_scores` for aggregated results
3. Recompute company ratings via admin dashboard if needed

### Database Maintenance
```bash
# View comparison statistics
npx prisma studio

# Reset all data (careful!)
npx prisma migrate reset

# Backup before major changes
pg_dump elomenedger > backup.sql
```

## Architecture Notes

### State Management
- Zustand store with persistence for session data
- Local state for UI components
- API calls through centralized `lib/api.ts`

### Rating Calculation Flow
1. User submits comparison → `api/vote`
2. ELO scores updated for rater-manager pairs
3. Company scores recalculated on demand → `api/recompute`
4. Rankings generated from latest scores

### Performance Considerations
- Lazy loading of comparison pairs
- Efficient pair generation algorithm
- Minimal database queries per comparison
- Session-based progress tracking

## Testing & Quality
- TypeScript strict mode enabled
- ESLint configuration for Next.js
- Zod for API validation
- Prisma for type-safe database operations

## Deployment Notes
- Works with Vercel (recommended)
- Requires PostgreSQL database
- Environment variables must be configured
- Database migrations run automatically

---

*This system implements a sophisticated paired comparison approach to manager evaluation, optimizing both accuracy and efficiency through advanced algorithms and user experience design.*