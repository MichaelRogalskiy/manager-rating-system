import { z } from 'zod';
import { CSVRow, Manager, ImportResult } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Validation schema for manager data
const managerSchema = z.object({
  id: z.string().min(1, 'ID не може бути порожнім'),
  lastName: z.string().min(1, 'Прізвище не може бути порожнім'),
  firstName: z.string().min(1, "Ім'я не може бути порожнім"),
  patronymic: z.string().min(1, 'По батькові не може бути порожнім'),
  position: z.string().min(1, 'Посада не може бути порожньою'),
});

export class CSVParser {
  // Parse CSV text into rows
  parseCSV(csvText: string): CSVRow[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV файл повинен містити заголовки та принаймні один рядок даних');
    }

    const headers = this.parseCSVLine(lines[0]);
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === 0) continue; // Skip empty lines

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return rows;
  }

  // Parse single CSV line handling quotes and commas
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Add the last field
    result.push(current.trim());
    return result;
  }

  // Detect header format and map to standard format
  mapHeaders(row: CSVRow): {
    id: string;
    lastName: string;
    firstName: string;
    patronymic: string;
    position: string;
  } {
    // Try English headers first
    if (row.id && row.last_name && row.first_name) {
      return {
        id: row.id,
        lastName: row.last_name,
        firstName: row.first_name,
        patronymic: row.patronymic || '',
        position: row.position || '',
      };
    }

    // Try Ukrainian headers
    if (row.ID && row['Прізвище'] && row["Ім'я"]) {
      return {
        id: row.ID,
        lastName: row['Прізвище'],
        firstName: row["Ім'я"],
        patronymic: row['По батькові'] || '',
        position: row['Посада'] || '',
      };
    }

    // Try alternative ID field
    if (row.ID && row.last_name && row.first_name) {
      return {
        id: row.ID,
        lastName: row.last_name,
        firstName: row.first_name,
        patronymic: row.patronymic || '',
        position: row.position || '',
      };
    }

    throw new Error(
      'Невірний формат заголовків. Очікуються: id,last_name,first_name,patronymic,position або ID,Прізвище,Ім\'я,По батькові,Посада'
    );
  }

  // Validate and convert CSV row to Manager
  validateRow(row: CSVRow, index: number): { valid: boolean; manager?: Manager; errors: string[] } {
    const errors: string[] = [];

    try {
      const mapped = this.mapHeaders(row);
      
      // Validate with schema
      const result = managerSchema.safeParse(mapped);
      
      if (!result.success) {
        result.error.issues.forEach(issue => {
          errors.push(`Рядок ${index + 1}: ${issue.message} (поле: ${issue.path.join('.')})`);
        });
        return { valid: false, errors };
      }

      // Additional ID validation (UUID or numeric)
      const id = mapped.id;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      const isNumeric = /^\d+$/.test(id);
      
      if (!isUUID && !isNumeric) {
        errors.push(`Рядок ${index + 1}: ID повинен бути UUID або числом`);
      }

      if (errors.length > 0) {
        return { valid: false, errors };
      }

      const manager: Manager = {
        id: mapped.id,
        lastName: mapped.lastName,
        firstName: mapped.firstName,
        patronymic: mapped.patronymic,
        position: mapped.position,
        createdAt: new Date(),
      };

      return { valid: true, manager, errors: [] };

    } catch (error) {
      errors.push(`Рядок ${index + 1}: ${error instanceof Error ? error.message : 'Невідома помилка'}`);
      return { valid: false, errors };
    }
  }

  // Process entire CSV and return validation results
  processCSV(csvText: string): {
    validManagers: Manager[];
    errors: string[];
    duplicateIds: string[];
  } {
    const validManagers: Manager[] = [];
    const errors: string[] = [];
    const seenIds = new Set<string>();
    const duplicateIds: string[] = [];

    try {
      const rows = this.parseCSV(csvText);
      
      rows.forEach((row, index) => {
        const validation = this.validateRow(row, index);
        
        if (validation.valid && validation.manager) {
          // Check for duplicate IDs
          if (seenIds.has(validation.manager.id)) {
            duplicateIds.push(validation.manager.id);
            errors.push(`Рядок ${index + 1}: Дублікат ID "${validation.manager.id}"`);
          } else {
            seenIds.add(validation.manager.id);
            validManagers.push(validation.manager);
          }
        } else {
          errors.push(...validation.errors);
        }
      });

    } catch (error) {
      errors.push(`Помилка обробки CSV: ${error instanceof Error ? error.message : 'Невідома помилка'}`);
    }

    return {
      validManagers,
      errors,
      duplicateIds,
    };
  }

  // Generate CSV export string
  exportToCsv(managers: Manager[]): string {
    const headers = ['id', 'last_name', 'first_name', 'patronymic', 'position'];
    const csvLines = [headers.join(',')];

    managers.forEach(manager => {
      const row = [
        this.escapeCsvField(manager.id),
        this.escapeCsvField(manager.lastName),
        this.escapeCsvField(manager.firstName),
        this.escapeCsvField(manager.patronymic),
        this.escapeCsvField(manager.position),
      ];
      csvLines.push(row.join(','));
    });

    return csvLines.join('\n');
  }

  // Escape CSV field if it contains commas or quotes
  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  // Generate rating export CSV
  exportRatingToCsv(
    ratings: Array<{
      place: number;
      manager: Manager;
      rating: number;
    }>,
    type: 'personal' | 'company'
  ): string {
    const headers = ['place', 'manager_id', 'full_name', 'position', type === 'personal' ? 'elo' : 'company_score'];
    const csvLines = [headers.join(',')];

    ratings.forEach(entry => {
      const fullName = `${entry.manager.lastName} ${entry.manager.firstName} ${entry.manager.patronymic}`;
      const row = [
        entry.place.toString(),
        this.escapeCsvField(entry.manager.id),
        this.escapeCsvField(fullName),
        this.escapeCsvField(entry.manager.position),
        entry.rating.toFixed(1),
      ];
      csvLines.push(row.join(','));
    });

    return csvLines.join('\n');
  }
}