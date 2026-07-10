import { NextResponse } from 'next/server';
import {
  EMPTY_PUBLIC_HOME_POPUPS,
  getActiveHomePopups,
} from '@/lib/get-public-home-popups';

export async function GET() {
  try {
    const popups = await getActiveHomePopups();
    return NextResponse.json({ popups }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[home-popups GET]', error);
    return NextResponse.json(
      { popups: EMPTY_PUBLIC_HOME_POPUPS },
      { status: 500 }
    );
  }
}
