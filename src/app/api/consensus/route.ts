import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { RatingNormalizer } from '@/lib/bradley-terry/normalization';

export async function GET(request: NextRequest) {
  try {
    // Отримуємо всіх активних рецензентів з їх моделями
    const reviewers = await prisma.reviewer.findMany({
      where: { active: true },
      include: { modelData: true },
    });

    const managers = await prisma.manager.findMany();
    const managerMap = new Map(managers.map((m: any) => [m.id, m]));

    if (reviewers.length === 0 || managers.length === 0) {
      return NextResponse.json({
        agree: [],
        disagree: [],
      });
    }

    // Підготовка даних для нормалізації
    const reviewerRatings = reviewers
      .filter(r => r.modelData)
      .map(r => {
        const theta = r.modelData!.thetaJson as Record<string, number>;
        const normalized = RatingNormalizer.normalizeReviewerRatings(theta);
        
        return {
          reviewerId: r.id,
          normalizedTheta: normalized.normalizedTheta,
          reliabilityWeight: r.reliabilityWeight,
        };
      });

    if (reviewerRatings.length === 0) {
      return NextResponse.json({
        agree: [],
        disagree: [],
      });
    }

    // Глобальна агрегація
    const globalResult = RatingNormalizer.aggregateGlobalRatings(
      reviewerRatings,
      managers.map(m => m.id)
    );

    // Обчислення консенсусу
    const consensus = RatingNormalizer.computeConsensusMetrics(
      globalResult,
      managers,
      10 // топ-10 для згоди
    );

    // Додаємо інформацію про розподіл між рецензентами для розбіжностей
    const disagreeWithSpread = consensus.disagree.map(item => {
      const spreadByReviewer: Record<string, number> = {};
      
      reviewerRatings.forEach(reviewer => {
        const score = reviewer.normalizedTheta[item.managerId];
        if (score !== undefined) {
          spreadByReviewer[reviewer.reviewerId] = Math.round(score * 100) / 100;
        }
      });

      return {
        ...item,
        spreadByReviewer,
      };
    });

    return NextResponse.json({
      agree: consensus.agree,
      disagree: disagreeWithSpread,
    });

  } catch (error) {
    console.error('Error getting consensus data:', error);
    
    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    );
  }
}