import { NextResponse } from 'next/server';
import { fetchPlatformStatsFromDb } from '@/lib/platform-stats';
import { obfuscatePublicCount } from '@/lib/privacy-obfuscation';

export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    const raw = await fetchPlatformStatsFromDb();
    const volumeCents = raw.totalVolumeCents;

    // Arrondi visuel public (200+, €7 k…) — source = mêmes agrégats que le panel admin
    return NextResponse.json({
      totalUsers: obfuscatePublicCount(raw.totalUsers),
      completedTrades: obfuscatePublicCount(raw.totalTrades),
      volumeMillions: Math.round((volumeCents / 100 / 1_000_000) * 10) / 10,
      totalVolumeCents: obfuscatePublicCount(volumeCents),
      totalSkinsSold: obfuscatePublicCount(raw.totalSkinsSold),
    });
  } catch {
    return NextResponse.json(
      { totalUsers: 0, completedTrades: 0, volumeMillions: 0, totalVolumeCents: 0, totalSkinsSold: 0 },
      { status: 500 }
    );
  }
}
