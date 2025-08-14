import { BTModelParams, BTUpdateData, AppConfig } from '@/types';
import { Matrix, matrix, multiply, add, transpose, inv, subset, index, MathType } from 'mathjs';

/**
 * Bradley-Terry модель із онлайн SGD оновленнями
 */
export class BradleyTerryModel {
  private theta: Record<string, number> = {};
  private managerIds: string[] = [];
  private config: AppConfig;
  private stepCount: number = 0;

  constructor(managerIds: string[], config: AppConfig) {
    this.managerIds = [...managerIds];
    this.config = config;
    this.initializeTheta();
  }

  /**
   * Ініціалізація параметрів θ нулями
   */
  private initializeTheta(): void {
    this.managerIds.forEach(id => {
      this.theta[id] = 0;
    });
  }

  /**
   * Отримання поточних параметрів
   */
  getTheta(): Record<string, number> {
    return { ...this.theta };
  }

  /**
   * Встановлення параметрів (для відновлення моделі)
   */
  setTheta(theta: Record<string, number>): void {
    this.theta = { ...theta };
  }

  /**
   * Обчислення ймовірності перемоги i над j
   * P(i > j) = exp(θ_i - θ_j) / (1 + exp(θ_i - θ_j))
   */
  private probability(winnerId: string, loserId: string): number {
    const thetaDiff = this.theta[winnerId] - this.theta[loserId];
    return 1 / (1 + Math.exp(-thetaDiff));
  }

  /**
   * Онлайн оновлення параметрів за допомогою SGD
   * L^(r) = Σ w_ij * [(θ_i - θ_j) - log(1 + exp(θ_i - θ_j))] - λ/2 * Σ θ_i^2
   */
  updateOnline(updateData: BTUpdateData): void {
    this.stepCount++;
    const learningRate = this.config.learningRate / Math.sqrt(this.stepCount);
    
    // Accumulate gradients for all pairs
    const gradients: Record<string, number> = {};
    this.managerIds.forEach(id => {
      gradients[id] = 0;
    });

    // Process all pairs in the update
    updateData.pairs.forEach(({ winnerId, loserId, weight }) => {
      if (!this.theta.hasOwnProperty(winnerId) || !this.theta.hasOwnProperty(loserId)) {
        return; // Skip unknown managers
      }

      const prob = this.probability(winnerId, loserId);
      
      // Gradient for winner: w * (1 - P(i > j))
      gradients[winnerId] += weight * (1 - prob);
      
      // Gradient for loser: w * (-P(i > j))
      gradients[loserId] += weight * (-prob);
    });

    // Apply L2 regularization and update parameters
    this.managerIds.forEach(id => {
      // Add L2 regularization gradient: -λ * θ_i
      gradients[id] -= this.config.lambda * this.theta[id];
      
      // SGD update: θ_i = θ_i + lr * gradient
      this.theta[id] += learningRate * gradients[id];
    });

    // Ensure identifiability constraint: Σ θ_i = 0
    this.enforceIdentifiabilityConstraint();
  }

  /**
   * Забезпечення ідентифікації: Σ θ_i = 0
   */
  private enforceIdentifiabilityConstraint(): void {
    const mean = this.managerIds.reduce((sum, id) => sum + this.theta[id], 0) / this.managerIds.length;
    this.managerIds.forEach(id => {
      this.theta[id] -= mean;
    });
  }

  /**
   * Обчислення стандартних похибок за допомогою Лапласівського наближення
   * (інвертований Гессіан на діагоналі)
   */
  computeStandardErrors(pairs: Array<{winnerId: string, loserId: string, weight: number}>): Record<string, number> {
    const n = this.managerIds.length;
    
    // Initialize Hessian matrix
    const H = matrix(Array(n).fill(0).map(() => Array(n).fill(0)));
    const idToIndex = Object.fromEntries(this.managerIds.map((id, idx) => [id, idx]));

    // Compute Hessian: H_ij = -∂²L/∂θ_i∂θ_j
    pairs.forEach(({ winnerId, loserId, weight }) => {
      if (!idToIndex.hasOwnProperty(winnerId) || !idToIndex.hasOwnProperty(loserId)) {
        return;
      }

      const i = idToIndex[winnerId];
      const j = idToIndex[loserId];
      const prob = this.probability(winnerId, loserId);
      const hessianTerm = weight * prob * (1 - prob);

      // Diagonal terms
      const currentHii = (H as any).get([i, i]) as number;
      const currentHjj = (H as any).get([j, j]) as number;
      (H as any).set([i, i], currentHii + hessianTerm);
      (H as any).set([j, j], currentHjj + hessianTerm);

      // Off-diagonal terms
      const currentHij = (H as any).get([i, j]) as number;
      (H as any).set([i, j], currentHij - hessianTerm);
      (H as any).set([j, i], currentHij - hessianTerm);
    });

    // Add L2 regularization to diagonal
    for (let i = 0; i < n; i++) {
      const currentHii = (H as any).get([i, i]) as number;
      (H as any).set([i, i], currentHii + this.config.lambda);
    }

    try {
      // Compute inverse of Hessian
      const HInv = inv(H);
      
      // Extract standard errors from diagonal
      const standardErrors: Record<string, number> = {};
      this.managerIds.forEach((id, idx) => {
        const variance = (HInv as any).get([idx, idx]) as number;
        standardErrors[id] = Math.sqrt(Math.max(0, variance));
      });

      return standardErrors;
    } catch (error) {
      // If Hessian is not invertible, return default uncertainties
      const defaultSE = 0.1;
      const standardErrors: Record<string, number> = {};
      this.managerIds.forEach(id => {
        standardErrors[id] = defaultSE;
      });
      return standardErrors;
    }
  }

  /**
   * Отримання рейтингу менеджерів (відсортовано за θ)
   */
  getRanking(): Array<{ managerId: string; theta: number; rank: number }> {
    return this.managerIds
      .map(id => ({ managerId: id, theta: this.theta[id] }))
      .sort((a, b) => b.theta - a.theta)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  }

  /**
   * Конвертування у серіалізований формат
   */
  serialize(): BTModelParams {
    return {
      theta: this.getTheta(),
    };
  }

  /**
   * Відновлення з серіалізованих даних
   */
  static deserialize(data: BTModelParams, managerIds: string[], config: AppConfig): BradleyTerryModel {
    const model = new BradleyTerryModel(managerIds, config);
    model.setTheta(data.theta);
    return model;
  }
}

/**
 * Utility функції для роботи з парами
 */
export class PairGenerator {
  /**
   * Генерація 15 пар з одного екрану (3+1 вибору)
   * T = top3, M = middle3, L = loser1
   */
  static generatePairsFromScreen(top3Ids: string[], middleIds: string[], loserId: string): BTUpdateData {
    const pairs: BTUpdateData['pairs'] = [];
    const weight = 1 / 15; // Вага кожної пари

    // T > (M ∪ {L}): топ-3 кращі за середніх та аутсайдера (12 пар)
    top3Ids.forEach(topId => {
      [...middleIds, loserId].forEach(otherId => {
        pairs.push({
          winnerId: topId,
          loserId: otherId,
          weight,
        });
      });
    });

    // M > {L}: середні кращі за аутсайдера (3 пари)
    middleIds.forEach(midId => {
      pairs.push({
        winnerId: midId,
        loserId: loserId,
        weight,
      });
    });

    return { pairs };
  }

  /**
   * Обчислення всіх 7 менеджерів з екрану, розбиття на групи
   */
  static categorizeManagers(
    allSevenIds: string[],
    top3Ids: string[],
    loserId: string
  ): { top3: string[]; middle: string[]; loser: string } {
    const middleIds = allSevenIds.filter(id => 
      !top3Ids.includes(id) && id !== loserId
    );

    return {
      top3: top3Ids,
      middle: middleIds,
      loser: loserId,
    };
  }
}