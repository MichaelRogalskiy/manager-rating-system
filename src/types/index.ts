export interface Manager {
  id: string;
  lastName: string;
  firstName: string;
  patronymic: string;
  position: string;
  createdAt: Date;
}

export interface Rater {
  id: string;
  fullName: string;
  createdAt: Date;
}

export interface RaterSession {
  id: string;
  raterId: string;
  token: string;
  createdAt: Date;
}

export interface Comparison {
  id: string;
  raterId: string;
  leftManagerId: string;
  rightManagerId: string;
  winnerManagerId: string;
  decidedAt: Date;
}

export interface EloScore {
  raterId: string;
  managerId: string;
  rating: number;
  games: number;
}

export interface CompanyScore {
  managerId: string;
  rating: number;
  updatedAt: Date;
}

export interface ManagerPair {
  left: Manager;
  right: Manager;
}

export interface Progress {
  done: number;
  target: number;
  left: number;
  percentage: number;
}

export interface RatingEntry {
  place: number;
  manager: Manager;
  rating: number;
}

export interface CSVRow {
  id: string;
  last_name?: string;
  first_name?: string;
  patronymic?: string;
  position?: string;
  // Alternative format
  ID?: string;
  'Прізвище'?: string;
  "Ім'я"?: string;
  'По батькові'?: string;
  'Посада'?: string;
}

export interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export interface AppConfig {
  K0: number;
  gamesMin: number;
  minGamesPerManager: number;
  m: number;
}

export interface SessionData {
  raterId: string;
  token: string;
  fullName: string;
}