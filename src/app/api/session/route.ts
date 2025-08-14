import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const createSessionSchema = z.object({
  fullName: z.string().min(5, 'Повне ім\'я повинно містити принаймні 5 символів'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName } = createSessionSchema.parse(body);

    // Check if rater already exists
    let rater = await prisma.rater.findFirst({
      where: { fullName },
    });

    if (!rater) {
      // Create new rater
      rater = await prisma.rater.create({
        data: {
          fullName,
        },
      });
    }

    // Create new session
    const sessionToken = uuidv4();
    
    const session = await prisma.raterSession.create({
      data: {
        raterId: rater.id,
        token: sessionToken,
      },
    });

    return NextResponse.json({
      raterId: rater.id,
      sessionToken: session.token,
      fullName: rater.fullName,
    });

  } catch (error) {
    console.error('Session creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
