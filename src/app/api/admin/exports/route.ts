import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';

type DateFilter = { createdAt?: { gte?: Date; lte?: Date } };

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);

    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const format = searchParams.get('format') || 'csv';
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');

    const dateFrom = dateFromParam ? new Date(dateFromParam) : undefined;
    const dateTo = dateToParam ? new Date(dateToParam) : undefined;

    const dateFilter: DateFilter =
      dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {};

    if (!type) {
      return NextResponse.json({ error: "Type d'export requis" }, { status: 400 });
    }

    let csvData = '';
    let filename = '';

    switch (type) {
      case 'trades':
        csvData = await generateTradesCSV(dateFilter);
        filename = 'trades';
        break;
      case 'users':
        csvData = await generateUsersCSV(dateFilter);
        filename = 'users';
        break;
      case 'payouts':
        csvData = await generatePayoutsCSV(dateFilter);
        filename = 'payouts';
        break;
      case 'kyc':
        csvData = await generateKYCCSV(dateFilter);
        filename = 'kyc-documents';
        break;
      case 'affiliates':
        csvData = await generateAffiliatesCSV(dateFilter);
        filename = 'affiliates';
        break;
      case 'giveaways':
        csvData = await generateGiveawaysCSV(dateFilter);
        filename = 'giveaways';
        break;
      default:
        return NextResponse.json({ error: "Type d'export non supporté" }, { status: 400 });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    filename = `${filename}-${dateStr}.${format}`;

    logger.info('Admin export', {
      adminId: session.user.id,
      type,
      format,
      ip: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown',
    });

    const contentType =
      format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv';

    return new NextResponse('\uFEFF' + csvData, {
      headers: {
        'Content-Type': `${contentType}; charset=utf-8`,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'export:", error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

function escapeCsv(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  // Neutraliser les formules CSV (Excel/LibreOffice injection)
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n')) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

function rowToCSV(row: unknown[]): string {
  return row.map(escapeCsv).join(',');
}

async function generateTradesCSV(dateFilter: DateFilter): Promise<string> {
  const trades = await prisma.trade.findMany({
    where: dateFilter,
    include: {
      user: { select: { name: true, email: true, steamId: true } },
      items: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const headers = [
    'ID',
    'Ticket ID',
    'Utilisateur',
    'Steam ID',
    'Statut',
    'Montant Brut (€)',
    'Frais Cashout (€)',
    'Frais Réseau (€)',
    'Montant Net (€)',
    'Nombre items',
    'Créé le',
    'Accepté le',
    'Disponible le',
  ];

  const rows = trades.map((t) => [
    t.id,
    t.ticketId,
    t.user?.name ?? '',
    t.user?.steamId ?? '',
    t.status,
    (t.grossCents / 100).toFixed(2),
    (t.cashoutFees / 100).toFixed(2),
    (t.networkFees / 100).toFixed(2),
    (t.netCents / 100).toFixed(2),
    t.items.length,
    t.createdAt.toISOString(),
    t.tradeAcceptedAt?.toISOString() ?? '',
    t.availableAt?.toISOString() ?? '',
  ]);

  return [rowToCSV(headers), ...rows.map(rowToCSV)].join('\n');
}

async function generateUsersCSV(dateFilter: DateFilter): Promise<string> {
  const users = await prisma.user.findMany({
    where: dateFilter,
    orderBy: { createdAt: 'desc' },
  });

  const headers = [
    'ID',
    'Nom',
    'Email',
    'Steam ID',
    'Statut KYC',
    'Rôle',
    'Volume Total (€)',
    'Balance (€)',
    'Niveau',
    'XP',
    'Tickets',
    'Inscrit le',
  ];

  const rows = users.map((u) => [
    u.id,
    u.name ?? '',
    u.email,
    u.steamId ?? '',
    u.kycStatus,
    u.role,
    (u.totalVolumeCents / 100).toFixed(2),
    (u.balanceCents / 100).toFixed(2),
    u.level,
    u.xp,
    u.tickets,
    u.createdAt.toISOString(),
  ]);

  return [rowToCSV(headers), ...rows.map(rowToCSV)].join('\n');
}

async function generatePayoutsCSV(dateFilter: DateFilter): Promise<string> {
  const payouts = await prisma.payout.findMany({
    where: dateFilter,
    include: {
      user: { select: { name: true, email: true, steamId: true } },
      paymentMethod: { select: { type: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const headers = [
    'ID',
    'Utilisateur',
    'Email',
    'Steam ID',
    'Statut',
    'Montant (€)',
    'Méthode de paiement',
    'Référence paiement',
    'TX Hash',
    'Frais traitement (€)',
    'Frais réseau (€)',
    'Créé le',
    'Payé le',
    'Message erreur',
  ];

  const rows = payouts.map((p) => [
    p.id,
    p.user?.name ?? '',
    p.user?.email ?? '',
    p.user?.steamId ?? '',
    p.status,
    (p.amountCents / 100).toFixed(2),
    p.paymentMethod?.type ?? '',
    p.paymentReference ?? '',
    p.txId ?? p.whitepayTxHash ?? '',
    p.processingFeeCents != null ? (p.processingFeeCents / 100).toFixed(2) : '',
    p.networkFeeCents != null ? (p.networkFeeCents / 100).toFixed(2) : '',
    p.createdAt.toISOString(),
    p.paidAt?.toISOString() ?? '',
    p.errorMessage ?? '',
  ]);

  return [rowToCSV(headers), ...rows.map(rowToCSV)].join('\n');
}

async function generateKYCCSV(dateFilter: { createdAt?: { gte?: Date; lte?: Date } }): Promise<string> {
  // KycDocument uses uploadedAt instead of createdAt
  const kycDateFilter =
    dateFilter.createdAt
      ? {
          uploadedAt: {
            ...(dateFilter.createdAt.gte ? { gte: dateFilter.createdAt.gte } : {}),
            ...(dateFilter.createdAt.lte ? { lte: dateFilter.createdAt.lte } : {}),
          },
        }
      : {};

  const docs = await prisma.kycDocument.findMany({
    where: kycDateFilter,
    include: {
      user: { select: { name: true, email: true, steamId: true } },
    },
    orderBy: { uploadedAt: 'desc' },
  });

  const headers = [
    'ID',
    'Utilisateur',
    'Email',
    'Steam ID',
    'Type document',
    'Statut',
    'KYCAID Applicant ID',
    'Vérifié',
    'Uploadé le',
    'Révisé le',
    'Raison rejet',
  ];

  const rows = docs.map((d) => [
    d.id,
    d.user?.name ?? '',
    d.user?.email ?? '',
    d.user?.steamId ?? '',
    d.type,
    d.status,
    d.kycaidApplicantId,
    d.isVerified ? 'oui' : 'non',
    d.uploadedAt.toISOString(),
    d.reviewedAt?.toISOString() ?? '',
    d.rejectionReason ?? '',
  ]);

  return [rowToCSV(headers), ...rows.map(rowToCSV)].join('\n');
}

async function generateAffiliatesCSV(dateFilter: DateFilter): Promise<string> {
  const affiliates = await prisma.affiliateStats.findMany({
    where: dateFilter,
    include: {
      user: { select: { name: true, email: true, steamId: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const headers = [
    'ID',
    'Utilisateur',
    'Email',
    'Steam ID',
    'Code affilié',
    'Total références',
    'Volume total (€)',
    'Commission totale (€)',
    'Taux commission (%)',
    'Actif',
    'Créé le',
  ];

  const rows = affiliates.map((a) => [
    a.id,
    a.user?.name ?? '',
    a.user?.email ?? '',
    a.user?.steamId ?? '',
    a.code,
    a.totalReferrals,
    (a.totalVolumeCents / 100).toFixed(2),
    (a.totalCommissionCents / 100).toFixed(2),
    (a.commissionRate * 100).toFixed(1),
    a.isActive ? 'oui' : 'non',
    a.createdAt.toISOString(),
  ]);

  return [rowToCSV(headers), ...rows.map(rowToCSV)].join('\n');
}

async function generateGiveawaysCSV(dateFilter: DateFilter): Promise<string> {
  const giveaways = await prisma.giveaway.findMany({
    where: dateFilter,
    include: {
      entries: {
        include: {
          user: { select: { name: true, steamId: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const headers = [
    'ID',
    'Titre',
    'Prix',
    'Prix ticket',
    'Tickets max',
    'Tickets vendus',
    'Date de fin',
    'Statut',
    'Gagnant (Steam ID)',
    'Nombre participants',
    'Créé le',
  ];

  const rows = giveaways.map((g) => {
    const winner = g.winnerId
      ? g.entries.find((e) => e.userId === g.winnerId)
      : null;
    return [
      g.id,
      g.title,
      g.prize,
      (g.ticketPrice / 100).toFixed(2),
      g.maxTickets,
      g.soldTickets,
      g.endDate.toISOString(),
      g.status,
      winner?.user?.steamId ?? g.winnerId ?? '',
      g.entries.length,
      g.createdAt.toISOString(),
    ];
  });

  return [rowToCSV(headers), ...rows.map(rowToCSV)].join('\n');
}
