import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const reviewers = await prisma.reviewer.findMany({
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(reviewers);

  } catch (error) {
    console.error('Error getting reviewers:', error);
    
    return NextResponse.json(
      { error: 'Помилка отримання списку рецензентів' },
      { status: 500 }
    );
  }
}