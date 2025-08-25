'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Users, TrendingUp } from 'lucide-react';

interface ConsensusData {
  reviewerAgreement: number;
  totalReviewers: number;
  averageKendallTau: number;
  highAgreementPairs: Array<{
    reviewer1: string;
    reviewer2: string;
    agreement: number;
  }>;
}

export default function ConsensusPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consensusData, setConsensusData] = useState<ConsensusData | null>(null);

  useEffect(() => {
    const loadConsensusData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/consensus');
        
        if (response.ok) {
          const data = await response.json();
          setConsensusData(data);
        } else {
          throw new Error('Не вдалося завантажити дані консенсусу');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Помилка завантаження');
      } finally {
        setLoading(false);
      }
    };

    loadConsensusData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Завантаження даних консенсусу...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Помилка</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()}>
                Перезавантажити
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                На головну
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/')}
                className="border-gray-300 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Консенсус рецензентів</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {consensusData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/70 backdrop-blur border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-800">
                      {Math.round(consensusData.reviewerAgreement * 100)}%
                    </p>
                    <p className="text-gray-600 text-sm font-medium">Рівень згоди</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-800">{consensusData.totalReviewers}</p>
                    <p className="text-gray-600 text-sm font-medium">Рецензентів</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-800">
                      {Math.round(consensusData.averageKendallTau * 100)}%
                    </p>
                    <p className="text-gray-600 text-sm font-medium">Kendall Tau</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="bg-white/70 backdrop-blur border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Аналіз консенсусу</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Консенсус-аналіз</h3>
              <p className="text-gray-600 mb-4">
                Аналіз рівня згоди між рецензентами у системі оцінювання менеджерів
              </p>
              <p className="text-sm text-gray-500">
                Дані оновлюються автоматично після кожної нової оцінки
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}