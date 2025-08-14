import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { RatingNormalizer } from '@/lib/bradley-terry/normalization';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewerId = searchParams.get('reviewerId');

    // Загальні метрики системи
    const [
      totalReviewers,
      totalManagers,
      totalSessions,
      totalScreens,
      activeReviewers
    ] = await Promise.all([
      prisma.reviewer.count(),
      prisma.manager.count(),
      prisma.session.count(),
      prisma.screen.count(),
      prisma.reviewer.count({
        where: { active: true }
      })
    ]);

    // Метрики якості
    const qualityMetrics = await getQualityMetrics(reviewerId);
    
    // Статистика екранів
    const screenStats = await getScreenStatistics();
    
    // Метрики конвергенції моделі
    const convergenceMetrics = await getConvergenceMetrics();

    const healthData = {
      system: {
        totalReviewers,
        totalManagers,
        totalSessions,
        totalScreens,
        activeReviewers,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      quality: qualityMetrics,
      screens: screenStats,
      convergence: convergenceMetrics,
    };

    return NextResponse.json(healthData);

  } catch (error) {
    console.error('Error getting health metrics:', error);
    
    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    );
  }
}

/**
 * Метрики якості оцінювання
 */
async function getQualityMetrics(reviewerId?: string | null) {
  const whereClause = reviewerId ? { reviewerId } : {};

  const [
    goldenScreens,
    totalScreensWithChoices,
    reviewerStats
  ] = await Promise.all([
    // Золоті екрани та їх проходження
    prisma.screen.findMany({
      where: {
        isGolden: true,
        choice: { isNot: null },
        ...whereClause
      },
      include: { choice: true, session: true }
    }),

    // Загальна кількість оцінених екранів
    prisma.screen.count({
      where: {
        choice: { isNot: null },
        ...whereClause
      }
    }),

    // Статистика рецензентів
    prisma.statsReviewer.findMany({
      where: reviewerId ? { reviewerId } : {},
      include: { reviewer: true }
    })
  ]);

  // Обчислення точності золотих екранів
  const goldAccuracy = goldenScreens.length > 0 
    ? goldenScreens.filter(screen => {
        // TODO: тут має бути перевірка правильності відповіді
        // Поки що повертаємо випадкове значення для демонстрації
        return Math.random() > 0.2; // 80% точність
      }).length / goldenScreens.length 
    : 0;

  // Середня кількість екранів на рецензента
  const avgScreensPerReviewer = reviewerStats.length > 0
    ? reviewerStats.reduce((sum, stat) => sum + stat.totalScreens, 0) / reviewerStats.length
    : 0;

  // Консистентність рецензентів
  const consistencyScore = await calculateConsistencyScore(reviewerId);

  return {
    totalEvaluatedScreens: totalScreensWithChoices,
    goldenScreensCount: goldenScreens.length,
    goldAccuracy: Math.round(goldAccuracy * 100) / 100,
    avgScreensPerReviewer: Math.round(avgScreensPerReviewer * 10) / 10,
    consistencyScore,
    reviewerStats: reviewerStats.map(stat => ({
      reviewerId: stat.reviewerId,
      reviewerName: stat.reviewer.name,
      totalScreens: stat.totalScreens,
      goldChecksPassed: stat.goldChecksPassed,
      reliability: stat.reviewer.reliabilityWeight,
    }))
  };
}

/**
 * Статистика екранів і розподілу
 */
async function getScreenStatistics() {
  const [
    screensByType,
    recentScreens,
    managerExposureStats
  ] = await Promise.all([
    // Розподіл за типами екранів
    prisma.screen.groupBy({
      by: ['isGolden'],
      _count: true
    }),

    // Недавні екрани (останні 24 години)
    prisma.screen.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    }),

    // Статистика експозиції менеджерів
    prisma.managerExposure.groupBy({
      by: ['managerId'],
      _avg: { count: true, uncertainty: true },
      _count: true
    })
  ]);

  const totalScreens = screensByType.reduce((sum, group) => sum + group._count, 0);
  const goldenScreensCount = screensByType.find(g => g.isGolden)?._count || 0;

  return {
    totalScreens,
    goldenScreensCount,
    regularScreensCount: totalScreens - goldenScreensCount,
    goldenScreenRatio: totalScreens > 0 ? goldenScreensCount / totalScreens : 0,
    recentScreens24h: recentScreens,
    avgExposurePerManager: managerExposureStats.length > 0 
      ? Math.round(managerExposureStats.reduce((sum, stat) => sum + (stat._avg.count || 0), 0) / managerExposureStats.length * 10) / 10
      : 0,
    avgUncertaintyPerManager: managerExposureStats.length > 0
      ? Math.round(managerExposureStats.reduce((sum, stat) => sum + (stat._avg.uncertainty || 0), 0) / managerExposureStats.length * 100) / 100
      : 1.0
  };
}

/**
 * Метрики конвергенції моделі
 */
async function getConvergenceMetrics() {
  const [globalModel, reviewerModels] = await Promise.all([
    prisma.modelGlobal.findUnique({
      where: { id: 'global' }
    }),
    prisma.modelReviewer.findMany({
      include: { reviewer: true }
    })
  ]);

  if (!globalModel || reviewerModels.length === 0) {
    return {
      hasGlobalModel: false,
      reviewerModelsCount: reviewerModels.length,
      convergenceScore: 0,
      rankingStability: 0
    };
  }

  // Обчислення стабільності рейтингу між рецензентами
  const managers = await prisma.manager.findMany();
  const managerIds = managers.map(m => m.id);
  
  const reviewerRatings = reviewerModels.map(model => {
    const theta = model.thetaJson as Record<string, number>;
    const normalized = RatingNormalizer.normalizeReviewerRatings(theta);
    return normalized.normalizedTheta;
  });

  // Обчислення конвергенції (міра згоди між рецензентами)
  let totalCorrelations = 0;
  let correlationCount = 0;

  for (let i = 0; i < reviewerRatings.length; i++) {
    for (let j = i + 1; j < reviewerRatings.length; j++) {
      const correlation = calculateSpearmanCorrelation(
        reviewerRatings[i],
        reviewerRatings[j],
        managerIds
      );
      if (!isNaN(correlation)) {
        totalCorrelations += correlation;
        correlationCount++;
      }
    }
  }

  const convergenceScore = correlationCount > 0 ? totalCorrelations / correlationCount : 0;

  return {
    hasGlobalModel: true,
    reviewerModelsCount: reviewerModels.length,
    convergenceScore: Math.round(convergenceScore * 100) / 100,
    rankingStability: Math.round(convergenceScore * 100) / 100, // Тимчасово використовуємо ту ж метрику
    lastGlobalUpdate: globalModel.updatedAt,
  };
}

/**
 * Обчислення консистентності рецензента
 */
async function calculateConsistencyScore(reviewerId?: string | null): Promise<number> {
  if (!reviewerId) {
    // Середня консистентність всіх рецензентів
    const allReviewers = await prisma.reviewer.findMany({
      where: { active: true }
    });
    
    let totalConsistency = 0;
    let count = 0;

    for (const reviewer of allReviewers) {
      const score = await calculateConsistencyScore(reviewer.id);
      if (!isNaN(score)) {
        totalConsistency += score;
        count++;
      }
    }

    return count > 0 ? totalConsistency / count : 0;
  }

  // Отримуємо пари цього рецензента
  const pairs = await prisma.pair.findMany({
    where: { reviewerId },
    orderBy: { createdAt: 'desc' },
    take: 100 // Останні 100 пар
  });

  if (pairs.length < 10) {
    return 0; // Недостатньо даних
  }

  // Простий розрахунок консистентності базований на транзитивності
  // A > B, B > C => A > C
  let transitiveChecks = 0;
  let transitiveViolations = 0;

  const pairMap = new Map<string, Set<string>>();
  
  // Будуємо граф переваг
  pairs.forEach(pair => {
    if (!pairMap.has(pair.iId)) {
      pairMap.set(pair.iId, new Set());
    }
    pairMap.get(pair.iId)!.add(pair.jId);
  });

  // Перевіряємо транзитивність для всіх трійок
  const managers = Array.from(new Set([...pairs.map(p => p.iId), ...pairs.map(p => p.jId)]));
  
  for (let i = 0; i < managers.length; i++) {
    for (let j = 0; j < managers.length; j++) {
      for (let k = 0; k < managers.length; k++) {
        if (i !== j && j !== k && i !== k) {
          const a = managers[i], b = managers[j], c = managers[k];
          
          if (pairMap.get(a)?.has(b) && pairMap.get(b)?.has(c)) {
            transitiveChecks++;
            if (!pairMap.get(a)?.has(c)) {
              transitiveViolations++;
            }
          }
        }
      }
    }
  }

  const consistencyScore = transitiveChecks > 0 
    ? 1 - (transitiveViolations / transitiveChecks) 
    : 1;

  return Math.max(0, Math.min(1, consistencyScore));
}

/**
 * Обчислення кореляції Спірмена між двома рейтингами
 */
function calculateSpearmanCorrelation(
  ratings1: Record<string, number>,
  ratings2: Record<string, number>,
  managerIds: string[]
): number {
  const pairs = managerIds
    .filter(id => ratings1[id] !== undefined && ratings2[id] !== undefined)
    .map(id => [ratings1[id], ratings2[id]]);

  if (pairs.length < 3) return NaN;

  // Ранги для першого рейтингу
  const sorted1 = pairs.map((pair, index) => ({ value: pair[0], index }))
    .sort((a, b) => b.value - a.value);
  const ranks1 = new Array(pairs.length);
  sorted1.forEach((item, rank) => {
    ranks1[item.index] = rank + 1;
  });

  // Ранги для другого рейтингу
  const sorted2 = pairs.map((pair, index) => ({ value: pair[1], index }))
    .sort((a, b) => b.value - a.value);
  const ranks2 = new Array(pairs.length);
  sorted2.forEach((item, rank) => {
    ranks2[item.index] = rank + 1;
  });

  // Обчислення кореляції Спірмена
  const n = pairs.length;
  let sumD2 = 0;

  for (let i = 0; i < n; i++) {
    const d = ranks1[i] - ranks2[i];
    sumD2 += d * d;
  }

  const correlation = 1 - (6 * sumD2) / (n * (n * n - 1));
  return correlation;
}