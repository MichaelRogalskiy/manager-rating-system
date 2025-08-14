import { RatingEntry } from '@/types';

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportPersonalRating(ratings: RatingEntry[], raterName: string) {
  const headers = ['place', 'manager_id', 'full_name', 'position', 'elo'];
  const csvLines = [headers.join(',')];

  ratings.forEach(entry => {
    const fullName = `${entry.manager.lastName} ${entry.manager.firstName} ${entry.manager.patronymic}`;
    const row = [
      entry.place.toString(),
      escapeCsvField(entry.manager.id),
      escapeCsvField(fullName),
      escapeCsvField(entry.manager.position),
      entry.rating.toFixed(1),
    ];
    csvLines.push(row.join(','));
  });

  const csvContent = csvLines.join('\n');
  const filename = `personal-rating-${sanitizeFilename(raterName)}-${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCsv(csvContent, filename);
}

export function exportCompanyRating(ratings: RatingEntry[]) {
  const headers = ['place', 'manager_id', 'full_name', 'position', 'company_score'];
  const csvLines = [headers.join(',')];

  ratings.forEach(entry => {
    const fullName = `${entry.manager.lastName} ${entry.manager.firstName} ${entry.manager.patronymic}`;
    const row = [
      entry.place.toString(),
      escapeCsvField(entry.manager.id),
      escapeCsvField(fullName),
      escapeCsvField(entry.manager.position),
      entry.rating.toFixed(1),
    ];
    csvLines.push(row.join(','));
  });

  const csvContent = csvLines.join('\n');
  const filename = `company-rating-${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCsv(csvContent, filename);
}

export function exportComparisons(
  comparisons: Array<{
    raterId: string;
    raterName: string;
    leftManagerId: string;
    leftManagerName: string;
    rightManagerId: string;
    rightManagerName: string;
    winnerManagerId: string;
    decidedAt: Date;
  }>
) {
  const headers = ['rater_id', 'rater_name', 'left_id', 'left_name', 'right_id', 'right_name', 'winner_id', 'decided_at'];
  const csvLines = [headers.join(',')];

  comparisons.forEach(comparison => {
    const row = [
      escapeCsvField(comparison.raterId),
      escapeCsvField(comparison.raterName),
      escapeCsvField(comparison.leftManagerId),
      escapeCsvField(comparison.leftManagerName),
      escapeCsvField(comparison.rightManagerId),
      escapeCsvField(comparison.rightManagerName),
      escapeCsvField(comparison.winnerManagerId),
      comparison.decidedAt.toISOString(),
    ];
    csvLines.push(row.join(','));
  });

  const csvContent = csvLines.join('\n');
  const filename = `comparisons-raw-${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCsv(csvContent, filename);
}

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9]/gi, '-').toLowerCase();
}