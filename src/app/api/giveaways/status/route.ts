import { NextResponse } from 'next/server';
import { getGiveawaysEnabled } from '@/lib/points-service';

export async function GET() {
  try {
    const enabled = await getGiveawaysEnabled();
    return NextResponse.json({ enabled });
  } catch (error) {
    console.error('[giveaways/status] GET error:', error);
    return NextResponse.json({ enabled: true });
  }
}
