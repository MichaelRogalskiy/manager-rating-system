import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { AdaptiveSelector } from '@/lib/selection/adaptive-selector';
import { BradleyTerryModel } from '@/lib/bradley-terry/model';
import { DEFAULT_CONFIG } from '@/types';

const nextScreenSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Валідація sessionId як UUID
    const validation = nextScreenSchema.safeParse({ sessionId });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Невірний формат sessionId' },
        { status: 400 }
      );
    }

    // Отримуємо сесію та рецензента
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { reviewer: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Сесія не знайдена' },
        { status: 404 }
      );
    }

    if (session.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Сесія неактивна' },
        { status: 400 }
      );
    }

    // Отримуємо всіх менеджерів
    const managers = await prisma.manager.findMany({
      select: { id: true, name: true, position: true },
    });

    if (managers.length < 7) {
      return NextResponse.json(
        { error: 'Недостатньо менеджерів для оцінювання' },
        { status: 400 }
      );
    }

    // Отримуємо поточну модель рецензента
    const modelData = await prisma.modelReviewer.findUnique({
      where: { reviewerId: session.reviewerId },
    });

    // Отримуємо статистику експозиції
    const exposures = await prisma.managerExposure.findMany({
      where: { reviewerId: session.reviewerId },
    });

    const exposureMap = new Map(
      exposures.map(e => [e.managerId, { count: e.count, uncertainty: e.uncertainty }])
    );

    // Отримуємо нещодавні комбінації (останні 10 екранів)
    const recentScreens = await prisma.screen.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const recentCombinations = new Set(
      recentScreens.map(screen => 
        [...screen.shownManagerIds].sort().join('-')
      )
    );

    // Підготовка даних для селектора
    const managerStats = managers.map(manager => {
      const exposure = exposureMap.get(manager.id) || { count: 0, uncertainty: 1.0 };
      const theta = modelData ? ((modelData.thetaJson as Record<string, number>)[manager.id] || 0) : 0;
      
      // Визначення бакету на основі theta
      const bucket: 'TOP' | 'MID' | 'LOW' = 'MID';
      // Це буде визначено в селекторі на основі всіх theta

      return {
        id: manager.id,
        name: manager.name,
        position: manager.position,
        bucket,
        uncertainty: exposure.uncertainty,
        exposureCount: exposure.count,
        theta,
      };
    });

    // Використовуємо адаптивний селектор
    const selector = new AdaptiveSelector(DEFAULT_CONFIG);
    const selectedManagers = selector.select7Managers(
      session.reviewerId,
      managerStats,
      recentCombinations,
      new Set() // TODO: отримувати unknown managers з бази
    );

    // Створюємо новий екран
    const screen = await prisma.screen.create({
      data: {
        sessionId,
        shownManagerIds: selectedManagers.map(m => m.id),
        isGolden: Math.random() < DEFAULT_CONFIG.goldScreenFrequency,
      },
    });

    // Оновлюємо статистику експозиції
    await Promise.all(
      selectedManagers.map(async (manager) => {
        await prisma.managerExposure.upsert({
          where: {
            reviewerId_managerId: {
              reviewerId: session.reviewerId,
              managerId: manager.id,
            },
          },
          create: {
            reviewerId: session.reviewerId,
            managerId: manager.id,
            count: 1,
            uncertainty: manager.uncertainty,
          },
          update: {
            count: { increment: 1 },
            uncertainty: manager.uncertainty,
          },
        });
      })
    );

    return NextResponse.json({
      screenId: screen.id,
      managers: selectedManagers.map(m => ({
        id: m.id,
        name: m.name,
        position: m.position,
      })),
    });

  } catch (error) {
    console.error('Error generating next screen:', error);
    
    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    );
  }
}