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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Заголовок */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                <Users className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                  Система оцінки менеджерів
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  Інтелектуальне оцінювання керівників на базі Bradley-Terry моделі
                </p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleShowReviewerForm}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 px-8 py-3 text-lg"
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <Card className="bg-white/70 backdrop-blur border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalReviewers}</p>
                    <p className="text-gray-600 text-sm font-medium">Рецензентів</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/70 backdrop-blur border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalManagers}</p>
                    <p className="text-gray-600 text-sm font-medium">Менеджерів</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/70 backdrop-blur border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl shadow-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalScreens}</p>
                    <p className="text-gray-600 text-sm font-medium">Оцінок</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/70 backdrop-blur border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-800">{stats.activeReviewers}</p>
                    <p className="text-gray-600 text-sm font-medium">Активних</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Список рецензентів */}
          <div className="lg:col-span-2">
            <Card className="bg-white/70 backdrop-blur border-0 shadow-xl">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  Рецензенти
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviewers.map((reviewer) => (
                    <div 
                      key={reviewer.id} 
                      className="flex items-center justify-between p-6 bg-white/60 backdrop-blur border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-semibold text-lg">
                            {reviewer.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-lg text-gray-800">{reviewer.name}</span>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge 
                              variant={reviewer.active ? "default" : "secondary"}
                              className={`text-xs font-medium px-3 py-1 ${
                                reviewer.active 
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {reviewer.active ? "Активний" : "Неактивний"}
                            </Badge>
                            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                              Надійність: {Math.round(reviewer.reliabilityWeight * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewLeaderboard('reviewer', reviewer.id)}
                          className="border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                        >
                          <Trophy className="w-4 h-4 mr-2" />
                          Рейтинги
                        </Button>
                        
                        <Button
                          size="sm"
                          disabled={!reviewer.active}
                          onClick={() => handleStartRating(reviewer.id)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Оцінювати
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Кнопка додавання нового рецензента */}
                  {!showReviewerForm ? (
                    <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-8 text-center bg-gradient-to-r from-blue-50/50 to-indigo-50/50 hover:from-blue-100/50 hover:to-indigo-100/50 transition-all duration-300">
                      <Button 
                        variant="outline" 
                        onClick={handleShowReviewerForm}
                        className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 px-6 py-3 text-base font-medium"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Додати рецензента
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4 p-6 bg-white/60 backdrop-blur rounded-2xl shadow-lg">
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
            <Card className="bg-white/70 backdrop-blur border-0 shadow-xl">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  Аналітика
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start py-4 border-0 bg-white/60 hover:bg-white/80 shadow-md hover:shadow-lg transition-all duration-200 text-gray-700 hover:text-gray-900"
                  onClick={() => handleViewLeaderboard('global')}
                >
                  <Trophy className="w-5 h-5 mr-3 text-yellow-600" />
                  Глобальний рейтинг
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start py-4 border-0 bg-white/60 hover:bg-white/80 shadow-md hover:shadow-lg transition-all duration-200 text-gray-700 hover:text-gray-900"
                  onClick={handleViewConsensus}
                >
                  <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                  Консенсус рецензентів
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start py-4 border-0 bg-white/60 hover:bg-white/80 shadow-md hover:shadow-lg transition-all duration-200 text-gray-700 hover:text-gray-900"
                  onClick={() => router.push('/health')}
                >
                  <Activity className="w-5 h-5 mr-3 text-blue-600" />
                  Метрики системи
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start py-4 border-0 bg-white/60 hover:bg-white/80 shadow-md hover:shadow-lg transition-all duration-200 text-gray-700 hover:text-gray-900"
                  onClick={() => router.push('/admin')}
                >
                  <BarChart3 className="w-5 h-5 mr-3 text-indigo-600" />
                  Адмін-панель
                </Button>
              </CardContent>
            </Card>

            {/* Інструкції */}
            <Card className="mt-6 bg-gradient-to-br from-indigo-50/70 to-purple-50/70 backdrop-blur border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  Як користуватися
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-700 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-semibold text-xs">1</span>
                  </div>
                  <p>Оберіть активного рецензента зі списку</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 font-semibold text-xs">2</span>
                  </div>
                  <p>Натисніть "Оцінювати" для початку роботи</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 font-semibold text-xs">3</span>
                  </div>
                  <p>На кожному екрані оберіть 3 найкращих менеджери та 1 найгіршого</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-orange-600 font-semibold text-xs">4</span>
                  </div>
                  <p>Система автоматично оновить рейтинги у реальному часі</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Футер */}
      <footer className="bg-white/80 backdrop-blur border-t border-gray-200/50 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                Система оцінки менеджерів
              </h3>
            </div>
            <p className="text-gray-600 text-lg mb-2">v1.0</p>
            <p className="text-gray-500 text-sm max-w-2xl mx-auto">
              Використовує передову математичну модель Bradley-Terry для об'єктивного та справедливого ранжування менеджерів на основі попарних порівнянь
            </p>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-400">
                Розроблено з ❤️ для покращення управлінської ефективності
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
