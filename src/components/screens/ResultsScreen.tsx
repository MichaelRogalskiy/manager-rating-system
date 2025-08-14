'use client';

import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { locale } from '@/lib/locales';
import { RatingEntry } from '@/types';

interface ResultsScreenProps {
  ranking: RatingEntry[];
  raterName: string;
  onExportCsv: () => void;
  onRestart: () => void;
}

export function ResultsScreen({ 
  ranking, 
  raterName, 
  onExportCsv, 
  onRestart 
}: ResultsScreenProps) {
  const formatFullName = (manager: RatingEntry['manager']) => {
    return `${manager.lastName} ${manager.firstName} ${manager.patronymic}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-success-50 to-primary-50">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">
            {locale.completion.allDone}
          </h1>
          <p className="text-secondary-600 text-lg mb-4">
            {locale.completion.thankyou}
          </p>
          <p className="text-secondary-500">
            Рецензент: <strong>{raterName}</strong>
          </p>
        </div>

        {/* Results Table */}
        <Card className="shadow-xl border-0 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {locale.yourRanking}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="text-left py-3 px-4 font-semibold text-secondary-900">
                      {locale.place}
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-secondary-900">
                      {locale.fullName}
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-secondary-900">
                      {locale.position}
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-secondary-900">
                      {locale.rating}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((entry, index) => (
                    <tr 
                      key={entry.manager.id}
                      className={`
                        border-b border-secondary-100 hover:bg-secondary-50 transition-colors
                        ${index < 3 ? 'bg-gradient-to-r from-warning-50 to-transparent' : ''}
                      `}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <span className={`
                            inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                            ${index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                              index === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-secondary-100 text-secondary-700'}
                          `}>
                            {entry.place}
                          </span>
                          {index < 3 && (
                            <span className="ml-2 text-lg">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-secondary-900">
                          {formatFullName(entry.manager)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-secondary-600">
                          {entry.manager.position}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="font-mono font-semibold text-secondary-900">
                          {entry.rating.toFixed(1)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={onExportCsv}
            variant="outline"
            size="lg"
            className="min-w-48"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {locale.exportCsv}
          </Button>
          
          <Button
            onClick={onRestart}
            variant="secondary"
            size="lg"
            className="min-w-48"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {locale.restart}
          </Button>
        </div>

        {/* Statistics */}
        <Card className="mt-8 bg-secondary-50 border-secondary-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-secondary-900">
                  {ranking.length}
                </div>
                <div className="text-sm text-secondary-600">
                  Всього менеджерів
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary-600">
                  {ranking.find(r => r.place === 1)?.rating.toFixed(1) || 'N/A'}
                </div>
                <div className="text-sm text-secondary-600">
                  Найвищий рейтинг
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary-600">
                  {ranking.find(r => r.place === ranking.length)?.rating.toFixed(1) || 'N/A'}
                </div>
                <div className="text-sm text-secondary-600">
                  Найнижчий рейтинг
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}