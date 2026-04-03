import { NextRequest, NextResponse } from 'next/server';
import { executeGiveawayDraw } from '@/lib/execute-giveaway-draw';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const result = await executeGiveawayDraw(id);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      giveaway: result.giveaway,
      winners: result.winners,
      winner: result.winners[0]?.user,
      totalParticipants: result.totalParticipants,
      totalTickets: result.totalEntries,
      totalEntries: result.totalEntries,
      randomSeed: result.randomSeed,
    });
  } catch (error) {
    console.error('Error drawing giveaway:', error);
    return NextResponse.json({ error: 'Erreur lors du tirage' }, { status: 500 });
  }
}
