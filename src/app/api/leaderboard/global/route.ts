import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Отримуємо глобальну модель
    const globalModel = await prisma.modelGlobal.findUnique({
      where: { id: 'global' },
    });

    if (!globalModel) {
      // Якщо глобальної моделі ще немає, повертаємо порожній список
      return NextResponse.json([]);
    }

    // Отримуємо інформацію про менеджерів
    const managers = await prisma.manager.findMany();
    const managerMap = new Map(managers.map(m => [m.id, m]));

    // Конвертуємо дані в рейтинг
    const mu = globalModel.muJson as Record<string, number>;
    const ciLow = globalModel.ciLowJson as Record<string, number>;
    const ciHigh = globalModel.ciHighJson as Record<string, number>;

    const entries = Object.entries(mu)
      .map(([managerId, score]) => {
        const manager = managerMap.get(managerId);
        if (!manager) return null;

        return {
          managerId,
          name: manager.name,
          position: manager.position,
          score: Math.round(score * 100) / 100,
          ciLow: Math.round((ciLow[managerId] || score - 0.2) * 100) / 100,
          ciHigh: Math.round((ciHigh[managerId] || score + 0.2) * 100) / 100,
          rank: 0,
        };
      })
      .filter(entry => entry !== null)
      .sort((a, b) => b!.score - a!.score);

    // Встановлюємо ранги
    entries.forEach((entry, index) => {
      if (entry) entry.rank = index + 1;
    });

    return NextResponse.json(entries);

  } catch (error) {
    console.error('Error getting global leaderboard:', error);
    
    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    );
  }
}