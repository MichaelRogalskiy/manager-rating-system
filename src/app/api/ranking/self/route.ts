import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/dbHelper';

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
        throw new Error('Database not available');
      },
      null // fallback value
    );

    // If database worked, return the result
    if (result) {
      return NextResponse.json(result);
    }

    // Fallback to demo mode - return demo ranking
    console.log('Using demo mode for personal ranking');
    
    const demoRanking = [
      {
        place: 1,
        manager: {
          id: '4',
          lastName: 'Мельник',
          firstName: 'Анна',
          patronymic: 'Олександрівна',
          position: 'Фінансовий директор',
          createdAt: new Date('2024-01-15'),
        },
        rating: 1587.3,
      },
      {
        place: 2,
        manager: {
          id: '3',
          lastName: 'Сидоров',
          firstName: 'Дмитро',
          patronymic: 'Володимирович',
          position: 'Технічний директор',
          createdAt: new Date('2024-01-15'),
        },
        rating: 1534.8,
      },
      {
        place: 3,
        manager: {
          id: '1',
          lastName: 'Петренко',
          firstName: 'Олександр',
          patronymic: 'Іванович',
          position: 'Керівник відділу продажів',
          createdAt: new Date('2024-01-15'),
        },
        rating: 1501.2,
      },
      {
        place: 4,
        manager: {
          id: '5',
          lastName: 'Бондаренко',
          firstName: 'Сергій',
          patronymic: 'Миколайович',
          position: 'Операційний менеджер',
          createdAt: new Date('2024-01-15'),
        },
        rating: 1478.6,
      },
      {
        place: 5,
        manager: {
          id: '2',
          lastName: 'Коваленко',
          firstName: 'Марія',
          patronymic: 'Сергіївна',
          position: 'Менеджер з персоналу',
          createdAt: new Date('2024-01-15'),
        },
        rating: 1443.1,
      },
    ];

    return NextResponse.json(demoRanking);

  } catch (error) {
    console.error('Personal ranking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}