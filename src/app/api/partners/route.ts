import { NextResponse } from 'next/server';
import { getPublicPartners } from '@/lib/get-public-partners';

export async function GET() {
  try {
    const data = await getPublicPartners();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[partners GET]', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
