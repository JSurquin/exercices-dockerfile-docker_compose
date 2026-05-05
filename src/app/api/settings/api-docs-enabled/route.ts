import { NextResponse } from 'next/server';
import { getPlatformConfig } from '@/lib/platform-config-service';

export const revalidate = 300;

export async function GET() {
  try {
    const config = await getPlatformConfig();
    return NextResponse.json({ enabled: config.apiDocsEnabled });
  } catch {
    return NextResponse.json({ enabled: false });
  }
}
