import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Створюємо тестові дані
    const testManagers = [
      { name: 'Олександр Петренко', position: 'Менеджер з продажів' },
      { name: 'Марія Коваленко', position: 'Менеджер проєктів' },
      { name: 'Дмитро Сидоренко', position: 'Менеджер з маркетингу' },
      { name: 'Анна Шевченко', position: 'Менеджер HR' },
      { name: 'Василь Бондаренко', position: 'Менеджер розробки' },
      { name: 'Катерина Мельник', position: 'Менеджер фінансів' },
      { name: 'Іван Кравченко', position: 'Менеджер логістики' },
      { name: 'Ольга Захарченко', position: 'Менеджер якості' },
      { name: 'Сергій Лисенко', position: 'Менеджер безпеки' },
      { name: 'Наталія Руденко', position: 'Менеджер клієнтського сервісу' },
    ];

    const testReviewers = [
      { name: 'Олександр Петренко', role: 'CEO', reliabilityWeight: 0.95 },
      { name: 'Марія Коваленко', role: 'CTO', reliabilityWeight: 0.90 },
      { name: 'Дмитро Сидоренко', role: 'CMO', reliabilityWeight: 0.88 },
    ];

    // Додаємо менеджерів
    const createdManagers = [];
    for (const manager of testManagers) {
      try {
        const created = await prisma.manager.create({
          data: manager,
        });
        createdManagers.push(created);
      } catch (error) {
        // Якщо менеджер вже існує, оновлюємо
        const updated = await prisma.manager.update({
          where: { name: manager.name },
          data: { position: manager.position },
        });
        createdManagers.push(updated);
      }
    }

    // Додаємо рецензентів
    const createdReviewers = [];
    for (const reviewer of testReviewers) {
      try {
        const created = await prisma.reviewer.create({
          data: reviewer,
        });
        createdReviewers.push(created);
      } catch (error) {
        // Якщо рецензент вже існує, оновлюємо
        const existing = await prisma.reviewer.findFirst({
          where: { name: reviewer.name },
        });
        if (existing) {
          const updated = await prisma.reviewer.update({
            where: { id: existing.id },
            data: { role: reviewer.role, reliabilityWeight: reviewer.reliabilityWeight },
          });
          createdReviewers.push(updated);
        }
      }
    }

    return NextResponse.json({
      success: true,
      managers: createdManagers.length,
      reviewers: createdReviewers.length,
      data: { createdManagers, createdReviewers }
    });

  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json(
      { error: 'Помилка створення тестових даних', details: error instanceof Error ? error.message : 'Невідома помилка' },
      { status: 500 }
    );
  }
}