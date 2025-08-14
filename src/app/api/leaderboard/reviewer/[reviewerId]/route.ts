import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reviewerId: string }> }
) {
  try {
    const { reviewerId } = await params;

    // Перевіряємо існування рецензента
    const reviewer = await prisma.reviewer.findUnique({
      where: { id: reviewerId },
    });

    if (!reviewer) {
      return NextResponse.json(
        { error: 'Рецензент не знайдений' },
        { status: 404 }
      );
    }

    // Отримуємо модель рецензента
    const modelData = await prisma.modelReviewer.findUnique({
      where: { reviewerId },
    });

    if (!modelData) {
      return NextResponse.json({
        rankings: [],
        reviewer: {
          id: reviewer.id,
          name: reviewer.name,
          role: reviewer.role,
          reliabilityWeight: reviewer.reliabilityWeight,
          totalScreens: 0
        }
      });
    }

    // Отримуємо інформацію про менеджерів та їх exposure
    const managers = await prisma.manager.findMany();
    const managerMap = new Map(managers.map(m => [m.id, m]));

    // Отримуємо exposure даних для цього рецензента
    const exposureData = await prisma.managerExposure.findMany({
      where: { reviewerId },
    });
    const exposureMap = new Map(exposureData.map(e => [e.managerId, e.count]));

    // Отримуємо кількість завершених екранів (екрани з choices)
    const totalScreens = await prisma.screen.count({
      where: {
        session: {
          reviewerId: reviewerId
        },
        choice: {
          isNot: null
        }
      }
    });

    // Конвертуємо theta в рейтинг
    const theta = modelData.thetaJson as Record<string, number | null>;
    const entries = Object.entries(theta)
      .map(([managerId, score]) => {
        const manager = managerMap.get(managerId);
        if (!manager) return null;

        const exposure = exposureMap.get(managerId) || 0;
        const safeScore = score || 0; // Convert null to 0

        return {
          managerId,
          name: manager.name,
          position: manager.position,
          score: Math.round(safeScore * 100) / 100,
          ciLow: Math.round((safeScore - 0.2) * 100) / 100, // Примітивний CI
          ciHigh: Math.round((safeScore + 0.2) * 100) / 100,
          rank: 0, // Буде встановлено нижче
          exposure: exposure
        };
      })
      .filter(entry => entry !== null)
      .sort((a, b) => b!.score - a!.score);

    // Встановлюємо ранги
    entries.forEach((entry, index) => {
      if (entry) entry.rank = index + 1;
    });

    return NextResponse.json({
      rankings: entries,
      reviewer: {
        id: reviewer.id,
        name: reviewer.name,
        role: reviewer.role,
        reliabilityWeight: reviewer.reliabilityWeight,
        totalScreens: totalScreens
      }
    });

  } catch (error) {
    console.error('Error getting reviewer leaderboard:', error);
    
    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    );
  }
}