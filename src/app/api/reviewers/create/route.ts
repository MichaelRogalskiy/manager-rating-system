import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const createReviewerSchema = z.object({
  name: z.string().min(2, 'Ім\'я має містити принаймні 2 символи'),
  role: z.string().optional().default('Рецензент'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, role } = createReviewerSchema.parse(body);

    // Перевіряємо, чи не існує вже рецензент з таким іменем
    const existingReviewer = await prisma.reviewer.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (existingReviewer) {
      return NextResponse.json(
        { error: 'Рецензент з таким іменем вже існує' },
        { status: 409 }
      );
    }

    // Створюємо нового рецензента
    const reviewer = await prisma.reviewer.create({
      data: {
        name,
        role,
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