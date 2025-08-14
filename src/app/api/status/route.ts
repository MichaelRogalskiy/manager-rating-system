import { NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/dbHelper';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Try to check database connection
    const isDatabaseAvailable = await safeDbOperation(
      async () => {
        // Simple query to test database connection
        await prisma.$queryRaw`SELECT 1`;
        return true;
      },
      false // fallback value
    );

    return NextResponse.json({
      database: isDatabaseAvailable ? 'connected' : 'disconnected',
      mode: isDatabaseAvailable ? 'production' : 'demo',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({
      database: 'disconnected',
      mode: 'demo',
      timestamp: new Date().toISOString(),
      error: 'Status check failed',
    });
  }
}