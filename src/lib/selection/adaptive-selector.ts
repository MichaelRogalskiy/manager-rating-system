import { ManagerWithStats, ManagerBucket, SelectionCriteria, AppConfig } from '@/types';

/**
 * Адаптивний селектор 7 менеджерів для оптимального оцінювання
 */
export class AdaptiveSelector {
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
  }

  /**
   * Основний метод відбору 7 менеджерів для екрану
   */
  select7Managers(
    reviewerId: string,
    availableManagers: ManagerWithStats[],
    recentCombinations: Set<string> = new Set(),
    unknownManagerIds: Set<string> = new Set()
  ): ManagerWithStats[] {
    // Фільтруємо менеджерів, яких рецензент не знає
    const knownManagers = availableManagers.filter(m => !unknownManagerIds.has(m.id));
    
    if (knownManagers.length < 7) {
      throw new Error(`Недостатньо відомих менеджерів для рецензента: ${knownManagers.length} < 7`);
    }

    // Розділяємо менеджерів за бакетами та сортуємо за пріоритетом
    const buckets = this.categorizeToBuckets(knownManagers);
    const criteria = this.config.selectionCriteria;

    const selectedManagers: ManagerWithStats[] = [];

    // 1. Відбираємо з TOP бакету
    const topCandidates = this.prioritizeByUncertaintyAndExposure(buckets.TOP);
    selectedManagers.push(...topCandidates.slice(0, criteria.topCount));

    // 2. Відбираємо з MID бакету
    const midCandidates = this.prioritizeByUncertaintyAndExposure(buckets.MID);
    selectedManagers.push(...midCandidates.slice(0, criteria.midCount));

    // 3. Відбираємо з LOW бакету
    const lowCandidates = this.prioritizeByUncertaintyAndExposure(buckets.LOW);
    selectedManagers.push(...lowCandidates.slice(0, criteria.lowCount));

    // 4. Відбираємо "якір" (стабільний елемент)
    const anchorCandidate = this.selectAnchor(knownManagers, selectedManagers);
    if (anchorCandidate) {
      selectedManagers.push(anchorCandidate);
    }

    // 5. Якщо не вистачає, доповнюємо найкращими кандидатами
    while (selectedManagers.length < 7) {
      const remaining = knownManagers.filter(m => 
        !selectedManagers.some(selected => selected.id === m.id)
      );
      
      if (remaining.length === 0) break;
      
      const prioritized = this.prioritizeByUncertaintyAndExposure(remaining);
      selectedManagers.push(prioritized[0]);
    }

    // 6. Перевіряємо унікальність комбінації
    const combinationKey = this.getCombinationKey(selectedManagers.map(m => m.id));
    if (recentCombinations.has(combinationKey) && selectedManagers.length === 7) {
      // Якщо комбінація повторюється, міняємо один елемент
      return this.perturbSelection(selectedManagers, knownManagers, recentCombinations);
    }

    return selectedManagers.slice(0, 7);
  }

  /**
   * Розподіл менеджерів за бакетами TOP/MID/LOW
   */
  private categorizeToBuckets(managers: ManagerWithStats[]): Record<ManagerBucket, ManagerWithStats[]> {
    const sorted = [...managers].sort((a, b) => (b.theta || 0) - (a.theta || 0));
    const n = sorted.length;
    
    const topSize = Math.ceil(n * 0.3);
    const lowSize = Math.ceil(n * 0.3);
    
    const buckets: Record<ManagerBucket, ManagerWithStats[]> = {
      TOP: sorted.slice(0, topSize).map(m => ({ ...m, bucket: 'TOP' })),
      MID: sorted.slice(topSize, n - lowSize).map(m => ({ ...m, bucket: 'MID' })),
      LOW: sorted.slice(n - lowSize).map(m => ({ ...m, bucket: 'LOW' })),
    };

    return buckets;
  }

  /**
   * Пріоритизація за невизначеністю та експозицією
   */
  private prioritizeByUncertaintyAndExposure(managers: ManagerWithStats[]): ManagerWithStats[] {
    return [...managers].sort((a, b) => {
      // Спочатку за невизначеністю (більша невизначеність = вищий пріоритет)
      const uncertaintyDiff = b.uncertainty - a.uncertainty;
      if (Math.abs(uncertaintyDiff) > 0.1) {
        return uncertaintyDiff;
      }
      
      // Потім за експозицією (менша експозиція = вищий пріоритет)
      return a.exposureCount - b.exposureCount;
    });
  }

  /**
   * Відбір "якоря" - стабільного елемента для зв'язності шкали
   */
  private selectAnchor(
    allManagers: ManagerWithStats[],
    alreadySelected: ManagerWithStats[]
  ): ManagerWithStats | null {
    const selectedIds = new Set(alreadySelected.map(m => m.id));
    
    // Шукаємо менеджерів з низькою невизначеністю та розумною експозицією
    const anchorCandidates = allManagers.filter(m => 
      !selectedIds.has(m.id) && 
      m.uncertainty < 0.5 && 
      m.exposureCount >= 3
    );

    if (anchorCandidates.length === 0) {
      // Якщо немає хороших якорів, беремо будь-кого
      const remaining = allManagers.filter(m => !selectedIds.has(m.id));
      return remaining.length > 0 ? remaining[0] : null;
    }

    // Сортуємо за стабільністю (низька невизначеність, помірна експозиція)
    anchorCandidates.sort((a, b) => {
      const aStability = -a.uncertainty + Math.min(a.exposureCount, 10) * 0.1;
      const bStability = -b.uncertainty + Math.min(b.exposureCount, 10) * 0.1;
      return bStability - aStability;
    });

    return anchorCandidates[0];
  }

  /**
   * Генерація ключа комбінації для перевірки унікальності
   */
  private getCombinationKey(managerIds: string[]): string {
    return [...managerIds].sort().join('-');
  }

  /**
   * Модифікація відбору при повторенні комбінації
   */
  private perturbSelection(
    currentSelection: ManagerWithStats[],
    allManagers: ManagerWithStats[],
    recentCombinations: Set<string>
  ): ManagerWithStats[] {
    const selectedIds = new Set(currentSelection.map(m => m.id));
    const alternatives = allManagers.filter(m => !selectedIds.has(m.id));
    
    if (alternatives.length === 0) {
      return currentSelection; // Нічого не можемо змінити
    }

    // Замінюємо найменш пріоритетного з поточного відбору
    const leastPriority = [...currentSelection].sort((a, b) => 
      a.uncertainty - b.uncertainty + (b.exposureCount - a.exposureCount) * 0.1
    )[0];

    const bestAlternative = this.prioritizeByUncertaintyAndExposure(alternatives)[0];
    
    const newSelection = currentSelection.map(m => 
      m.id === leastPriority.id ? bestAlternative : m
    );

    return newSelection;
  }

  /**
   * Холодний запуск - латинські блоки для рівномірного початку
   */
  static generateColdStartSequence(
    allManagers: ManagerWithStats[],
    numberOfReviewers: number
  ): ManagerWithStats[][] {
    const sequences: ManagerWithStats[][] = [];
    const managersCopy = [...allManagers];
    
    // Перемішуємо менеджерів
    for (let i = managersCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [managersCopy[i], managersCopy[j]] = [managersCopy[j], managersCopy[i]];
    }

    // Генеруємо латинські блоки 7x7
    for (let reviewerIdx = 0; reviewerIdx < numberOfReviewers; reviewerIdx++) {
      const blocks: ManagerWithStats[][] = [];
      
      for (let blockStart = 0; blockStart < managersCopy.length; blockStart += 7) {
        const block = managersCopy.slice(blockStart, blockStart + 7);
        if (block.length === 7) {
          // Ротація для кожного рецензента
          const rotated = [
            ...block.slice(reviewerIdx % 7),
            ...block.slice(0, reviewerIdx % 7),
          ];
          blocks.push(rotated);
        }
      }
      
      sequences.push(...blocks);
    }

    return sequences;
  }

  /**
   * Перевірка критеріїв зупинки для рецензента
   */
  checkStopCriteria(
    reviewerId: string,
    currentRanking: Array<{managerId: string; theta: number; rank: number}>,
    previousRanking: Array<{managerId: string; theta: number; rank: number}> | null,
    exposureCounts: Record<string, number>,
    totalScreens: number
  ): { shouldStop: boolean; reason?: string } {
    // Максимальна кількість екранів
    if (totalScreens >= this.config.targetScreensPerReviewer + 5) {
      return { shouldStop: true, reason: 'Досягнуто максимум екранів' };
    }

    // Мінімальне покриття
    const minExposure = Math.min(...Object.values(exposureCounts));
    if (minExposure < this.config.minScreensPerManager) {
      return { shouldStop: false };
    }

    // Стабільність рейтингу (Kendall's tau)
    if (previousRanking && totalScreens >= 10) {
      const tau = this.calculateKendallTau(currentRanking, previousRanking);
      if (tau >= 0.9) {
        return { shouldStop: true, reason: 'Стабільний рейтинг досягнуто' };
      }
    }

    // Цільова кількість екранів
    if (totalScreens >= this.config.targetScreensPerReviewer) {
      return { shouldStop: true, reason: 'Цільова кількість екранів досягнута' };
    }

    return { shouldStop: false };
  }

  /**
   * Розрахунок Kendall's tau між двома рейтингами
   */
  private calculateKendallTau(
    ranking1: Array<{managerId: string; rank: number}>,
    ranking2: Array<{managerId: string; rank: number}>
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
}