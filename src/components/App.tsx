'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';
import { exportPersonalRating, exportCompanyRating } from '@/lib/export';

import { InstructionScreen } from './screens/InstructionScreen';
import { ComparisonScreen } from './screens/ComparisonScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { AdminDashboard } from './screens/AdminDashboard';

import { ManagerPair, RatingEntry, ImportResult } from '@/types';

type AppScreen = 'instructions' | 'comparing' | 'results' | 'admin';

export function App() {
  const {
    session,
    currentPair,
    progress,
    personalRating,
    companyRating,
    managers,
    isLoading,
    error,
    setSession,
    setCurrentPair,
    setProgress,
    setPersonalRating,
    setCompanyRating,
    setManagers,
    setLoading,
    setError,
    clearSession,
  } = useAppStore();

  const [screen, setScreen] = useState<AppScreen>('instructions');
  const [adminStats, setAdminStats] = useState({
    totalRaters: 0,
    totalComparisons: 0,
    averageComparisons: 0,
  });

  // Initialize app
  useEffect(() => {
    // Only access window on client side to prevent hydration mismatch
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const adminMode = urlParams.get('admin') === 'true';
      
      if (adminMode) {
        setScreen('admin');
        loadAdminData();
      } else if (session) {
        setScreen('comparing');
        loadNextPair();
      }
    }
  }, [session]);

  // Auto-load next pair when current pair changes
  useEffect(() => {
    if (screen === 'comparing' && !currentPair && session) {
      loadNextPair();
    }
  }, [screen, currentPair, session]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [ranking, stats] = await Promise.all([
        api.getCompanyRanking(),
        api.getStatistics(),
      ]);
      
      setCompanyRating(ranking);
      setAdminStats(stats);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Помилка завантаження даних');
    } finally {
      setLoading(false);
    }
  };

  const loadNextPair = async () => {
    if (!session) return;

    try {
      setLoading(true);
      const response = await api.getNextPair(session.token);
      
      setProgress(response.progress);
      
      if (response.completed || !response.left || !response.right) {
        // Load personal rating and switch to results
        const ranking = await api.getPersonalRanking(session.token);
        setPersonalRating(ranking);
        setCurrentPair(null);
        setScreen('results');
      } else {
        setCurrentPair({
          left: response.left,
          right: response.right,
        });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Помилка завантаження пари');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (fullName: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const sessionData = await api.createSession(fullName);
      setSession(sessionData);
      setScreen('comparing');
      
      // Load next pair will be triggered by useEffect
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Помилка створення сесії');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (winnerId: string) => {
    if (!session || !currentPair) return;

    try {
      const response = await api.submitVote(
        session.token,
        currentPair.left.id,
        currentPair.right.id,
        winnerId
      );

      setProgress(response.progress);

      if (response.nextPair) {
        setCurrentPair(response.nextPair);
      } else {
        // No more pairs - show results
        const ranking = await api.getPersonalRanking(session.token);
        setPersonalRating(ranking);
        setCurrentPair(null);
        setScreen('results');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Помилка збереження голосу');
      throw error;
    }
  };

  const handleSkip = () => {
    // In a real implementation, this might record a skip
    // For now, just load next pair
    loadNextPair();
  };

  const handleExportPersonal = () => {
    if (personalRating.length > 0 && session) {
      exportPersonalRating(personalRating, session.fullName);
    }
  };

  const handleExportCompany = () => {
    if (companyRating.length > 0) {
      exportCompanyRating(companyRating);
    }
  };

  const handleRestart = () => {
    clearSession();
    setScreen('instructions');
    setCurrentPair(null);
    setPersonalRating([]);
    setError(null);
  };

  const handleImportCsv = async (file: File): Promise<ImportResult> => {
    try {
      const result = await api.importCsv(file);
      return result;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Помилка імпорту');
    }
  };

  const handleRecomputeRatings = async () => {
    try {
      await api.recomputeRatings();
      // Reload admin data
      loadAdminData();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Помилка перерахунку');
    }
  };

  const handleRefreshAdmin = () => {
    loadAdminData();
  };

  // Calculate estimated comparisons for instructions
  const estimatedComparisons = managers.length > 0 
    ? Math.ceil(1.8 * managers.length * Math.log2(managers.length))
    : 50; // Default estimate

  // Render loading state
  if (isLoading && screen !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary-600">Завантаження...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && screen !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-danger-50 to-secondary-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-danger-900 mb-2">Помилка</h2>
          <p className="text-danger-700 mb-4">{error}</p>
          <button
            onClick={() => setError(null)}
            className="px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700"
          >
            Спробувати знову
          </button>
        </div>
      </div>
    );
  }

  // Render appropriate screen
  switch (screen) {
    case 'instructions':
      return (
        <InstructionScreen
          onStart={handleStartSession}
          managerCount={managers.length || 20} // Default for demo
          estimatedComparisons={estimatedComparisons}
        />
      );

    case 'comparing':
      if (!currentPair) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-secondary-600">Підготовка наступного порівняння...</p>
            </div>
          </div>
        );
      }
      
      return (
        <ComparisonScreen
          pair={currentPair}
          progress={progress}
          onVote={handleVote}
          onSkip={handleSkip}
        />
      );

    case 'results':
      return (
        <ResultsScreen
          ranking={personalRating}
          raterName={session?.fullName || 'Невідомо'}
          onExportCsv={handleExportPersonal}
          onRestart={handleRestart}
        />
      );

    case 'admin':
      return (
        <AdminDashboard
          companyRanking={companyRating}
          statistics={adminStats}
          onImportCsv={handleImportCsv}
          onExportCompanyCsv={handleExportCompany}
          onRecompute={handleRecomputeRatings}
          onRefresh={handleRefreshAdmin}
        />
      );

    default:
      return <div>Невідомий стан додатку</div>;
  }
}