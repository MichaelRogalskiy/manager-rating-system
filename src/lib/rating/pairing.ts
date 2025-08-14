import { Manager, EloScore, ManagerPair } from '@/types';

export interface PairCandidate {
  left: Manager;
  right: Manager;
  ratingDiff: number;
  priority: number;
}

export class ActivePairingAlgorithm {
  // Generate deterministic random seed from session token
  private seedFromToken(token: string): number {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Simple seeded random number generator
  private seededRandom(seed: number): () => number {
    let currentSeed = seed;
    return () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
  }

  // Get all pairs that have already been compared by this rater
  private getSeenPairs(raterId: string, comparisons: Array<{
    raterId: string;
    leftManagerId: string;
    rightManagerId: string;
  }>): Set<string> {
    const seenPairs = new Set<string>();
    
    comparisons
      .filter(c => c.raterId === raterId)
      .forEach(c => {
        // Store both orderings since we don't care about left/right
        const key1 = `${c.leftManagerId}-${c.rightManagerId}`;
        const key2 = `${c.rightManagerId}-${c.leftManagerId}`;
        seenPairs.add(key1);
        seenPairs.add(key2);
      });
    
    return seenPairs;
  }

  // Create pair key (order-independent)
  private createPairKey(id1: string, id2: string): string {
    return id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
  }

  // Get managers sorted by number of games (least experienced first)
  private getManagersByExperience(
    managers: Manager[],
    eloScores: EloScore[]
  ): Array<{ manager: Manager; games: number; rating: number }> {
    return managers.map(manager => {
      const score = eloScores.find(s => s.managerId === manager.id);
      return {
        manager,
        games: score?.games || 0,
        rating: score?.rating || 1500,
      };
    }).sort((a, b) => a.games - b.games);
  }

  // Generate pair candidates with priority scoring
  private generateCandidates(
    managers: Array<{ manager: Manager; games: number; rating: number }>,
    seenPairs: Set<string>,
    maxCandidates: number = 50
  ): PairCandidate[] {
    const candidates: PairCandidate[] = [];
    
    // Prioritize managers with fewer games
    const shortlist = managers.slice(0, Math.max(10, Math.ceil(managers.length / 3)));
    
    for (let i = 0; i < shortlist.length; i++) {
      for (let j = i + 1; j < shortlist.length; j++) {
        const left = shortlist[i];
        const right = shortlist[j];
        
        const pairKey = this.createPairKey(left.manager.id, right.manager.id);
        if (seenPairs.has(pairKey)) continue;
        
        const ratingDiff = Math.abs(left.rating - right.rating);
        
        // Priority calculation:
        // - Lower games difference = higher priority
        // - Lower rating difference = higher priority
        // - Minimum games get extra boost
        const gamesDiff = Math.abs(left.games - right.games);
        const minGames = Math.min(left.games, right.games);
        
        const gamesPriority = 1000 - gamesDiff; // Lower difference is better
        const ratingPriority = 1000 - (ratingDiff / 10); // Lower difference is better
        const experiencePriority = minGames < 5 ? 500 : 0; // Boost for inexperienced
        
        const priority = gamesPriority + ratingPriority + experiencePriority;
        
        candidates.push({
          left: left.manager,
          right: right.manager,
          ratingDiff,
          priority,
        });
        
        if (candidates.length >= maxCandidates) break;
      }
      if (candidates.length >= maxCandidates) break;
    }
    
    return candidates.sort((a, b) => b.priority - a.priority);
  }

  // Fallback round-robin generation for early stage
  private generateRoundRobinPair(
    managers: Manager[],
    seenPairs: Set<string>,
    sessionToken: string
  ): ManagerPair | null {
    const random = this.seededRandom(this.seedFromToken(sessionToken));
    const shuffled = [...managers].sort(() => random() - 0.5);
    
    for (let i = 0; i < shuffled.length; i++) {
      for (let j = i + 1; j < shuffled.length; j++) {
        const left = shuffled[i];
        const right = shuffled[j];
        const pairKey = this.createPairKey(left.id, right.id);
        
        if (!seenPairs.has(pairKey)) {
          return { left, right };
        }
      }
    }
    
    return null; // All pairs have been seen
  }

  // Main function to get next optimal pair
  getNextPair(
    raterId: string,
    managers: Manager[],
    eloScores: EloScore[],
    comparisons: Array<{
      raterId: string;
      leftManagerId: string;
      rightManagerId: string;
    }>,
    sessionToken: string
  ): ManagerPair | null {
    
    if (managers.length < 2) return null;
    
    const seenPairs = this.getSeenPairs(raterId, comparisons);
    const managersByExperience = this.getManagersByExperience(managers, eloScores);
    
    // Check if we're in early stage (most managers have < 3 games)
    const inexperiencedCount = managersByExperience.filter(m => m.games < 3).length;
    const isEarlyStage = inexperiencedCount > managers.length / 2;
    
    if (isEarlyStage) {
      // Use round-robin approach for early stage
      return this.generateRoundRobinPair(managers, seenPairs, sessionToken);
    }
    
    // Use sophisticated pairing for later stages
    const candidates = this.generateCandidates(managersByExperience, seenPairs);
    
    if (candidates.length === 0) {
      // Fallback to round-robin if no candidates found
      return this.generateRoundRobinPair(managers, seenPairs, sessionToken);
    }
    
    // Select from top candidates with some randomness
    const topCandidates = candidates.filter(
      c => c.priority >= candidates[0].priority - 100
    );
    
    const random = this.seededRandom(this.seedFromToken(sessionToken + raterId));
    const selectedIndex = Math.floor(random() * topCandidates.length);
    const selected = topCandidates[selectedIndex];
    
    return {
      left: selected.left,
      right: selected.right,
    };
  }

  // Check if more pairs are available
  hasMorePairs(
    raterId: string,
    managers: Manager[],
    comparisons: Array<{
      raterId: string;
      leftManagerId: string;
      rightManagerId: string;
    }>
  ): boolean {
    const seenPairs = this.getSeenPairs(raterId, comparisons);
    const totalPossible = (managers.length * (managers.length - 1)) / 2;
    return seenPairs.size / 2 < totalPossible; // Divide by 2 because we store both orderings
  }

  // Get statistics about comparison coverage
  getCoverageStats(
    raterId: string,
    managers: Manager[],
    eloScores: EloScore[],
    comparisons: Array<{
      raterId: string;
      leftManagerId: string;
      rightManagerId: string;
    }>
  ): {
    totalPossible: number;
    completed: number;
    percentage: number;
    minGames: number;
    maxGames: number;
    avgGames: number;
  } {
    const seenPairs = this.getSeenPairs(raterId, comparisons);
    const totalPossible = (managers.length * (managers.length - 1)) / 2;
    const completed = seenPairs.size / 2;
    
    const games = managers.map(m => {
      const score = eloScores.find(s => s.managerId === m.id);
      return score?.games || 0;
    });
    
    const minGames = Math.min(...games);
    const maxGames = Math.max(...games);
    const avgGames = games.reduce((sum, g) => sum + g, 0) / games.length;
    
    return {
      totalPossible,
      completed,
      percentage: (completed / totalPossible) * 100,
      minGames,
      maxGames,
      avgGames,
    };
  }
}