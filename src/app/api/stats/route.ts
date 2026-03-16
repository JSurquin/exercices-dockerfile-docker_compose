import { NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';

export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    const [totalUsers, completedTrades, volumeResult] = await Promise.all([
      prisma.user.count(),
      prisma.trade.count({ where: { status: { in: ['PAID', 'PAYOUT_PENDING', 'AVAILABLE'] } } }),
      prisma.trade.aggregate({
        _sum: { grossCents: true },
        where: { status: { in: ['PAID', 'PAYOUT_PENDING', 'AVAILABLE'] } },
      }),
    ]);

    const volumeCents = volumeResult._sum.grossCents ?? 0;

    return NextResponse.json({
      totalUsers,
      completedTrades,
      volumeMillions: Math.round((volumeCents / 100_000) * 10) / 10,
    });
  } catch {
    return NextResponse.json(
      { totalUsers: 0, completedTrades: 0, volumeMillions: 0 },
      { status: 500 }
    );
  }
}
