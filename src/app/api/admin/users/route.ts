import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { User, AdminFilters } from '@/lib/types';
import { prisma } from '~/prisma/prisma';
import { KycStatus } from '@prisma/client';
import { CREDITED_TRADE_STATUSES } from '@/lib/trade-volume';
import { 
  getRequestContext, 
  logUnauthorizedAccess, 
  logAdminAccess,
  logSystemError
} from '@/lib/security/audit-helpers';

export async function GET(request: NextRequest) {
  const context = getRequestContext(request);
  
  try {
    const session = await requireAdminSessionWithDbCheck(request);

    if (!session) {
      await logUnauthorizedAccess(context, '/api/admin/users', 'Admin required from DB check');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    context.userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get('limit') || '20');
    const filters: AdminFilters = {
      status: searchParams.get('status') || undefined,
      role: searchParams.get('role') || undefined,
      tag: searchParams.get('tag') || undefined,
      banned: searchParams.get('banned') || undefined,
      search: searchParams.get('search') || undefined,
      page: Math.max(1, parseInt(searchParams.get('page') || '1') || 1),
      limit: Math.min(Math.max(1, rawLimit || 20), 100),
    };

    // Construire les conditions de filtrage Prisma
    const whereConditions: any = {};
    const andConditions: any[] = [];

    if (filters.status) {
      const f = filters.status.toLowerCase();
      // Les filtres UI sont en minuscules ; Prisma attend les enums KycStatus.
      if (f === 'pending') {
        whereConditions.kycStatus = { in: [KycStatus.PENDING, KycStatus.KYCAID_PENDING] };
      } else if (f === 'in_progress') {
        whereConditions.kycStatus = KycStatus.IN_PROGRESS;
      } else if (f === 'verified') {
        whereConditions.kycStatus = { in: [KycStatus.VERIFIED, KycStatus.KYCAID_VERIFIED] };
      } else if (f === 'rejected') {
        whereConditions.kycStatus = { in: [KycStatus.REJECTED, KycStatus.KYCAID_REJECTED] };
      }
    }

    if (filters.role) {
      whereConditions.role = filters.role;
    }

    if (filters.tag) {
      whereConditions.userTag = filters.tag;
    }

    if (filters.search) {
      andConditions.push({
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { steamUsername: { contains: filters.search, mode: 'insensitive' } },
          { steamId: { contains: filters.search, mode: 'insensitive' } },
          { id: { contains: filters.search, mode: 'insensitive' } },
        ],
      });
    }

    if (filters.banned === 'true') {
      whereConditions.banned = true;
      andConditions.push({
        OR: [
          { banExpires: null },
          { banExpires: { gt: new Date() } },
        ],
      });
    }

    if (andConditions.length > 0) {
      whereConditions.AND = andConditions;
    }

    // Récupérer les utilisateurs de la base de données
    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where: whereConditions,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          steamAvatar: true,
          steamId: true,
          steamUsername: true,
          kycStatus: true,
          level: true,
          xp: true,
          tickets: true,
          totalVolumeCents: true,
          pendingBalanceCents: true,
          bonusRatePercent: true,
          userTag: true,
          affiliateRewardsBlocked: true,
          xpRewardsBlocked: true,
          acceptedTermsAt: true,
          createdAt: true,
          role: true,
          banned: true,
          banReason: true,
          banExpires: true,
          lastLoginIp: true,
          lastLoginAt: true,
        },
        skip: ((filters.page || 1) - 1) * (filters.limit || 20),
        take: filters.limit || 20,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: whereConditions }),
    ]);

    const userIds = users.map(u => u.id);

    // Volume total : trades complétés et crédités uniquement
    const [totalVolumeRows, pendingVolumeRows] = await Promise.all([
      prisma.trade.groupBy({
        by: ['userId'],
        where: {
          userId: { in: userIds },
          status: { in: CREDITED_TRADE_STATUSES },
        },
        _sum: { grossCents: true },
      }),
      // Volume en attente : uniquement les trades encore en cours (hold Steam)
      prisma.trade.groupBy({
        by: ['userId'],
        where: {
          userId: { in: userIds },
          status: { in: ['CREATED', 'ACCEPTED_BY_BOT', 'IN_TRADE_HOLD'] },
        },
        _sum: { grossCents: true },
      }),
    ]);

    const totalVolumeMap = new Map(
      totalVolumeRows.map(r => [r.userId, r._sum.grossCents ?? 0])
    );
    const pendingVolumeMap = new Map(
      pendingVolumeRows.map(r => [r.userId, r._sum.grossCents ?? 0])
    );

    // Transformer les données pour correspondre au format User
    const formattedUsers: User[] = users.map(user => ({
      id: user.id,
      steamId64: user.steamId || 'N/A',
      username: user.steamUsername || user.name || user.email || 'Utilisateur sans nom',
      avatar: user.steamAvatar || user.image || '',
      acceptedTermsAt: user.acceptedTermsAt || undefined,
      kycStatus: user.kycStatus as 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED' | 'KYCAID_PENDING' | 'KYCAID_VERIFIED' | 'KYCAID_REJECTED',
      role: user.role,
      totalVolume: totalVolumeMap.get(user.id) ?? user.totalVolumeCents,
      pendingVolume: pendingVolumeMap.get(user.id) ?? 0,
      pendingBalanceCents: user.pendingBalanceCents,
      bonusRatePercent: user.bonusRatePercent,
      userTag: user.userTag,
      affiliateRewardsBlocked: user.affiliateRewardsBlocked,
      xpRewardsBlocked: user.xpRewardsBlocked,
      xp: user.xp,
      level: user.level,
      tickets: user.tickets,
      joinedAt: user.createdAt,
      banned: user.banned,
      banReason: user.banReason,
      banExpires: user.banExpires,
      lastLoginIp: user.lastLoginIp,
      lastLoginAt: user.lastLoginAt,
    }));

    await logAdminAccess(context, 'users_list_accessed', undefined, {
      resultCount: formattedUsers.length,
      totalUsers: totalUsers,
    }).catch(() => {});

    const pageSize = filters.limit || 20;
    const currentPage = filters.page || 1;
    const totalPages = Math.ceil(totalUsers / pageSize);

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        total: totalUsers,
        page: currentPage,
        pages: totalPages,
        limit: pageSize,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    
    // Log de l'erreur système
    await logSystemError(context, error, 'admin_users_fetch');
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
