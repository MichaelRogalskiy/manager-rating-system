import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Простий тест підключення до БД
    await prisma.$queryRaw`SELECT 1 as test`;
    
    return NextResponse.json({ 
      status: 'OK',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    return NextResponse.json({
      status: 'Error',
      database: 'Disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}