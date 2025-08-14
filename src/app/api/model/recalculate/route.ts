import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { BradleyTerryModel } from '@/lib/bradley-terry/model';
import { DEFAULT_CONFIG } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { reviewerId } = await request.json();
    
    if (!reviewerId) {
      return NextResponse.json(
        { error: 'reviewerId is required' },
        { status: 400 }
      );
    }

    console.log(`Recalculating model for reviewer ${reviewerId}`);

    // Get all managers
    const managers = await prisma.manager.findMany({
      select: { id: true },
    });
    const managerIds = managers.map(m => m.id);

    // Get all pairs for this reviewer
    const pairs = await prisma.pair.findMany({
      where: { reviewerId },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${pairs.length} pairs`);

    if (pairs.length === 0) {
      return NextResponse.json({
        message: 'No pairs found, nothing to recalculate',
        pairs: 0
      });
    }

    // Create new model
    const model = new BradleyTerryModel(managerIds, DEFAULT_CONFIG);

    // Process all pairs in batches (simulate online updates)
    let batchSize = 15; // Same as one screen
    for (let i = 0; i < pairs.length; i += batchSize) {
      const batch = pairs.slice(i, i + batchSize);
      const pairData = {
        pairs: batch.map(p => ({
          winnerId: p.iId,
          loserId: p.jId,
          weight: p.weight
        }))
      };
      
      model.updateOnline(pairData);
      console.log(`Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(pairs.length/batchSize)}`);
    }

    // Save updated model
    const serialized = model.serialize();
    await prisma.modelReviewer.upsert({
      where: { reviewerId },
      create: {
        reviewerId,
        thetaJson: serialized.theta,
      },
      update: {
        thetaJson: serialized.theta,
      },
    });

    console.log('Model updated successfully');
    
    // Get ranking for response
    const ranking = model.getRanking().slice(0, 10);

    return NextResponse.json({
      success: true,
      message: 'Model recalculated successfully',
      pairs: pairs.length,
      batches: Math.ceil(pairs.length / batchSize),
      topManagers: ranking.map(r => ({
        managerId: r.managerId,
        theta: Math.round(r.theta * 1000) / 1000,
        rank: r.rank
      }))
    });

  } catch (error) {
    console.error('Error recalculating model:', error);
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}