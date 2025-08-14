import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { BradleyTerryModel, PairGenerator } from '@/lib/bradley-terry/model';
import { DEFAULT_CONFIG } from '@/types';

const submitScreenSchema = z.object({
  screenId: z.string().uuid(),
  top3Ids: z.array(z.string().uuid()).length(3),
  loserId: z.string().uuid(),
  unknownIds: z.array(z.string().uuid()).optional().default([]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { screenId, top3Ids, loserId, unknownIds } = submitScreenSchema.parse(body);

    // Отримуємо екран з сесією
    const screen = await prisma.screen.findUnique({
      where: { id: screenId },
      include: { 
        session: { include: { reviewer: true } },
        choice: true,
      },
    });

    if (!screen) {
      return NextResponse.json(
        { error: 'Екран не знайдений' },
        { status: 404 }
      );
    }

    if (screen.choice) {
      return NextResponse.json(
        { error: 'Цей екран вже був оцінений' },
        { status: 400 }
      );
    }

    // Валідація: перевіряємо, що всі ID належать до shown менеджерів
    const shownIds = new Set(screen.shownManagerIds);
    const allSubmittedIds = [...top3Ids, loserId, ...unknownIds];
    
    for (const id of allSubmittedIds) {
      if (!shownIds.has(id)) {
        return NextResponse.json(
          { error: `Менеджер ${id} не був показаний на цьому екрані` },
          { status: 400 }
        );
      }
    }

    // Валідація: перевіряємо відсутність пересічень
    const uniqueIds = new Set(allSubmittedIds);
    if (uniqueIds.size !== allSubmittedIds.length) {
      return NextResponse.json(
        { error: 'Менеджер не може бути в кількох категоріях одночасно' },
        { status: 400 }
      );
    }

    // Визначаємо середню групу
    const middleIds = screen.shownManagerIds.filter(id => 
      !top3Ids.includes(id) && id !== loserId && !unknownIds.includes(id)
    );

    if (middleIds.length !== 3) {
      return NextResponse.json(
        { error: 'Невірна кількість менеджерів у групах' },
        { status: 400 }
      );
    }

    // Створюємо запис вибору
    await prisma.choice.create({
      data: {
        screenId,
        top3Ids,
        loserId,
        skippedIds: unknownIds,
      },
    });

    // Генеруємо пари для Bradley-Terry
    const pairData = PairGenerator.generatePairsFromScreen(top3Ids, middleIds, loserId);
    
    // Зберігаємо пари в базу
    await Promise.all(
      pairData.pairs.map(pair => 
        prisma.pair.create({
          data: {
            reviewerId: screen.session.reviewerId,
            iId: pair.winnerId,
            jId: pair.loserId,
            weight: pair.weight,
            sourceScreenId: screenId,
          },
        })
      )
    );

    // Оновлюємо модель рецензента
    await updateReviewerModel(screen.session.reviewerId, pairData);

    // Оновлюємо статистику рецензента
    await prisma.statsReviewer.upsert({
      where: { reviewerId: screen.session.reviewerId },
      create: {
        reviewerId: screen.session.reviewerId,
        totalScreens: 1,
        goldChecksPassed: screen.isGolden ? 1 : 0, // TODO: перевірка золотого екрану
      },
      update: {
        totalScreens: { increment: 1 },
        goldChecksPassed: screen.isGolden ? { increment: 1 } : undefined,
      },
    });

    return NextResponse.json({
      ok: true,
    });

  } catch (error) {
    console.error('Error submitting screen:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Невірні дані', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    );
  }
}

/**
 * Оновлення моделі рецензента з новими парами
 */
async function updateReviewerModel(reviewerId: string, pairData: { pairs: Array<{ winnerId: string; loserId: string; weight: number; }> }) {
  try {
    // Отримуємо всіх менеджерів
    const managers = await prisma.manager.findMany({
      select: { id: true },
    });
    const managerIds = managers.map(m => m.id);

    // Отримуємо поточну модель або створюємо нову
    const modelData = await prisma.modelReviewer.findUnique({
      where: { reviewerId },
    });

    let model: BradleyTerryModel;

    if (modelData && modelData.thetaJson) {
      // Відновлюємо існуючу модель
      model = BradleyTerryModel.deserialize(
        { theta: modelData.thetaJson as Record<string, number> },
        managerIds,
        DEFAULT_CONFIG
      );
    } else {
      // Створюємо нову модель
      model = new BradleyTerryModel(managerIds, DEFAULT_CONFIG);
    }

    // Оновлюємо модель онлайн
    model.updateOnline(pairData);

    // Зберігаємо оновлену модель
    const serialized = model.serialize();
    await prisma.modelReviewer.upsert({
      where: { reviewerId },
      create: {
        reviewerId,
        thetaJson: serialized.theta,
      },
      update: {
        thetaJson: serialized.theta,
      },
    });

    // Оновлюємо uncertainty для експозиції
    const ranking = model.getRanking();
    
    await Promise.all(
      ranking.map(async (entry) => {
        // Простий обчислювач uncertainty базований на кількості ігор
        // В реальності тут би був більш складний алгоритм
        const exposure = await prisma.managerExposure.findUnique({
          where: {
            reviewerId_managerId: {
              reviewerId,
              managerId: entry.managerId,
            },
          },
        });

        if (exposure) {
          const newUncertainty = Math.max(0.1, 1.0 / Math.sqrt(exposure.count + 1));
          
          await prisma.managerExposure.update({
            where: {
              reviewerId_managerId: {
                reviewerId,
                managerId: entry.managerId,
              },
            },
            data: { uncertainty: newUncertainty },
          });
        }
      })
    );

  } catch (error) {
    console.error('Error updating reviewer model:', error);
    throw error;
  }
}