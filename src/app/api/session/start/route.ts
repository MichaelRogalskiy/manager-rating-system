import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const startSessionSchema = z.object({
  reviewerId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewerId } = startSessionSchema.parse(body);

    // Перевіряємо, чи існує рецензент
    const reviewer = await prisma.reviewer.findUnique({
      where: { id: reviewerId },
    });

    if (!reviewer) {
      return NextResponse.json(
        { error: 'Рецензент не знайдений' },
        { status: 404 }
      );
    }

    if (!reviewer.active) {
      return NextResponse.json(
        { error: 'Рецензент неактивний' },
        { status: 403 }
      );
    }

    // Створюємо нову сесію
    const session = await prisma.session.create({
      data: {
        reviewerId,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      sessionId: session.id,
    });

  } catch (error) {
    console.error('Error starting session:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Невірні дані', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    );
  }
}