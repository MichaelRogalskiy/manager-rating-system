'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReviewerForm from '@/components/ReviewerForm';
import { 
  Users, 
  BarChart3, 
  Trophy, 
  TrendingUp, 
  CheckCircle, 
  Activity,
  ArrowRight,
  Plus,
  UserPlus
} from 'lucide-react';

interface Reviewer {
  id: string;
  name: string;
  active: boolean;
  reliabilityWeight: number;
}

interface SystemStats {
  totalReviewers: number;
  totalManagers: number;
  totalScreens: number;
  activeReviewers: number;
}

export default function HomePage() {
  const router = useRouter();
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewerForm, setShowReviewerForm] = useState(false);

  // Завантаження даних
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Завантажуємо реальні дані з API
        const [reviewersResponse, statsResponse] = await Promise.all([
          fetch('/api/reviewers'),
          fetch('/api/health')
        ]);

        if (reviewersResponse.ok) {
          const reviewersData = await reviewersResponse.json();
          setReviewers(reviewersData);
        } else {
          throw new Error('Не вдалося завантажити рецензентів');
        }

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats({
            totalReviewers: statsData.system?.totalReviewers || 0,
            totalManagers: statsData.system?.totalManagers || 0,
            totalScreens: statsData.system?.totalScreens || 0,
            activeReviewers: statsData.system?.activeReviewers || 0,
          });
        } else {
          // Якщо не вдалося завантажити статистику, ставимо базові значення
          setStats({
            totalReviewers: 0,
            totalManagers: 0, 
            totalScreens: 0,
            activeReviewers: 0
          });
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Помилка завантаження');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleStartRating = (reviewerId: string) => {
    router.push(`/rating/${reviewerId}`);
  };

  const handleViewLeaderboard = (type: 'global' | 'reviewer', reviewerId?: string) => {
    if (type === 'global') {
      router.push('/leaderboard/global');
    } else if (reviewerId) {
      router.push(`/leaderboard/reviewer/${reviewerId}`);
    }
  };

  const handleViewConsensus = () => {
    router.push('/consensus');
  };

  const handleReviewerCreated = (newReviewer: Reviewer) => {
    setReviewers(prev => [...prev, newReviewer]);
    setShowReviewerForm(false);
    // Автоматично переходимо до оцінювання з новим рецензентом
    router.push(`/rating/${newReviewer.id}`);
  };

  const handleShowReviewerForm = () => {
    setShowReviewerForm(true);
  };

  const handleCancelReviewerForm = () => {
    setShowReviewerForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Завантаження системи...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Помилка</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Перезавантажити
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Users className="w-10 h-10 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Система оцінки менеджерів
                </h1>
                <p className="text-gray-600 mt-1">
                  Оцінювання керівників на базі Bradley-Terry моделі
                </p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleShowReviewerForm}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Розпочати оцінювання
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Статистика системи */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalReviewers}</p>
                    <p className="text-gray-600 text-sm">Рецензентів</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalManagers}</p>
                    <p className="text-gray-600 text-sm">Менеджерів</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalScreens}</p>
                    <p className="text-gray-600 text-sm">Оцінок</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Activity className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.activeReviewers}</p>
                    <p className="text-gray-600 text-sm">Активних</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Список рецензентів */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Рецензенти
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviewers.map((reviewer) => (
                    <div 
                      key={reviewer.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{reviewer.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={reviewer.active ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {reviewer.active ? "Активний" : "Неактивний"}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              Надійність: {Math.round(reviewer.reliabilityWeight * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewLeaderboard('reviewer', reviewer.id)}
                        >
                          <Trophy className="w-4 h-4 mr-2" />
                          Рейтинги
                        </Button>
                        
                        <Button
                          size="sm"
                          disabled={!reviewer.active}
                          onClick={() => handleStartRating(reviewer.id)}
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Оцінювати
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Кнопка додавання нового рецензента */}
                  {!showReviewerForm ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Button variant="outline" onClick={handleShowReviewerForm}>
                        <Plus className="w-4 h-4 mr-2" />
                        Додати рецензента
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <ReviewerForm
                        onReviewerCreated={handleReviewerCreated}
                        onCancel={handleCancelReviewerForm}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Швидкі дії */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Аналітика
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleViewLeaderboard('global')}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Глобальний рейтинг
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleViewConsensus}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Консенсус рецензентів
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/health')}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Метрики системи
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/admin')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Адмін-панель
                </Button>
              </CardContent>
            </Card>

            {/* Інструкції */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Як користуватися</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>
                  1. Оберіть активного рецензента зі списку
                </p>
                <p>
                  2. Натисніть &quot;Оцінювати&quot; для початку роботи
                </p>
                <p>
                  3. На кожному екрані оберіть 3 найкращих менеджери та 1 найгіршого
                </p>
                <p>
                  4. Система автоматично оновить рейтинги у реальному часі
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Футер */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center text-gray-500">
            <p>Система оцінки менеджерів v1.0</p>
            <p className="text-sm mt-2">
              Використовує математичну модель Bradley-Terry для справедливого ранжування
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
