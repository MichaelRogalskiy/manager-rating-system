'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RatingScreen, { Manager } from '@/components/RatingScreen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, BarChart3, CheckCircle } from 'lucide-react';

interface Session {
  id: string;
  reviewerId: string;
  status: string;
  createdAt: string;
}

interface ScreenData {
  screenId: string;
  managers: Manager[];
}

export default function RatingPage() {
  const params = useParams();
  const router = useRouter();
  const reviewerId = Array.isArray(params.reviewerId) ? params.reviewerId[0] : params.reviewerId;
  
  const [session, setSession] = useState<Session | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedScreens, setCompletedScreens] = useState(0);
  const [targetScreens] = useState(15); // Цільова кількість оцінок для якісного рейтингу

  // Ініціалізація сесії
  const initializeSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Створюємо нову сесію
      const sessionResponse = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerId }),
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || 'Не вдалося створити сесію');
      }

      const sessionData = await sessionResponse.json();
      const sessionObj = {
        id: sessionData.sessionId,
        reviewerId: reviewerId,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      };
      setSession(sessionObj);
      
      // Завантажуємо перший екран
      await loadNextScreen(sessionData.sessionId);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Невідома помилка');
    } finally {
      setLoading(false);
    }
  }, [reviewerId]);

  // Завантаження наступного екрану
  const loadNextScreen = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/screen/next?sessionId=${sessionId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не вдалося завантажити екран');
      }

      const screenData = await response.json();
      setCurrentScreen(screenData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження екрану');
    }
  }, []);

  // Відправка результатів екрану
  const handleScreenSubmit = useCallback(async (selection: {
    top3Ids: string[];
    loserId: string;
    unknownIds: string[];
  }) => {
    if (!currentScreen || !session) return;

    try {
      const response = await fetch('/api/screen/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenId: currentScreen.screenId,
          ...selection,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не вдалося зберегти результат');
      }

      // Збільшуємо лічильник завершених екранів
      const newCompletedCount = completedScreens + 1;
      setCompletedScreens(newCompletedCount);
      
      // Перевіряємо, чи досягнуто цільової кількості
      if (newCompletedCount >= targetScreens) {
        // Автоматичний перехід на персональний рейтинг
        setTimeout(() => {
          router.push(`/leaderboard/reviewer/${reviewerId}`);
        }, 1500); // Даємо час показати повідомлення про завершення
        return;
      }
      
      // Завантажуємо наступний екран
      await loadNextScreen(session.id);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка збереження');
    }
  }, [currentScreen, session, loadNextScreen, completedScreens, targetScreens, reviewerId, router]);

  // Ефект для ініціалізації
  useEffect(() => {
    if (reviewerId) {
      initializeSession();
    }
  }, [reviewerId, initializeSession]);

  // Відображення стану завантаження
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Завантаження сесії оцінювання...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Відображення помилки
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Помилка</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">{error}</p>
            <div className="flex gap-2">
              <Button onClick={initializeSession} className="flex-1">
                Спробувати знову
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/')}
                className="flex-1"
              >
                На головну
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Перевірка стану
  if (!session || !currentScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6">
            <p className="text-gray-600 text-center">Немає даних для відображення</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок з прогресом */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Система оцінки менеджерів
                </h1>
                <p className="text-gray-600">
                  ID Рецензента: {reviewerId}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Завершено: {completedScreens}
              </Badge>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/health')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Статистика
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/leaderboard/global')}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Рейтинги
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Прогрес-бар */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">
              Прогрес оцінювання
            </h3>
            <span className="text-sm text-gray-500">
              {completedScreens} / {targetScreens} порівнянь
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                completedScreens >= targetScreens 
                  ? 'bg-green-500' 
                  : 'bg-blue-500'
              }`}
              style={{ 
                width: `${Math.min((completedScreens / targetScreens) * 100, 100)}%` 
              }}
            ></div>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            {completedScreens >= targetScreens ? (
              <span className="text-green-600 font-medium animate-pulse">
                ✅ Готово! Переходимо до вашого персонального рейтингу...
              </span>
            ) : (
              <span>
                Ще {targetScreens - completedScreens} порівнянь для повного рейтингу
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Основний контент */}
      <main className="py-8">
        <RatingScreen
          screenId={currentScreen.screenId}
          managers={currentScreen.managers}
          onSubmit={handleScreenSubmit}
        />
      </main>

      {/* Футер */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center text-gray-500">
            <p>Система оцінки менеджерів на базі Bradley-Terry моделі</p>
            <p className="text-sm mt-2">
              Ваші оцінки допомагають визначити найкращих керівників
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}