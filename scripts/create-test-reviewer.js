const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Створюємо тестового рецензента
  const reviewer = await prisma.reviewer.create({
    data: {
      name: 'Тестовий Рецензент',
      role: 'Керівник відділу',
      reliabilityWeight: 1.0,
      active: true
    }
  });

  console.log('Created reviewer:', reviewer);

  // Створюємо кількох тестових менеджерів
  const managers = await Promise.all([
    prisma.manager.create({
      data: {
        name: 'Іван Іванов',
        position: 'Менеджер з продажу'
      }
    }),
    prisma.manager.create({
      data: {
        name: 'Марія Петренко', 
        position: 'Менеджер проєктів'
      }
    }),
    prisma.manager.create({
      data: {
        name: 'Олег Сидоренко',
        position: 'Менеджер з маркетингу'
      }
    })
  ]);

  console.log('Created managers:', managers.length);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });