import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CompanyRatingCalculator } from '@/lib/rating/elo';

export async function POST(request: NextRequest) {
  try {
    // Get all raters and their ELO scores
    const raters = await prisma.rater.findMany({
      include: {
        eloScores: {
          include: { manager: true },
        },
      },
    });

    if (raters.length === 0) {
      return NextResponse.json(
        { error: 'No data', message: 'Немає даних для розрахунку' },
        { status: 400 }
      );
    }

    // Prepare data for company rating calculation
    const raterRatings = raters.map(rater => ({
      raterId: rater.id,
      ratings: rater.eloScores.map(score => ({
        managerId: score.managerId,
        rating: score.rating,
      })),
    })).filter(rater => rater.ratings.length > 0);

    if (raterRatings.length === 0) {
      return NextResponse.json(
        { error: 'No ratings', message: 'Немає рейтингів для розрахунку' },
        { status: 400 }
      );
    }

    // Calculate company ratings
    const calculator = new CompanyRatingCalculator();
    const companyRatings = calculator.calculateCompanyRatings(raterRatings);

    // Update company scores in database
    await prisma.$transaction(async (tx) => {
      // Delete existing company scores
      await tx.companyScore.deleteMany();

      // Insert new company scores
      await tx.companyScore.createMany({
        data: companyRatings.map(rating => ({
          managerId: rating.managerId,
          rating: rating.rating,
        })),
      });
    });

    return NextResponse.json({
      success: true,
      updatedCount: companyRatings.length,
      message: `Оновлено ${companyRatings.length} рейтингів`,
    });

  } catch (error) {
    console.error('Recompute error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}