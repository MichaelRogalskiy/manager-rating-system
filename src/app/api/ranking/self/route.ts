import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await validateSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get ELO scores for this rater with manager details
    const scores = await prisma.eloScore.findMany({
      where: { raterId: session.raterId },
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
    console.error('Personal ranking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}