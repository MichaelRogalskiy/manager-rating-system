import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateSession } from '@/lib/auth';
import { ActivePairingAlgorithm } from '@/lib/rating/pairing';
import { EloRatingSystem } from '@/lib/rating/elo';

export async function GET(request: NextRequest) {
  try {
    const session = await validateSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all managers
    const managers = await prisma.manager.findMany({
      orderBy: { lastName: 'asc' },
    });

    if (managers.length < 2) {
      return NextResponse.json(
        { error: 'Insufficient data', message: 'Недостатньо даних для порівняння' },
        { status: 400 }
      );
    }

    // Get ELO scores for this rater
    const eloScores = await prisma.eloScore.findMany({
      where: { raterId: session.raterId },
    });

    // Initialize missing ELO scores
    const existingManagerIds = new Set(eloScores.map((score: any) => score.managerId));
    const missingManagers = managers.filter((m: any) => !existingManagerIds.has(m.id));
    
    if (missingManagers.length > 0) {
      await Promise.all(missingManagers.map((manager: any) =>
        prisma.eloScore.create({
          data: {
            raterId: session.raterId,
            managerId: manager.id,
            rating: 1500,
            games: 0,
          },
        })
      ));

      // Refetch scores
      const updatedScores = await prisma.eloScore.findMany({
        where: { raterId: session.raterId },
      });
      eloScores.push(...updatedScores.filter(score => !existingManagerIds.has(score.managerId)));
    }

    // Get comparisons for this rater
    const comparisons = await prisma.comparison.findMany({
      where: { raterId: session.raterId },
      select: {
        raterId: true,
        leftManagerId: true,
        rightManagerId: true,
      },
    });

    // Calculate progress
    const ratingSystem = new EloRatingSystem({
      K0: 50,
      gamesMin: 10,
      minGamesPerManager: 6,
      m: 1.8,
    });

    const target = ratingSystem.getEffectiveTarget(managers.length);
    const done = comparisons.length;
    const left = Math.max(0, target - done);
    
    // Check completion
    const managerGames: Record<string, number> = {};
    eloScores.forEach(score => {
      managerGames[score.managerId] = score.games;
    });

    const isCompleted = ratingSystem.isCompletionReached(done, managers.length, managerGames);
    
    if (isCompleted) {
      return NextResponse.json({
        completed: true,
        progress: {
          done,
          target,
          left: 0,
          percentage: 100,
        },
      });
    }

    // Get next pair
    const pairingAlgorithm = new ActivePairingAlgorithm();
    const nextPair = pairingAlgorithm.getNextPair(
      session.raterId,
      managers,
      eloScores,
      comparisons,
      session.token
    );

    if (!nextPair) {
      return NextResponse.json({
        completed: true,
        progress: {
          done,
          target,
          left: 0,
          percentage: 100,
        },
      });
    }

    return NextResponse.json({
      left: nextPair.left,
      right: nextPair.right,
      progress: {
        done,
        target,
        left,
        percentage: Math.min(100, (done / target) * 100),
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