import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Видаляємо тестових рецензентів (що були створені при сідінгу)
    // Залишаємо тільки тих, що створені через інтерфейс
    const testReviewerNames = [
      'Олександр Петренко',
      'Марія Коваленко', 
      'Дмитро Сидоренко'
    ];

    // Отримуємо ID тестових рецензентів
    const testReviewers = await prisma.reviewer.findMany({
      where: {
        name: {
          in: testReviewerNames
        }
      },
      select: { id: true }
    });

    const testReviewerIds = testReviewers.map(r => r.id);

    if (testReviewerIds.length > 0) {
      // Видаляємо пов'язані дані
      await prisma.pair.deleteMany({
        where: { reviewerId: { in: testReviewerIds } }
      });

      await prisma.choice.deleteMany({
        where: {
          screen: {
            session: {
              reviewerId: { in: testReviewerIds }
            }
          }
        }
      });

      await prisma.screen.deleteMany({
        where: {
          session: {
            reviewerId: { in: testReviewerIds }
          }
        }
      });

      await prisma.session.deleteMany({
        where: { reviewerId: { in: testReviewerIds } }
      });

      await prisma.managerExposure.deleteMany({
        where: { reviewerId: { in: testReviewerIds } }
      });

      await prisma.modelReviewer.deleteMany({
        where: { reviewerId: { in: testReviewerIds } }
      });

      await prisma.statsReviewer.deleteMany({
        where: { reviewerId: { in: testReviewerIds } }
      });

      // Видаляємо самих тестових рецензентів
      const deletedCount = await prisma.reviewer.deleteMany({
        where: {
          id: { in: testReviewerIds }
        }
      });

      console.log(`Видалено ${deletedCount.count} тестових рецензентів`);
    }

    // Отримуємо список рецензентів, що залишилися
    const remainingReviewers = await prisma.reviewer.findMany({
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({
      success: true,
      message: `Видалено ${testReviewerIds.length} тестових рецензентів`,
      remainingReviewers: remainingReviewers.length,
      reviewers: remainingReviewers.map(r => ({
        id: r.id,
        name: r.name,
        role: r.role,
        active: r.active
      }))
    });

  } catch (error) {
    console.error('Error cleaning up reviewers:', error);
    
    return NextResponse.json(
      { 
        error: 'Помилка очищення рецензентів',
        details: error instanceof Error ? error.message : 'Невідома помилка'
      },
      { status: 500 }
    );
  }
}