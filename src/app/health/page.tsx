'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Activity, 
  Users, 
  Trophy, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Database
} from 'lucide-react';

interface HealthData {
  system: {
    totalReviewers: number;
    totalManagers: number;
    totalSessions: number;
    totalScreens: number;
    activeReviewers: number;
  };
  quality: {
    averageConsensus: number;
    goldenScreensPassRate: number;
    inconsistencyRate: number;
  };
  screens: {
    totalCompleted: number;
    goldenScreens: number;
    todayScreens: number;
  };
  models: {
    convergenceStatus: string;
    lastUpdated: string;
    uncertaintyLevel: number;
  };
}

export default function HealthPage() {
  const router = useRouter();
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHealthData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/health');
        
        if (!response.ok) {
          throw new Error('Не вдалося завантажити дані статистики');
        }

        const data = await response.json();
        setHealthData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Помилка завантаження');
      } finally {
        setLoading(false);
      }
    };

    loadHealthData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            <Button onClick={() => router.push('/')}>
              На головну
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!healthData) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Статистика системи
              </h1>
              <p className="text-gray-600 mt-1">
                Метрики якості та продуктивності системи оцінювання
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Загальні метрики */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{healthData.system.totalReviewers}</p>
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
                  <p className="text-2xl font-bold">{healthData.system.totalManagers}</p>
                  <p className="text-gray-600 text-sm">Менеджерів</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{healthData.system.totalSessions}</p>
                  <p className="text-gray-600 text-sm">Сесій</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{healthData.screens.totalCompleted}</p>
                  <p className="text-gray-600 text-sm">Оцінок</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{healthData.system.activeReviewers}</p>
                  <p className="text-gray-600 text-sm">Активних</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Якість даних */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Якість даних
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Консенсус рецензентів</span>
                  <Badge variant="outline">
                    {Math.round(healthData.quality.averageConsensus * 100)}%
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${healthData.quality.averageConsensus * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Золоті екрани</span>
                  <Badge variant="outline">
                    {Math.round(healthData.quality.goldenScreensPassRate * 100)}%
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${healthData.quality.goldenScreensPassRate * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Неконсистентність</span>
                  <Badge variant="outline">
                    {Math.round(healthData.quality.inconsistencyRate * 100)}%
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${healthData.quality.inconsistencyRate * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Активність системи */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Активність системи
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Оцінок сьогодні</span>
                <Badge variant="default">
                  {healthData.screens.todayScreens}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Золоті екрани</span>
                <Badge variant="secondary">
                  {healthData.screens.goldenScreens}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Стан моделі</span>
                <Badge 
                  variant={healthData.models.convergenceStatus === 'stable' ? 'default' : 'destructive'}
                >
                  {healthData.models.convergenceStatus === 'stable' ? 'Стабільна' : 'Навчається'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Рівень невизначеності</span>
                <Badge variant="outline">
                  {Math.round(healthData.models.uncertaintyLevel * 100)}%
                </Badge>
              </div>

              <div className="text-xs text-gray-500 pt-4 border-t">
                Останнє оновлення: {new Date(healthData.models.lastUpdated).toLocaleString('uk-UA')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Рекомендації */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Рекомендації
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthData.quality.averageConsensus < 0.7 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Низький консенсус між рецензентами
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Розгляньте можливість додаткового навчання рецензентів або уточнення критеріїв оцінювання
                    </p>
                  </div>
                </div>
              )}
              
              {healthData.screens.totalCompleted < 50 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Недостатньо даних для стабільного рейтингу
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Рекомендуємо зібрати щонайменше 50 оцінок для якісного рейтингу
                    </p>
                  </div>
                </div>
              )}
              
              {healthData.screens.totalCompleted >= 50 && healthData.quality.averageConsensus >= 0.7 && (
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Система працює оптимально
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Достатньо даних та високий консенсус забезпечують якісні результати
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}