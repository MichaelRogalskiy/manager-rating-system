import { EloScore, AppConfig } from '@/types';

export interface EloUpdate {
  winnerId: string;
  loserId: string;
  newWinnerRating: number;
  newLoserRating: number;
  newWinnerGames: number;
  newLoserGames: number;
}

export class EloRatingSystem {
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
  }

  // Calculate expected score for player A vs player B
  calculateExpectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  // Calculate dynamic K-factor based on number of games played
  calculateKFactor(gamesA: number, gamesB: number): number {
    const minGames = Math.min(gamesA, gamesB);
    return this.config.K0 / (1 + this.config.gamesMin / (1 + minGames));
  }

  // Apply vote result and return updated ratings
  applyVote(
    winnerId: string, 
    loserId: string, 
    winnerScore: EloScore, 
    loserScore: EloScore
  ): EloUpdate {
    const expectedWinner = this.calculateExpectedScore(winnerScore.rating, loserScore.rating);
    const expectedLoser = 1 - expectedWinner;

    const kFactor = this.calculateKFactor(winnerScore.games, loserScore.games);

    const newWinnerRating = winnerScore.rating + kFactor * (1 - expectedWinner);
    const newLoserRating = loserScore.rating + kFactor * (0 - expectedLoser);

    return {
      winnerId,
      loserId,
      newWinnerRating,
      newLoserRating,
      newWinnerGames: winnerScore.games + 1,
      newLoserGames: loserScore.games + 1,
    };
  }

  // Initialize rating for new manager-rater pair
  initializeRating(): { rating: number; games: number } {
    return {
      rating: 1500,
      games: 0,
    };
  }

  // Calculate target number of comparisons for a rater
  calculateTargetComparisons(managerCount: number): number {
    const allPossiblePairs = (managerCount * (managerCount - 1)) / 2;
    const algorithmicTarget = Math.ceil(this.config.m * managerCount * Math.log2(managerCount));
    return Math.min(allPossiblePairs, algorithmicTarget);
  }

  // Calculate minimum target ensuring coverage
  calculateMinimumTarget(managerCount: number): number {
    return Math.ceil((managerCount * this.config.minGamesPerManager) / 2);
  }

  // Get effective target (max of algorithmic and minimum)
  getEffectiveTarget(managerCount: number): number {
    const algorithmicTarget = this.calculateTargetComparisons(managerCount);
    const minimumTarget = this.calculateMinimumTarget(managerCount);
    return Math.max(algorithmicTarget, minimumTarget);
  }

  // Check if rater has completed enough comparisons
  isCompletionReached(
    done: number, 
    managerCount: number, 
    managerGames: Record<string, number>
  ): boolean {
    const target = this.getEffectiveTarget(managerCount);
    const hasReachedTarget = done >= target;
    
    // Check if every manager has minimum games
    const minGamesReached = Object.values(managerGames).every(
      games => games >= this.config.minGamesPerManager
    );
    
    return hasReachedTarget && minGamesReached;
  }
}

// Company-wide rating calculation with centering
export class CompanyRatingCalculator {
  // Center ratings around mean for each rater to reduce bias
  centerRaterRatings(ratings: { managerId: string; rating: number }[]): 
    { managerId: string; centeredRating: number }[] {
    
    if (ratings.length === 0) return [];
    
    const mean = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    
    return ratings.map(r => ({
      managerId: r.managerId,
      centeredRating: r.rating - mean,
    }));
  }

  // Calculate company-wide ratings from all raters
  calculateCompanyRatings(
    raterRatings: Array<{
      raterId: string;
      ratings: { managerId: string; rating: number }[];
    }>
  ): { managerId: string; rating: number }[] {
    
    const managerRatings = new Map<string, number[]>();
    
    // Collect centered ratings from all raters
    raterRatings.forEach(rater => {
      const centeredRatings = this.centerRaterRatings(rater.ratings);
      
      centeredRatings.forEach(({ managerId, centeredRating }) => {
        if (!managerRatings.has(managerId)) {
          managerRatings.set(managerId, []);
        }
        managerRatings.get(managerId)!.push(centeredRating);
      });
    });
    
    // Calculate average centered rating for each manager
    const averageRatings = Array.from(managerRatings.entries()).map(
      ([managerId, ratings]) => ({
        managerId,
        averageRating: ratings.reduce((sum, r) => sum + r, 0) / ratings.length,
      })
    );
    
    // Normalize to convenient range (mean 1500, std ~200)
    return this.normalizeRatings(averageRatings, 1500, 200);
  }

  // Normalize ratings to target mean and standard deviation
  private normalizeRatings(
    ratings: { managerId: string; averageRating: number }[],
    targetMean: number,
    targetStd: number
  ): { managerId: string; rating: number }[] {
    
    if (ratings.length === 0) return [];
    if (ratings.length === 1) {
      return [{ managerId: ratings[0].managerId, rating: targetMean }];
    }
    
    // Calculate current mean and std
    const currentMean = ratings.reduce((sum, r) => sum + r.averageRating, 0) / ratings.length;
    const variance = ratings.reduce(
      (sum, r) => sum + Math.pow(r.averageRating - currentMean, 2), 0
    ) / ratings.length;
    const currentStd = Math.sqrt(variance);
    
    // Avoid division by zero
    if (currentStd === 0) {
      return ratings.map(r => ({ managerId: r.managerId, rating: targetMean }));
    }
    
    // Normalize: z = (x - mean) / std, then new_x = target_mean + z * target_std
    return ratings.map(r => ({
      managerId: r.managerId,
      rating: targetMean + ((r.averageRating - currentMean) / currentStd) * targetStd,
    }));
  }
}