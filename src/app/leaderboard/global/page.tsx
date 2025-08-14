'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ManagerRanking {
  managerId: string;
  name: string;
  position: string;
  score: number;
  ciLow: number;
  ciHigh: number;
  rank: number;
}

export default function GlobalLeaderboardPage() {
  const router = useRouter();
  const [rankings, setRankings] = useState<ManagerRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRankings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/leaderboard/global');
        
        if (!response.ok) {
          throw new Error('Не вдалося завантажити глобальний рейтинг');
        }

        const data = await response.json();
        setRankings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Помилка завантаження');
      } finally {
        setLoading(false);
      }
    };

    loadRankings();
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            
            <Trophy className="w-8 h-8 text-yellow-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Глобальний рейтинг менеджерів
              </h1>
              <p className="text-gray-600 mt-1">
                Агрегований рейтинг за всіма рецензентами
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {rankings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Поки що немає рейтингів
              </h3>
              <p className="text-gray-600">
                Почніть оцінювати менеджерів, щоб побачити глобальний рейтинг
              </p>
              <Button 
                className="mt-4"
                onClick={() => router.push('/')}
              >
                Почати оцінювання
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Рейтинг менеджерів
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rankings.map((manager, index) => (
                  <div
                    key={manager.managerId}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                        {index < 3 ? (
                          <Trophy 
                            className={`w-4 h-4 ${
                              index === 0 ? 'text-yellow-600' :
                              index === 1 ? 'text-gray-600' :
                              'text-amber-600'
                            }`} 
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {manager.rank}
                          </span>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900">{manager.name}</h3>
                        <p className="text-sm text-gray-600">{manager.position}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {manager.score > 0 ? (
                            <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1 text-red-600" />
                          )}
                          {manager.score}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        95% CI: [{manager.ciLow}, {manager.ciHigh}]
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}