import { NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { obfuscatePublicCount } from '@/lib/privacy-obfuscation';

export const revalidate = 300; // 5 minutes

const COMPLETED_TRADE_STATUSES = ['PAID', 'PAYOUT_PENDING', 'AVAILABLE'] as const;

export async function GET() {
  try {
    const [rawUsers, completedTrades, volumeResult, rawSkinsSold] = await Promise.all([
      prisma.user.count(),
      prisma.trade.count({ where: { status: { in: [...COMPLETED_TRADE_STATUSES] } } }),
      prisma.trade.aggregate({
        _sum: { grossCents: true },
        where: { status: { in: [...COMPLETED_TRADE_STATUSES] } },
      }),
      prisma.tradeItem.count({
        where: { trade: { status: { in: [...COMPLETED_TRADE_STATUSES] } } },
      }),
    ]);

    const volumeCents = volumeResult._sum.grossCents ?? 0;

    // Pas de fuite d’effectif exact (énumération / veille concurrente)
    return NextResponse.json({
      totalUsers: obfuscatePublicCount(rawUsers),
      completedTrades: obfuscatePublicCount(completedTrades),
      volumeMillions: Math.round((volumeCents / 100_000_000) * 10) / 10,
      totalVolumeCents: obfuscatePublicCount(volumeCents),
      totalSkinsSold: obfuscatePublicCount(rawSkinsSold),
    });
  } catch {
    return NextResponse.json(
      { totalUsers: 0, completedTrades: 0, volumeMillions: 0, totalVolumeCents: 0, totalSkinsSold: 0 },
      { status: 500 }
    );
  }
}
