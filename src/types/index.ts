// Bradley-Terry модель типи
export interface BTModelParams {
  theta: Record<string, number>; // managerId -> theta value
  standardErrors?: Record<string, number>;
}

export interface BTUpdateData {
  pairs: Array<{
    winnerId: string;
    loserId: string;
    weight: number;
  }>;
}

// API типи
export interface SubmitScreenRequest {
  screenId: string;
  top3Ids: string[];
  loserId: string;
  unknownIds?: string[];
}

export interface NextScreenResponse {
  screenId: string;
  managers: Array<{
    id: string;
    name: string;
    position: string;
  }>;
}

export interface LeaderboardEntry {
  managerId: string;
  name: string;
  position: string;
  score: number;
  ciLow?: number;
  ciHigh?: number;
  rank: number;
}

export interface ConsensusData {
  agree: Array<{
    managerId: string;
    consensusScore: number;
    variance: number;
    rankGlobal: number;
  }>;
  disagree: Array<{
    managerId: string;
    variance: number;
    spreadByReviewer: Record<string, number>;
  }>;
}

// Manager bucket types for adaptive selection
export type ManagerBucket = 'TOP' | 'MID' | 'LOW';

export interface ManagerWithStats {
  id: string;
  name: string;
  position: string;
  bucket: ManagerBucket;
  uncertainty: number;
  exposureCount: number;
  theta?: number;
}

// Selection algorithms
export interface SelectionCriteria {
  topCount: number;
  midCount: number;
  lowCount: number;
  anchorCount: number;
}

// Quality control
export interface QualityMetrics {
  goldChecksPassed: number;
  totalGoldChecks: number;
  inconsistencyRate: number;
  kendallTauToGlobal?: number;
}

// Normalization
export interface NormalizationResult {
  normalizedTheta: Record<string, number>;
  median: number;
  mad: number;
}

export interface GlobalAggregationResult {
  mu: Record<string, number>;
  ciLow: Record<string, number>;
  ciHigh: Record<string, number>;
  variance: Record<string, number>;
}

// Configuration
export interface AppConfig {
  lambda: number; // L2 регуляризація
  learningRate: number; // для SGD
  minScreensPerManager: number;
  targetScreensPerReviewer: number;
  goldScreenFrequency: number;
  selectionCriteria: SelectionCriteria;
}

export const DEFAULT_CONFIG: AppConfig = {
  lambda: 0.01,
  learningRate: 0.1,
  minScreensPerManager: 8,
  targetScreensPerReviewer: 20,
  goldScreenFrequency: 0.15, // 15% золотих екранів
  selectionCriteria: {
    topCount: 2,
    midCount: 3,
    lowCount: 1,
    anchorCount: 1,
  },
};

// Stop criteria
export interface StopCriteria {
  kendallTauThreshold: number;
  minManagerExposure: number;
  maxScreensPerReviewer: number;
}

export const DEFAULT_STOP_CRITERIA: StopCriteria = {
  kendallTauThreshold: 0.9,
  minManagerExposure: 8,
  maxScreensPerReviewer: 25,
};