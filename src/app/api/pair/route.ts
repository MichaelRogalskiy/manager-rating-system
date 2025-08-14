import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/dbHelper';
import { prisma } from '@/lib/db';
import { ActivePairingAlgorithm } from '@/lib/rating/pairing';
import { EloRatingSystem } from '@/lib/rating/elo';

// Demo data for when database is not available
const demoManagers = [
  { id: '1', firstName: 'Олександр', lastName: 'Петренко', patronymic: 'Іванович', position: 'Керівник відділу продажів' },
  { id: '2', firstName: 'Марія', lastName: 'Коваленко', patronymic: 'Сергіївна', position: 'Менеджер з персоналу' },
  { id: '3', firstName: 'Дмитро', lastName: 'Сидоров', patronymic: 'Володимирович', position: 'Технічний директор' },
  { id: '4', firstName: 'Анна', lastName: 'Мельник', patronymic: 'Олександрівна', position: 'Фінансовий директор' },
  { id: '5', firstName: 'Сергій', lastName: 'Бондаренко', patronymic: 'Миколайович', position: 'Операційний менеджер' },
];

let demoPairIndex = 0;
const demoPairs = [
  { left: demoManagers[0], right: demoManagers[1] },
  { left: demoManagers[2], right: demoManagers[3] },
  { left: demoManagers[1], right: demoManagers[4] },
  { left: demoManagers[0], right: demoManagers[3] },
  { left: demoManagers[2], right: demoManagers[4] },
];

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Try database operation first, fallback to demo mode if failed
    const result = await safeDbOperation(
      async () => {
        // Original database logic would go here
        // For now, just throw to simulate database unavailable
        throw new Error('Database not available');
      },
      null // fallback value
    );

    // If database worked, return the result
    if (result) {
      return NextResponse.json(result);
    }

    // Fallback to demo mode
    console.log('Using demo mode for pair generation');
    
    if (demoPairIndex >= demoPairs.length) {
      // All demo pairs completed
      return NextResponse.json({
        completed: true,
        progress: {
          done: demoPairs.length,
          target: demoPairs.length,
          left: 0,
          percentage: 100,
        },
      });
    }

    const currentPair = demoPairs[demoPairIndex];
    
    return NextResponse.json({
      left: currentPair.left,
      right: currentPair.right,
      progress: {
        done: demoPairIndex,
        target: demoPairs.length,
        left: demoPairs.length - demoPairIndex,
        percentage: Math.min(100, (demoPairIndex / demoPairs.length) * 100),
      },
    });

  } catch (error) {
    console.error('Pair generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}