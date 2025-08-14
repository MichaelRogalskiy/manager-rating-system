'use client';

import { useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '@/components/ui';
import { locale } from '@/lib/locales';
import { RatingEntry, ImportResult } from '@/types';

interface AdminDashboardProps {
  companyRanking: RatingEntry[];
  statistics: {
    totalRaters: number;
    totalComparisons: number;
    averageComparisons: number;
  };
  onImportCsv: (file: File) => Promise<ImportResult>;
  onExportCompanyCsv: () => void;
  onRecompute: () => Promise<void>;
  onRefresh: () => void;
}

export function AdminDashboard({
  companyRanking,
  statistics,
  onImportCsv,
  onExportCompanyCsv,
  onRecompute,
  onRefresh,
}: AdminDashboardProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const result = await onImportCsv(file);
      setImportResult(result);
      
      // Auto-refresh after successful import
      setTimeout(() => {
        onRefresh();
      }, 1000);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Помилка імпорту');
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleRecompute = async () => {
    setIsRecomputing(true);
    try {
      await onRecompute();
      // Auto-refresh after recompute
      setTimeout(() => {
        onRefresh();
      }, 1000);
    } catch (error) {
      console.error('Recompute error:', error);
    } finally {
      setIsRecomputing(false);
    }
  };

  const formatFullName = (manager: RatingEntry['manager']) => {
    return `${manager.lastName} ${manager.firstName} ${manager.patronymic}`;
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 mb-2">
                {locale.adminDashboard}
              </h1>
              <p className="text-secondary-600">
                Керування системою оцінювання менеджерів
              </p>
            </div>
            <Button 
              onClick={onRefresh}
              variant="outline"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Оновити
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {statistics.totalRaters}
                </div>
                <div className="text-secondary-600">
                  {locale.totalRaters}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-success-600 mb-2">
                  {statistics.totalComparisons}
                </div>
                <div className="text-secondary-600">
                  {locale.completedComparisons}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-warning-600 mb-2">
                  {statistics.averageComparisons.toFixed(1)}
                </div>
                <div className="text-secondary-600">
                  Середньо на рецензента
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Management Panel */}
          <div className="space-y-6">
            
            {/* CSV Import */}
            <Card>
              <CardHeader>
                <CardTitle>{locale.importCsv}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-secondary-600">
                  <p className="mb-2">{locale.csvFormatHint}</p>
                  <p>{locale.alternativeFormat}</p>
                </div>
                
                <div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={isImporting}
                    className="block w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                </div>
                
                {isImporting && (
                  <div className="text-sm text-primary-600">
                    Імпортування...
                  </div>
                )}
                
                {importResult && (
                  <div className="text-sm space-y-1">
                    <div className="text-success-600">
                      ✓ Імпортовано: {importResult.imported}
                    </div>
                    <div className="text-warning-600">
                      ↻ Оновлено: {importResult.updated}
                    </div>
                    {importResult.skipped > 0 && (
                      <div className="text-danger-600">
                        ✗ Пропущено: {importResult.skipped}
                      </div>
                    )}
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="text-danger-600 text-xs">
                        {importResult.errors.slice(0, 3).map((error, i) => (
                          <div key={i}>• {error}</div>
                        ))}
                        {importResult.errors.length > 3 && (
                          <div>... та ще {importResult.errors.length - 3} помилок</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {importError && (
                  <div className="text-sm text-danger-600">
                    ✗ {importError}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Дії</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={onExportCompanyCsv}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {locale.exportCompanyCsv}
                </Button>
                
                <Button
                  onClick={handleRecompute}
                  variant="primary"
                  size="sm"
                  className="w-full justify-start"
                  isLoading={isRecomputing}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {locale.recompute}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Company Ranking */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{locale.companyRanking}</span>
                  <span className="text-sm font-normal text-secondary-500">
                    {companyRanking.length} менеджерів
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-secondary-200">
                        <th className="text-left py-3 px-2 font-semibold text-secondary-900 text-sm">
                          {locale.place}
                        </th>
                        <th className="text-left py-3 px-2 font-semibold text-secondary-900 text-sm">
                          {locale.fullName}
                        </th>
                        <th className="text-left py-3 px-2 font-semibold text-secondary-900 text-sm">
                          {locale.position}
                        </th>
                        <th className="text-right py-3 px-2 font-semibold text-secondary-900 text-sm">
                          {locale.rating}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyRanking.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-secondary-500">
                            Немає даних для відображення
                          </td>
                        </tr>
                      ) : (
                        companyRanking.map((entry, index) => (
                          <tr 
                            key={entry.manager.id}
                            className={`
                              border-b border-secondary-100 hover:bg-secondary-50 transition-colors text-sm
                              ${index < 3 ? 'bg-gradient-to-r from-warning-50 to-transparent' : ''}
                            `}
                          >
                            <td className="py-3 px-2">
                              <span className={`
                                inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                                ${index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                                  index === 1 ? 'bg-gray-100 text-gray-800' :
                                  index === 2 ? 'bg-orange-100 text-orange-800' :
                                  'bg-secondary-100 text-secondary-700'}
                              `}>
                                {entry.place}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <div className="font-medium text-secondary-900">
                                {formatFullName(entry.manager)}
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <div className="text-secondary-600">
                                {entry.manager.position}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <div className="font-mono font-semibold text-secondary-900">
                                {entry.rating.toFixed(1)}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}