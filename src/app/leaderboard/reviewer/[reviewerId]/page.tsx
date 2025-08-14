'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowLeft, TrendingUp, TrendingDown, User, Eye } from 'lucide-react';

interface ManagerRanking {
  managerId: string;
  name: string;
  position: string;
  score: number;
  ciLow: number;
  ciHigh: number;
  rank: number;
  exposure: number;
}

interface ReviewerInfo {
  id: string;
  name: string;
  role: string;
  reliabilityWeight: number;
  totalScreens: number;
}

export default function ReviewerLeaderboardPage() {
  const router = useRouter();
  const params = useParams();
  const reviewerId = Array.isArray(params.reviewerId) ? params.reviewerId[0] : params.reviewerId;
  
  const [rankings, setRankings] = useState<ManagerRanking[]>([]);
  const [reviewerInfo, setReviewerInfo] = useState<ReviewerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Завантажуємо рейтинг рецензента
        const response = await fetch(`/api/leaderboard/reviewer/${reviewerId}`);
        
        if (!response.ok) {
          throw new Error('Не вдалося завантажити рейтинг рецензента');
        }

        const data = await response.json();
        setRankings(data.rankings || []);
        setReviewerInfo(data.reviewer);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Помилка завантаження');
      } finally {
        setLoading(false);
      }
    };

    if (reviewerId) {
      loadData();
    }
  }, [reviewerId]);

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
            
            <User className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Рейтинг рецензента
              </h1>
              <div className="flex items-center gap-4 mt-2">
                {reviewerInfo && (
                  <>
                    <p className="text-lg text-gray-700 font-medium">
                      {reviewerInfo.name}
                    </p>
                    <Badge variant="outline">
                      {reviewerInfo.role}
                    </Badge>
                    <Badge variant="secondary">
                      Оцінок: {reviewerInfo.totalScreens}
                    </Badge>
                    <Badge 
                      variant={reviewerInfo.reliabilityWeight >= 0.8 ? "default" : "secondary"}
                    >
                      Надійність: {Math.round(reviewerInfo.reliabilityWeight * 100)}%
                    </Badge>
                  </>
                )}
              </div>
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
                Поки що немає рейтингу
              </h3>
              <p className="text-gray-600">
                Цей рецензент ще не зробив достатньо оцінок для формування рейтингу
              </p>
              <Button 
                className="mt-4"
                onClick={() => router.push(`/rating/${reviewerId}`)}
              >
                Почати оцінювання
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Особистий рейтинг менеджерів
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/leaderboard/global')}
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Глобальний рейтинг
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/rating/${reviewerId}`)}
                  >
                    Продовжити оцінювання
                  </Button>
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-1">
                Рейтинг базується на ваших особистих оцінках
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Персональний рейтинг ({rankings.length} менеджерів)
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
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{manager.exposure}</span>
                          </div>
                          
                          <Badge variant="outline">
                            {manager.score > 0 ? (
                              <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1 text-red-600" />
                            )}
                            {manager.score.toFixed(2)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          95% CI: [{manager.ciLow.toFixed(2)}, {manager.ciHigh.toFixed(2)}]
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Пояснення:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>Оцінка:</strong> Відносна сила менеджера за Bradley-Terry моделлю</li>
                    <li><strong>Exposure:</strong> Кількість разів, коли менеджер був показаний для оцінки</li>
                    <li><strong>95% CI:</strong> Інтервал довіри - діапазон можливих значень оцінки</li>
                    <li><strong>Надійність:</strong> Ваша персональна надійність як рецензента</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}