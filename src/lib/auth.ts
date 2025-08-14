import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export async function validateSession(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const session = await prisma.raterSession.findUnique({
      where: { token },
      include: { rater: true },
    });

    if (!session) {
      return null;
    }

    // Check if session is not older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (session.createdAt < thirtyDaysAgo) {
      // Delete expired session
      await prisma.raterSession.delete({
        where: { id: session.id },
      });
      return null;
    }

    return {
      raterId: session.raterId,
      token: session.token,
      fullName: session.rater.fullName,
    };

  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}