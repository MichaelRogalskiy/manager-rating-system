import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, role } = body;

    // Створюємо нового рецензента
    const reviewer = await prisma.reviewer.create({
      data: {
        name: name || '',
        role: role || 'Рецензент',
        reliabilityWeight: 1.0, // Початкова надійність
        active: true,
      },
    });

    return NextResponse.json({
      id: reviewer.id,
      name: reviewer.name,
      role: reviewer.role,
      active: reviewer.active,
      reliabilityWeight: reviewer.reliabilityWeight,
    });

  } catch (error) {
    console.error('Error creating reviewer:', error);

    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    );
  }
}