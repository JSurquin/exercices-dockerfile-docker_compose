import { NextResponse } from 'next/server';
import { DEFAULT_PLATFORM_SETTINGS, getPlatformSettings } from '@/lib/get-platform-settings';

export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    return NextResponse.json(await getPlatformSettings());
  } catch {
    return NextResponse.json(DEFAULT_PLATFORM_SETTINGS);
  }
}
