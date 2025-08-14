import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { safeDbOperation } from '@/lib/dbHelper';
import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const createSessionSchema = z.object({
  fullName: z.string().min(5, 'Повне ім\'я повинно містити принаймні 5 символів'),
});

// In-memory fallback storage for demo mode
const demoSessions = new Map<string, { raterId: string; fullName: string; token: string }>();
const demoRaters = new Map<string, { id: string; fullName: string }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName } = createSessionSchema.parse(body);

    // Try database operation first, fallback to demo mode if failed
    const result = await safeDbOperation(
      async () => {
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

        return {
          raterId: rater.id,
          sessionToken: session.token,
          fullName: rater.fullName,
        };
      },
      null // fallback value
    );

    // If database worked, return the result
    if (result) {
      return NextResponse.json(result);
    }

    // Fallback to demo mode
    console.log('Using demo mode - no database connection');
    
    // Check if rater exists in demo storage
    let rater = Array.from(demoRaters.values()).find(r => r.fullName === fullName);
    
    if (!rater) {
      // Create new demo rater
      const raterId = uuidv4();
      rater = { id: raterId, fullName };
      demoRaters.set(raterId, rater);
    }

    // Create new demo session
    const sessionToken = uuidv4();
    const session = {
      raterId: rater.id,
      fullName: rater.fullName,
      token: sessionToken,
    };
    
    demoSessions.set(sessionToken, session);

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
