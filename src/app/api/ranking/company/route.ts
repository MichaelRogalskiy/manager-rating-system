import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get company scores with manager details
    const scores = await prisma.companyScore.findMany({
      include: { manager: true },
      orderBy: { rating: 'desc' },
    });

    // Format as rating entries
    const ranking = scores.map((score, index) => ({
      place: index + 1,
      manager: {
        id: score.manager.id,
        lastName: score.manager.lastName,
        firstName: score.manager.firstName,
        patronymic: score.manager.patronymic,
        position: score.manager.position,
        createdAt: score.manager.createdAt,
      },
      rating: Math.round(score.rating * 10) / 10, // Round to 1 decimal
    }));

    return NextResponse.json(ranking);

  } catch (error) {
    console.error('Company ranking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}