'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  BarChart3, 
  RefreshCw, 
  Trash2, 
  Download,
  Upload,
  Settings,
  Database,
  Users,
  Activity
} from 'lucide-react';

interface AdminStats {
  totalReviewers: number;
  totalManagers: number;
  totalScreens: number;
  totalSessions: number;
  dbSize: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/health');
      
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalReviewers: data.system?.totalReviewers || 0,
          totalManagers: data.system?.totalManagers || 0,
          totalScreens: data.system?.totalScreens || 0,
          totalSessions: data.system?.totalSessions || 0,
          dbSize: 0
        });
      } else {
        throw new Error('Не вдалося завантажити дані');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateModel = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/model/recalculate', { method: 'POST' });
      if (response.ok) {
        alert('Модель успішно перерахована');
      } else {
        throw new Error('Помилка перерахунку моделі');
      }
    } catch (err) {
      alert('Помилка: ' + (err instanceof Error ? err.message : 'Невідома помилка'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCleanupReviewers = async () => {
    if (!confirm('Ви впевнені, що хочете видалити неактивних рецензентів?')) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/reviewers/cleanup', { method: 'POST' });
      if (response.ok) {
        alert('Очищення виконано');
        loadAdminData();
      } else {
        throw new Error('Помилка очищення');
      }
    } catch (err) {
      alert('Помилка: ' + (err instanceof Error ? err.message : 'Невідома помилка'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Завантаження адмін-панелі...</p>
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
                <div className="p-2 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Адмін-панель</h1>
              </div>
            </div>
            <Badge variant="destructive" className="px-3 py-1">
              Адміністратор
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Статистика */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/70 backdrop-blur border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalReviewers}</p>
                    <p className="text-gray-600 text-sm font-medium">Рецензентів</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalManagers}</p>
                    <p className="text-gray-600 text-sm font-medium">Менеджерів</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalScreens}</p>
                    <p className="text-gray-600 text-sm font-medium">Оцінок</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalSessions}</p>
                    <p className="text-gray-600 text-sm font-medium">Сесій</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* System Management */}
          <Card className="bg-white/70 backdrop-blur border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Database className="w-6 h-6 text-blue-600" />
                Управління системою
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleRecalculateModel}
                disabled={isProcessing}
                className="w-full justify-start py-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className={`w-5 h-5 mr-3 ${isProcessing ? 'animate-spin' : ''}`} />
                Перерахувати модель
              </Button>

              <Button 
                onClick={loadAdminData}
                variant="outline"
                className="w-full justify-start py-4"
              >
                <RefreshCw className="w-5 h-5 mr-3" />
                Оновити статистику
              </Button>

              <Button 
                onClick={handleCleanupReviewers}
                disabled={isProcessing}
                variant="outline"
                className="w-full justify-start py-4 border-red-200 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-5 h-5 mr-3" />
                Очистити неактивних рецензентів
              </Button>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="bg-white/70 backdrop-blur border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Upload className="w-6 h-6 text-green-600" />
                Управління даними
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline"
                className="w-full justify-start py-4"
                onClick={() => router.push('/import')}
              >
                <Upload className="w-5 h-5 mr-3" />
                Імпорт менеджерів (CSV)
              </Button>

              <Button 
                variant="outline"
                className="w-full justify-start py-4"
                disabled
              >
                <Download className="w-5 h-5 mr-3" />
                Експорт даних
              </Button>

              <Button 
                variant="outline"
                className="w-full justify-start py-4"
                disabled
              >
                <Database className="w-5 h-5 mr-3" />
                Резервне копіювання
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Warning */}
        <Card className="mt-8 bg-red-50/70 backdrop-blur border-red-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Попередження
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 text-sm">
              Адмін-панель надає доступ до критичних функцій системи. 
              Використовуйте обережно та завжди створюйте резервні копії перед виконанням операцій.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}