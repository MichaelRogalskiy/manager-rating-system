import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Реальні менеджери Monobank
    const monobankManagers = [
      { name: 'Ващенко Вікторія Вікторівна', position: 'Виконувачка обов\'язків Chief Marketing Officer' },
      { name: 'Бондаренко Едуард Володимирович', position: 'Head of B2B Sales' },
      { name: 'Рудер Ганна Олександрівна', position: 'Керівниця Back office' },
      { name: 'Бусаргін Данило Сергійович', position: 'Business Area Lead (Crowdfunding)' },
      { name: 'Гончарук Антон Володимирович', position: 'Business Area Lead (База)' },
      { name: 'Живиця Маргарита Віталіївна', position: 'Business Area Lead (ФОП)' },
      { name: 'Загній Владислав Ігорович', position: 'Business Area Lead (Зарплатні проєкти, зарплата кожен день, Зроблено в Україні)' },
      { name: 'Неділько Сергій Володимирович', position: 'Business Area Lead (Актуалізація данних клієнтів і відновлення документів)' },
      { name: 'Олещенко Максим Юрійович', position: 'Business Area Lead (Онбординг)' },
      { name: 'Палагнюк Сергій Юрійович', position: 'Директор LoyaltyAI' },
      { name: 'Плахтій Владислав Олександрович', position: 'Business Area Lead (ФОП)' },
      { name: 'Рубан Валерія Володимирівна', position: 'Business Area Lead (Платежі юридичних осіб)' },
      { name: 'Савенков Антон Олександрович', position: 'Business Area Lead (Платежі, Банка)' },
      { name: 'Тропп Роман Олегович', position: 'Business Area Lead (Реєстрація)' },
      { name: 'Фесюра Олександр Олександрович', position: 'Business Area Lead (Свіфти)' },
      { name: 'Хорунжий Дмитро Геннадійович', position: 'Head of Operations Marketplace' },
      { name: 'Кудлай Антон', position: 'Chief Product Officer B2B' },
      { name: 'Леськів Олександр Андрійович', position: 'CEO/CTO Supa' },
      { name: 'Печерська Ганна Юріївна', position: 'HR Director' },
      { name: 'Шевченко Артем Фідельович', position: 'СЕО Marketplace' },
      { name: 'Акуленко Юлія Юріївна', position: 'Product Owner (Карткові продукти)' },
      { name: 'Бабіюк Гліб Геннадійович', position: 'Product Owner Marketplace' },
      { name: 'Бондаренко Денис Олексійович', position: 'Area Product Owner (Платежі і сервіси)/Product Owner (Платіжні системи та карткові технології)' },
      { name: 'Гаренко Тетяна Володимирівна', position: 'Керівниця Операційного Центру Monobank' },
      { name: 'Драпогуз Євген Миколайович', position: 'Product Owner Інтерактив (PFM/Аватар)' },
      { name: 'Жураховський Владлен Віталійович', position: 'Area Product Owner Стрим Client Solutions (CSS)' },
      { name: 'Корешникова Марина Андріївна', position: 'Team Lead Risk management' },
      { name: 'Маляр Олег Федорович', position: 'Product Owner (Розстрочка) / Business Area Lead (Кредитні картки)' },
      { name: 'Міхальов Євген Юрійович', position: 'Product owner Collection' },
      { name: 'Огнівець Віталій Анатолійович', position: 'Product Owner (Накопичення і краудфандінг)' },
      { name: 'Підкуйко Владислава Олегівна', position: 'Product Owner (Эквайринг)' },
      { name: 'Путятін Олексій Юрійович', position: 'Product Owner Monobusiness' },
      { name: 'Радченко Ірина Олександрівна', position: 'Chief of Resale Platform' },
      { name: 'Селецький Михайло Дмитрович', position: 'Business development manager Expirenza' },
      { name: 'Сироткін Олексій Андрійович', position: 'Product Owner Checkout /Покупка частинами' },
      { name: 'Ульянов Володимир Володимирович', position: 'Product Owner' }
    ];

    const testReviewers = [
      { name: 'Олександр Петренко', role: 'CEO', reliabilityWeight: 0.95 },
      { name: 'Марія Коваленко', role: 'CTO', reliabilityWeight: 0.90 },
      { name: 'Дмитро Сидоренко', role: 'CMO', reliabilityWeight: 0.88 },
    ];

    // Додаємо менеджерів
    const createdManagers = [];
    for (const manager of monobankManagers) {
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
      imported: createdManagers.length,
      reviewers: createdReviewers.length,
      message: `Завантажено ${createdManagers.length} менеджерів Monobank`
    });

  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json(
      { error: 'Помилка створення тестових даних', details: error instanceof Error ? error.message : 'Невідома помилка' },
      { status: 500 }
    );
  }
}