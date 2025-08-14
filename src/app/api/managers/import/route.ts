import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    // Читаємо CSV файл з менеджерами
    const csvPath = join(process.cwd(), 'List of managers.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    
    // Парсимо CSV (з українськими колонками та розділювачем ;)
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: ';',
      relax_column_count: true, // Дозволяємо непостійну кількість колонок
      quote: '"',
      escape: '"'
    });

    // Перевіряємо структуру
    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: 'CSV файл порожній або неправильний формат' },
        { status: 400 }
      );
    }

    // Імпортуємо менеджерів в базу даних
    const importedManagers = [];
    
    for (const record of records) {
      // Українські колонки з оригінального файлу
      const name = record['ФИО'] || record.name || record.Name || record['ПІБ'];
      const position = record['Должность'] || record.position || record.Position || record['Посада'];
      
      if (!name) {
        console.warn('Пропущений запис без імені:', record);
        continue;
      }

      try {
        const manager = await prisma.manager.upsert({
          where: { 
            name: name.trim() 
          },
          update: {
            position: position?.trim() || 'Не вказано',
          },
          create: {
            name: name.trim(),
            position: position?.trim() || 'Не вказано',
          },
        });
        
        importedManagers.push(manager);
      } catch (error) {
        console.error('Помилка створення менеджера:', name, error);
      }
    }

    return NextResponse.json({
      success: true,
      imported: importedManagers.length,
      managers: importedManagers,
    });

  } catch (error) {
    console.error('Error importing managers:', error);
    
    return NextResponse.json(
      { 
        error: 'Помилка імпорту менеджерів',
        details: error instanceof Error ? error.message : 'Невідома помилка'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Повертаємо список всіх менеджерів
    const managers = await prisma.manager.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      total: managers.length,
      managers,
    });

  } catch (error) {
    console.error('Error getting managers:', error);
    
    return NextResponse.json(
      { error: 'Помилка отримання списку менеджерів' },
      { status: 500 }
    );
  }
}