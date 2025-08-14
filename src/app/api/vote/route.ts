import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { safeDbOperation } from '@/lib/dbHelper';

const voteSchema = z.object({
  leftId: z.string(),
  rightId: z.string(),
  winnerId: z.string(),
});

// Demo data for pair progression - need to share state with pair endpoint
// In a real implementation, this would be stored in database or session
let demoPairIndex = 0;
const demoManagers = [
  { id: '1', firstName: 'Олександр', lastName: 'Петренко', patronymic: 'Іванович', position: 'Керівник відділу продажів' },
  { id: '2', firstName: 'Марія', lastName: 'Коваленко', patronymic: 'Сергіївна', position: 'Менеджер з персоналу' },
  { id: '3', firstName: 'Дмитро', lastName: 'Сидоров', patronymic: 'Володимирович', position: 'Технічний директор' },
  { id: '4', firstName: 'Анна', lastName: 'Мельник', patronymic: 'Олександрівна', position: 'Фінансовий директор' },
  { id: '5', firstName: 'Сергій', lastName: 'Бондаренко', patronymic: 'Миколайович', position: 'Операційний менеджер' },
];

const demoPairs = [
  { left: demoManagers[0], right: demoManagers[1] },
  { left: demoManagers[2], right: demoManagers[3] },
  { left: demoManagers[1], right: demoManagers[4] },
  { left: demoManagers[0], right: demoManagers[3] },
  { left: demoManagers[2], right: demoManagers[4] },
];

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { leftId, rightId, winnerId } = voteSchema.parse(body);

    // Validate winner is either left or right
    if (winnerId !== leftId && winnerId !== rightId) {
      return NextResponse.json(
        { error: 'Invalid vote', message: 'Winner must be either left or right manager' },
        { status: 400 }
      );
    }

    // Try database operation first, fallback to demo mode if failed
    const result = await safeDbOperation(
      async () => {
        // Original database logic would go here
        throw new Error('Database not available');
      },
      null // fallback value
    );

    // If database worked, return the result
    if (result) {
      return NextResponse.json(result);
    }

    // Fallback to demo mode
    console.log('Using demo mode for vote processing');
    
    // Increment the pair index to simulate progression
    demoPairIndex++;
    
    // Check if we have more pairs
    let nextPair = null;
    if (demoPairIndex < demoPairs.length) {
      nextPair = demoPairs[demoPairIndex];
    }

    // Calculate progress
    const done = demoPairIndex;
    const target = demoPairs.length;
    const left = Math.max(0, target - done);

    return NextResponse.json({
      ok: true,
      nextPair,
      progress: {
        done,
        target,
        left,
        percentage: Math.min(100, (done / target) * 100),
      },
    });

  } catch (error) {
    console.error('Vote processing error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}