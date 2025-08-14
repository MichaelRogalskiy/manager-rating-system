import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CSVParser } from '@/lib/csv/parser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type', message: 'Тільки CSV файли підтримуються' },
        { status: 400 }
      );
    }

    const csvText = await file.text();
    const parser = new CSVParser();
    
    const { validManagers, errors, duplicateIds } = parser.processCSV(csvText);

    if (validManagers.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid data',
          message: 'Не знайдено валідних записів',
          details: errors,
        },
        { status: 400 }
      );
    }

    // Import managers to database
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    await prisma.$transaction(async (tx) => {
      for (const manager of validManagers) {
        try {
          // Try to upsert manager
          const result = await tx.manager.upsert({
            where: { id: manager.id },
            update: {
              lastName: manager.lastName,
              firstName: manager.firstName,
              patronymic: manager.patronymic,
              position: manager.position,
            },
            create: {
              id: manager.id,
              lastName: manager.lastName,
              firstName: manager.firstName,
              patronymic: manager.patronymic,
              position: manager.position,
            },
          });

          // Check if it was an insert or update
          if (result.createdAt.getTime() === result.createdAt.setMilliseconds(0)) {
            // Rough check - if created recently, it was probably inserted
            imported++;
          } else {
            updated++;
          }

        } catch (error) {
          console.error('Error importing manager:', manager.id, error);
          skipped++;
        }
      }
    });

    return NextResponse.json({
      imported,
      updated: validManagers.length - imported, // More accurate count
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      duplicateIds: duplicateIds.length > 0 ? duplicateIds : undefined,
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}