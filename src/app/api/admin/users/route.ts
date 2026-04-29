import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { User, AdminFilters } from '@/lib/types';
import { prisma } from '~/prisma/prisma';
import { KycStatus } from '@prisma/client';
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
      search: searchParams.get('search') || undefined,
      page: Math.max(1, parseInt(searchParams.get('page') || '1') || 1),
      limit: Math.min(Math.max(1, rawLimit || 20), 100),
    };

    // Construire les conditions de filtrage Prisma
    const whereConditions: any = {};

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

    if (filters.search) {
      whereConditions.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { steamId: { contains: filters.search, mode: 'insensitive' } },
        { id: { contains: filters.search, mode: 'insensitive' } },
      ];
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
          steamId: true,
          kycStatus: true,
          level: true,
          xp: true,
          tickets: true,
          totalVolumeCents: true,
          acceptedTermsAt: true,
          createdAt: true,
          role: true,
        },
        skip: ((filters.page || 1) - 1) * (filters.limit || 20),
        take: filters.limit || 20,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: whereConditions }),
    ]);

    // Transformer les données pour correspondre au format User
    const formattedUsers: User[] = users.map(user => ({
      id: user.id,
      steamId64: user.steamId || 'N/A',
      username: user.name || user.email || 'Utilisateur sans nom',
      avatar: user.image || '',
      acceptedTermsAt: user.acceptedTermsAt || undefined,
      kycStatus: user.kycStatus as 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED' | 'KYCAID_PENDING' | 'KYCAID_VERIFIED' | 'KYCAID_REJECTED',
      role: user.role,
      totalVolume: user.totalVolumeCents,
      xp: user.xp,
      level: user.level,
      tickets: user.tickets,
      joinedAt: user.createdAt,
    }));

    // Log de l'accès admin - DÉSACTIVÉ pour éviter les boucles
    // await logAdminAccess(context, 'users_list_accessed', undefined, {
    //   filters,
    //   resultCount: formattedUsers.length,
    //   totalUsers: totalUsers
    // });

    return NextResponse.json({
      users: formattedUsers,
      total: totalUsers,
      page: filters.page || 1,
      limit: filters.limit || 20,
      totalPages: Math.ceil(totalUsers / (filters.limit || 20)),
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
