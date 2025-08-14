import { NormalizationResult, GlobalAggregationResult } from '@/types';

/**
 * Система нормалізації та глобальної агрегації рейтингів
 */
export class RatingNormalizer {
  /**
   * Нормалізація рейтингу рецензента (центр по медіані, масштаб по MAD)
   * θ̃^(r) = (θ^(r) - median(θ^(r))) / MAD(θ^(r))
   */
  static normalizeReviewerRatings(theta: Record<string, number>): NormalizationResult {
    const values = Object.values(theta);
    const managerIds = Object.keys(theta);
    
    if (values.length === 0) {
      return { normalizedTheta: {}, median: 0, mad: 1 };
    }

    // Обчислення медіани
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues.length % 2 === 0
      ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
      : sortedValues[Math.floor(sortedValues.length / 2)];

    // Обчислення MAD (Median Absolute Deviation)
    const absoluteDeviations = values.map(v => Math.abs(v - median));
    const sortedDeviations = absoluteDeviations.sort((a, b) => a - b);
    const mad = sortedDeviations.length % 2 === 0
      ? (sortedDeviations[sortedDeviations.length / 2 - 1] + sortedDeviations[sortedDeviations.length / 2]) / 2
      : sortedDeviations[Math.floor(sortedDeviations.length / 2)];

    // Уникнення ділення на нуль
    const safeMad = mad === 0 ? 1 : mad;

    // Нормалізація
    const normalizedTheta: Record<string, number> = {};
    managerIds.forEach(id => {
      normalizedTheta[id] = (theta[id] - median) / safeMad;
    });

    return {
      normalizedTheta,
      median,
      mad: safeMad,
    };
  }

  /**
   * Глобальна агрегація нормалізованих рейтингів від усіх рецензентів
   */
  static aggregateGlobalRatings(
    reviewerRatings: Array<{
      reviewerId: string;
      normalizedTheta: Record<string, number>;
      reliabilityWeight: number;
    }>,
    managerIds: string[]
  ): GlobalAggregationResult {
    const mu: Record<string, number> = {};
    const variance: Record<string, number> = {};
    const ciLow: Record<string, number> = {};
    const ciHigh: Record<string, number> = {};

    managerIds.forEach(managerId => {
      // Збираємо нормалізовані оцінки від усіх рецензентів
      const ratings: Array<{ value: number; weight: number }> = [];
      
      reviewerRatings.forEach(reviewer => {
        if (reviewer.normalizedTheta[managerId] !== undefined) {
          ratings.push({
            value: reviewer.normalizedTheta[managerId],
            weight: reviewer.reliabilityWeight,
          });
        }
      });

      if (ratings.length === 0) {
        mu[managerId] = 0;
        variance[managerId] = 1;
        ciLow[managerId] = -1.96;
        ciHigh[managerId] = 1.96;
        return;
      }

      // Зважене середнє: μ_i = Σ(w_r * θ̃_i^(r)) / Σ w_r
      const totalWeight = ratings.reduce((sum, r) => sum + r.weight, 0);
      const weightedSum = ratings.reduce((sum, r) => sum + r.value * r.weight, 0);
      mu[managerId] = weightedSum / totalWeight;

      // Дисперсія поглядів: V_i = Var_r(θ̃_i^(r))
      if (ratings.length > 1) {
        const weightedVariance = ratings.reduce((sum, r) => {
          const diff = r.value - mu[managerId];
          return sum + r.weight * diff * diff;
        }, 0) / totalWeight;
        variance[managerId] = weightedVariance;
      } else {
        variance[managerId] = 0.1; // Мінімальна дисперсія для одного рецензента
      }

      // 95% довірчий інтервал (припущення нормальності)
      const standardError = Math.sqrt(variance[managerId] / ratings.length);
      ciLow[managerId] = mu[managerId] - 1.96 * standardError;
      ciHigh[managerId] = mu[managerId] + 1.96 * standardError;
    });

    return { mu, variance, ciLow, ciHigh };
  }

  /**
   * Обчислення консенсус-скорів та виявлення згоди/розбіжностей
   */
  static computeConsensusMetrics(
    globalResult: GlobalAggregationResult,
    managers: Array<{ id: string; name: string; position: string }>,
    topK: number = 10
  ): {
    agree: Array<{
      managerId: string;
      name: string;
      position: string;
      consensusScore: number;
      variance: number;
      rankGlobal: number;
    }>;
    disagree: Array<{
      managerId: string;
      name: string;
      position: string;
      variance: number;
      spreadByReviewer: Record<string, number>;
    }>;
  } {
    // Створення рейтингу за глобальними оцінками
    const rankedManagers = managers
      .map(manager => ({
        ...manager,
        globalScore: globalResult.mu[manager.id] || 0,
        variance: globalResult.variance[manager.id] || 0,
      }))
      .sort((a, b) => b.globalScore - a.globalScore)
      .map((manager, index) => ({ ...manager, rank: index + 1 }));

    // Обчислення перцентилів дисперсії
    const variances = rankedManagers.map(m => m.variance).sort((a, b) => a - b);
    const lowVarianceThreshold = this.percentile(variances, 10);
    const highVarianceThreshold = this.percentile(variances, 90);

    // Згода: низька дисперсія + топ-позиції + вузький ДІ
    const agree = rankedManagers
      .filter(manager => 
        manager.variance <= lowVarianceThreshold &&
        manager.rank <= topK &&
        (globalResult.ciHigh[manager.id] - globalResult.ciLow[manager.id]) < 0.5
      )
      .map(manager => ({
        managerId: manager.id,
        name: manager.name,
        position: manager.position,
        consensusScore: 1 / (1 + manager.variance), // C_i = 1/(1 + V_i)
        variance: manager.variance,
        rankGlobal: manager.rank,
      }));

    // Розбіжності: висока дисперсія
    const disagree = rankedManagers
      .filter(manager => manager.variance >= highVarianceThreshold)
      .map(manager => ({
        managerId: manager.id,
        name: manager.name,
        position: manager.position,
        variance: manager.variance,
        spreadByReviewer: {}, // Буде заповнено пізніше з даних рецензентів
      }));

    return { agree, disagree };
  }

  /**
   * Обчислення перцентиля
   */
  private static percentile(sortedArray: number[], p: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = (p / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedArray[lower];
    }
    
    const weight = index - lower;
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  /**
   * Розрахунок матриці Kendall's tau між усіма парами рецензентів
   */
  static computeKendallTauMatrix(
    reviewerRankings: Array<{
      reviewerId: string;
      ranking: Array<{ managerId: string; rank: number }>;
    }>
  ): { matrix: number[][]; reviewerIds: string[] } {
    const reviewerIds = reviewerRankings.map(r => r.reviewerId);
    const n = reviewerIds.length;
    const matrix = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          matrix[i][j] = this.calculateKendallTau(
            reviewerRankings[i].ranking,
            reviewerRankings[j].ranking
          );
        }
      }
    }

    return { matrix, reviewerIds };
  }

  /**
   * Розрахунок Kendall's tau між двома рейтингами
   */
  private static calculateKendallTau(
    ranking1: Array<{ managerId: string; rank: number }>,
    ranking2: Array<{ managerId: string; rank: number }>
  ): number {
    const rank1Map = new Map(ranking1.map(r => [r.managerId, r.rank]));
    const rank2Map = new Map(ranking2.map(r => [r.managerId, r.rank]));
    
    const commonIds = [...rank1Map.keys()].filter(id => rank2Map.has(id));
    const n = commonIds.length;
    
    if (n < 2) return 1;

    let concordant = 0;
    let discordant = 0;

    for (let i = 0; i < commonIds.length; i++) {
      for (let j = i + 1; j < commonIds.length; j++) {
        const id1 = commonIds[i];
        const id2 = commonIds[j];
        
        const rank1_i = rank1Map.get(id1)!;
        const rank1_j = rank1Map.get(id2)!;
        const rank2_i = rank2Map.get(id1)!;
        const rank2_j = rank2Map.get(id2)!;

        const sign1 = Math.sign(rank1_i - rank1_j);
        const sign2 = Math.sign(rank2_i - rank2_j);

        if (sign1 === sign2) {
          concordant++;
        } else {
          discordant++;
        }
      }
    }

    const totalPairs = (n * (n - 1)) / 2;
    return totalPairs === 0 ? 1 : (concordant - discordant) / totalPairs;
  }

  /**
   * Бутстреп для обчислення довірчих інтервалів
   */
  static bootstrapConfidenceIntervals(
    reviewerRatings: Array<{
      reviewerId: string;
      normalizedTheta: Record<string, number>;
      reliabilityWeight: number;
    }>,
    managerIds: string[],
    bootstrapSamples: number = 1000
  ): { ciLow: Record<string, number>; ciHigh: Record<string, number> } {
    const bootstrapResults: Record<string, number[]> = {};
    
    managerIds.forEach(id => {
      bootstrapResults[id] = [];
    });

    // Виконуємо бутстреп семплінг
    for (let i = 0; i < bootstrapSamples; i++) {
      // Вибірка з поверненням рецензентів
      const sampledReviewers: typeof reviewerRatings = [];
      for (let j = 0; j < reviewerRatings.length; j++) {
        const randomIndex = Math.floor(Math.random() * reviewerRatings.length);
        sampledReviewers.push(reviewerRatings[randomIndex]);
      }

      // Агрегація для цієї вибірки
      const result = this.aggregateGlobalRatings(sampledReviewers, managerIds);
      
      // Збереження результатів
      managerIds.forEach(id => {
        bootstrapResults[id].push(result.mu[id]);
      });
    }

    // Обчислення 95% довірчих інтервалів
    const ciLow: Record<string, number> = {};
    const ciHigh: Record<string, number> = {};

    managerIds.forEach(id => {
      const sortedSamples = bootstrapResults[id].sort((a, b) => a - b);
      const n = sortedSamples.length;
      ciLow[id] = sortedSamples[Math.floor(n * 0.025)];
      ciHigh[id] = sortedSamples[Math.floor(n * 0.975)];
    });

    return { ciLow, ciHigh };
  }
}