'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle,
  Loader2 
} from 'lucide-react';

export default function ImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    imported?: number;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
    } else {
      alert('Будь ласка, оберіть CSV файл');
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/managers/import-csv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: `Успішно імпортовано ${data.imported} менеджерів`,
          imported: data.imported
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Помилка імпорту'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Помилка з\'єднання з сервером'
      });
    } finally {
      setImporting(false);
    }
  };

  const handleLoadDefault = async () => {
    setImporting(true);
    setResult(null);

    try {
      const response = await fetch('/api/managers/seed', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: `Успішно завантажено ${data.imported} менеджерів Monobank`,
          imported: data.imported
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Помилка завантаження'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Помилка з\'єднання з сервером'
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/admin')}
              className="border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Імпорт менеджерів</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload CSV */}
          <Card className="bg-white/70 backdrop-blur border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                Завантажити CSV файл
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="csvFile" className="text-base font-medium text-gray-700">
                  Оберіть CSV файл
                </Label>
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="mt-2 h-12 text-lg"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Формат: ФИО;Должность
                </p>
              </div>

              {file && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-800">{file.name}</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    Розмір: {Math.round(file.size / 1024)} KB
                  </p>
                </div>
              )}

              <Button
                onClick={handleImport}
                disabled={!file || importing}
                className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Імпортування...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Імпортувати CSV
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Load Default Data */}
          <Card className="bg-white/70 backdrop-blur border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Завантажити базові дані
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-gray-700 mb-4">
                  Завантажити список з 36 менеджерів Monobank для демонстрації системи
                </p>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• 36 реальних менеджерів Monobank</li>
                    <li>• Різні ролі та департаменти</li>
                    <li>• Готово для оцінювання</li>
                  </ul>
                </div>
              </div>

              <Button
                onClick={handleLoadDefault}
                disabled={importing}
                className="w-full h-12 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Завантаження...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Завантажити Monobank дані
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Result */}
        {result && (
          <Card className={`mt-8 border-0 shadow-xl ${
            result.success 
              ? 'bg-green-50/70 border-green-200' 
              : 'bg-red-50/70 border-red-200'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <p className={`font-semibold ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success ? 'Успіх!' : 'Помилка'}
                  </p>
                  <p className={`text-sm ${
                    result.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {result.message}
                  </p>
                </div>
              </div>
              {result.success && (
                <div className="mt-4">
                  <Button
                    onClick={() => router.push('/')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Перейти до головної
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-8 bg-gray-50/70 backdrop-blur border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800">Інструкції</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold mb-2">Формат CSV файлу:</h4>
                <pre className="bg-white p-3 rounded border text-xs">
ФИО;Должность
Іванов Іван Іванович;Директор
Петрова Марія Петрівна;Менеджер проектів
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Вимоги:</h4>
                <ul className="space-y-1 pl-4">
                  <li>• Файл повинен мати розширення .csv</li>
                  <li>• Використовуйте крапку з комою (;) як роздільник</li>
                  <li>• Перший рядок - заголовки колонок</li>
                  <li>• Кодування UTF-8</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}