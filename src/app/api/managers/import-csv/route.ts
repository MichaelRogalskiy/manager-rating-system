import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';

interface ManagerData {
  name: string;
  position: string;
}

export async function POST(request: NextRequest) {
  try {
    // Читаємо CSV файл
    const csvPath = path.join(process.cwd(), 'List of managers.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Парсимо CSV (простий парсер для формату ФИО;Должность)
    const lines = csvContent.trim().split('\n');
    const managers: ManagerData[] = [];
    
    // Пропускаємо заголовок (перший рядок)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const [name, position] = line.split(';').map(s => s.trim());
        if (name && position) {
          managers.push({ name, position });
        }
      }
    }

    console.log(`Знайдено ${managers.length} менеджерів для імпорту`);

    // Очищаємо пов'язані дані перед видаленням менеджерів
    await prisma.pair.deleteMany({});
    await prisma.choice.deleteMany({});
    await prisma.screenManager.deleteMany({});
    await prisma.screen.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.managerExposure.deleteMany({});
    await prisma.modelReviewer.deleteMany({});
    await prisma.modelGlobal.deleteMany({});
    await prisma.statsReviewer.deleteMany({});
    console.log('Видалено всі пов\'язані дані');
    
    // Тепер можна безпечно видалити менеджерів
    await prisma.manager.deleteMany({});
    console.log('Видалено всіх існуючих менеджерів');

    // Імпортуємо нових менеджерів
    const importedManagers = await prisma.manager.createMany({
      data: managers,
      skipDuplicates: true,
    });

    console.log(`Імпортовано ${importedManagers.count} менеджерів`);

    return NextResponse.json({
      success: true,
      imported: importedManagers.count,
      total: managers.length,
      managers: managers.slice(0, 5), // Показуємо перших 5 для підтвердження
    });

  } catch (error) {
    console.error('Error importing CSV:', error);
    
    return NextResponse.json(
      { 
        error: 'Помилка імпорту CSV файлу',
        details: error instanceof Error ? error.message : 'Невідома помилка'
      },
      { status: 500 }
    );
  }
}