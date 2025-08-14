import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { validateSession } from '@/lib/auth';
import { EloRatingSystem } from '@/lib/rating/elo';
import { ActivePairingAlgorithm } from '@/lib/rating/pairing';

const voteSchema = z.object({
  leftId: z.string(),
  rightId: z.string(),
  winnerId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await validateSession(request);
    
    if (!session) {
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

    const loserId = winnerId === leftId ? rightId : leftId;

    // Check if this comparison already exists
    const existingComparison = await prisma.comparison.findFirst({
      where: {
        raterId: session.raterId,
        OR: [
          { leftManagerId: leftId, rightManagerId: rightId },
          { leftManagerId: rightId, rightManagerId: leftId },
        ],
      },
    });

    if (existingComparison) {
      return NextResponse.json(
        { error: 'Already voted', message: 'Це порівняння вже було зроблено' },
        { status: 400 }
      );
    }

    // Get current ELO scores
    const [winnerScore, loserScore] = await Promise.all([
      prisma.eloScore.findUnique({
        where: {
          raterId_managerId: {
            raterId: session.raterId,
            managerId: winnerId,
          },
        },
      }),
      prisma.eloScore.findUnique({
        where: {
          raterId_managerId: {
            raterId: session.raterId,
            managerId: loserId,
          },
        },
      }),
    ]);

    if (!winnerScore || !loserScore) {
      return NextResponse.json(
        { error: 'Missing scores', message: 'ELO scores not found' },
        { status: 500 }
      );
    }

    // Calculate new ratings
    const ratingSystem = new EloRatingSystem({
      K0: 50,
      gamesMin: 10,
      minGamesPerManager: 6,
      m: 1.8,
    });

    const eloUpdate = ratingSystem.applyVote(winnerId, loserId, winnerScore, loserScore);

    // Update database in transaction
    await prisma.$transaction(async (tx) => {
      // Record the comparison
      await tx.comparison.create({
        data: {
          raterId: session.raterId,
          leftManagerId: leftId,
          rightManagerId: rightId,
          winnerManagerId: winnerId,
        },
      });

      // Update winner's score
      await tx.eloScore.update({
        where: {
          raterId_managerId: {
            raterId: session.raterId,
            managerId: winnerId,
          },
        },
        data: {
          rating: eloUpdate.newWinnerRating,
          games: eloUpdate.newWinnerGames,
        },
      });

      // Update loser's score
      await tx.eloScore.update({
        where: {
          raterId_managerId: {
            raterId: session.raterId,
            managerId: loserId,
          },
        },
        data: {
          rating: eloUpdate.newLoserRating,
          games: eloUpdate.newLoserGames,
        },
      });
    });

    // Get next pair for response
    const managers = await prisma.manager.findMany();
    const eloScores = await prisma.eloScore.findMany({
      where: { raterId: session.raterId },
    });
    const comparisons = await prisma.comparison.findMany({
      where: { raterId: session.raterId },
      select: {
        raterId: true,
        leftManagerId: true,
        rightManagerId: true,
      },
    });

    const pairingAlgorithm = new ActivePairingAlgorithm();
    const nextPair = pairingAlgorithm.getNextPair(
      session.raterId,
      managers,
      eloScores,
      comparisons,
      session.token
    );

    // Calculate progress
    const target = ratingSystem.getEffectiveTarget(managers.length);
    const done = comparisons.length + 1; // +1 for the vote just cast
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