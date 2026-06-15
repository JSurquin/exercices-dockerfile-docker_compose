import { NextResponse } from 'next/server';
import { EMPTY_PUBLIC_STATS, getPublicStats } from '@/lib/get-public-stats';

export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    return NextResponse.json(await getPublicStats());
  } catch {
    return NextResponse.json(EMPTY_PUBLIC_STATS, { status: 500 });
  }
}
