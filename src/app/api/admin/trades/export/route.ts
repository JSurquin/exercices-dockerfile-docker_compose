import { NextRequest, NextResponse } from 'next/server';
import type { Prisma, TradeStatus } from '@prisma/client';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { mapTradeStatusFromDb, mapTradeStatusToDb } from '@/lib/status-mapper';

const MAX_EXPORT_ROWS = 50_000;

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const s = String(value);
  return `"${s.replace(/"/g, '""').replace(/\r\n|\n|\r/g, ' ')}"`;
}

function iso(d: Date | null | undefined): string {
  if (!d) return '';
  return d.toISOString();
}

function buildWhere(searchParams: URLSearchParams): Prisma.TradeWhereInput {
  const where: Prisma.TradeWhereInput = {};

  const status = searchParams.get('status');
  if (status) {
    where.status = mapTradeStatusToDb(status) as TradeStatus;
  }

  const userId = searchParams.get('userId');
  if (userId) {
    where.userId = userId;
  }

  const search = searchParams.get('search');
  if (search) {
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { ticketId: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) {
      const from = new Date(dateFrom);
      if (!Number.isNaN(from.getTime())) {
        where.createdAt.gte = from;
      }
    }
    if (dateTo) {
      const to = new Date(dateTo);
      if (!Number.isNaN(to.getTime())) {
        where.createdAt.lte = to;
      }
    }
  }

  return where;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Accès non autorisé.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const where = buildWhere(searchParams);

    const trades = await prisma.trade.findMany({
      where,
      include: {
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_EXPORT_ROWS,
    });

    const header = [
      'ticket_id',
      'trade_id',
      'user_id',
      'user_name',
      'user_email',
      'status',
      'gross_usd_cents',
      'cashout_fee_usd_cents',
      'network_fee_usd_cents',
      'net_usd_cents',
      'item_count',
      'items_market_hash_names',
      'created_at',
      'trade_accepted_at',
      'available_at',
      'steam_id',
      'trade_url',
    ].join(',');

    const lines = trades.map((t) => {
      const itemsSummary = t.items.map((i) => i.marketHashName).join(' | ');
      const row = [
        csvCell(t.ticketId),
        csvCell(t.id),
        csvCell(t.userId),
        csvCell(t.user?.name ?? ''),
        csvCell(t.user?.email ?? ''),
        csvCell(mapTradeStatusFromDb(t.status)),
        csvCell(t.grossCents),
        csvCell(t.cashoutFees),
        csvCell(t.networkFees),
        csvCell(t.netCents),
        csvCell(t.items.length),
        csvCell(itemsSummary),
        csvCell(iso(t.createdAt)),
        csvCell(iso(t.tradeAcceptedAt)),
        csvCell(iso(t.availableAt)),
        csvCell(t.steamId),
        csvCell(t.tradeUrl ?? ''),
      ];
      return row.join(',');
    });

    const csv = `\uFEFF${header}\n${lines.join('\n')}\n`;
    const filename = `trades-export-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Export-Row-Count': String(trades.length),
        'X-Export-Max-Rows': String(MAX_EXPORT_ROWS),
      },
    });
  } catch (error) {
    console.error('Export admin trades error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Une erreur interne est survenue.' },
      { status: 500 }
    );
  }
}
