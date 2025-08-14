import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Manager, ManagerPair, Progress, RatingEntry, SessionData, AppConfig } from '@/types';

interface AppState {
  // Session
  session: SessionData | null;
  setSession: (session: SessionData | null) => void;
  
  // Current comparison
  currentPair: ManagerPair | null;
  setCurrentPair: (pair: ManagerPair | null) => void;
  
  // Progress
  progress: Progress;
  setProgress: (progress: Progress) => void;
  
  // Results
  personalRating: RatingEntry[];
  setPersonalRating: (rating: RatingEntry[]) => void;
  
  companyRating: RatingEntry[];
  setCompanyRating: (rating: RatingEntry[]) => void;
  
  // Managers
  managers: Manager[];
  setManagers: (managers: Manager[]) => void;
  
  // Config
  config: AppConfig;
  setConfig: (config: Partial<AppConfig>) => void;
  
  // UI State
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  
  error: string | null;
  setError: (error: string | null) => void;
  
  // Actions
  clearSession: () => void;
  reset: () => void;
}

const defaultConfig: AppConfig = {
  K0: 50,
  gamesMin: 10,
  minGamesPerManager: 6,
  m: 1.8
};

const defaultProgress: Progress = {
  done: 0,
  target: 0,
  left: 0,
  percentage: 0
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Session
      session: null,
      setSession: (session) => set({ session }),
      
      // Current comparison
      currentPair: null,
      setCurrentPair: (pair) => set({ currentPair: pair }),
      
      // Progress
      progress: defaultProgress,
      setProgress: (progress) => set({ progress }),
      
      // Results
      personalRating: [],
      setPersonalRating: (rating) => set({ personalRating: rating }),
      
      companyRating: [],
      setCompanyRating: (rating) => set({ companyRating: rating }),
      
      // Managers
      managers: [],
      setManagers: (managers) => set({ managers }),
      
      // Config
      config: defaultConfig,
      setConfig: (newConfig) => set({ 
        config: { ...get().config, ...newConfig } 
      }),
      
      // UI State
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),
      
      error: null,
      setError: (error) => set({ error }),
      
      // Actions
      clearSession: () => set({ 
        session: null, 
        currentPair: null, 
        progress: defaultProgress,
        personalRating: [] 
      }),
      
      reset: () => set({
        session: null,
        currentPair: null,
        progress: defaultProgress,
        personalRating: [],
        companyRating: [],
        managers: [],
        isLoading: false,
        error: null
      })
    }),
    {
      name: 'elomenedger-storage',
      partialize: (state) => ({
        session: state.session,
        config: state.config
      })
    }
  )
);