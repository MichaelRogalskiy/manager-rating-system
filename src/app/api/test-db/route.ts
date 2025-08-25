import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Тестуємо пряме підключення і виконання запиту
    const reviewerCount = await prisma.reviewer.count();
    const managerCount = await prisma.manager.count();
    
    // Отримуємо перші 5 записів
    const reviewers = await prisma.reviewer.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        active: true,
        createdAt: true
      }
    });

    const managers = await prisma.manager.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        position: true
      }
    });
    
    return NextResponse.json({
      success: true,
      counts: {
        reviewers: reviewerCount,
        managers: managerCount
      },
      sample_data: {
        reviewers,
        managers
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}