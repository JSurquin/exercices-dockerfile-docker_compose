import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { User, AdminFilters } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters: AdminFilters = {
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    // Données mockées
    const mockUsers: User[] = [
      {
        id: 'user_1',
        steamId64: '76561198000000001',
        username: 'ProTrader_CS2',
        avatar: 'https://avatars.steamstatic.com/avatar.jpg',
        acceptedTermsAt: new Date('2024-01-15T00:00:00Z'),
        kycStatus: 'verified',
        totalVolume: 2500000,
        xp: 12500,
        level: 15,
        tickets: 45,
        joinedAt: new Date('2024-01-15T00:00:00Z'),
      },
      {
        id: 'user_2',
        steamId64: '76561198000000002',
        username: 'SkinMaster',
        avatar: 'https://avatars.steamstatic.com/avatar.jpg',
        acceptedTermsAt: new Date('2024-02-20T00:00:00Z'),
        kycStatus: 'verified',
        totalVolume: 2200000,
        xp: 11200,
        level: 14,
        tickets: 38,
        joinedAt: new Date('2024-02-20T00:00:00Z'),
      },
      {
        id: 'user_3',
        steamId64: '76561198000000003',
        username: 'CS2Collector',
        avatar: 'https://avatars.steamstatic.com/avatar.jpg',
        acceptedTermsAt: new Date('2024-03-10T00:00:00Z'),
        kycStatus: 'pending',
        totalVolume: 1950000,
        xp: 9800,
        level: 13,
        tickets: 42,
        joinedAt: new Date('2024-03-10T00:00:00Z'),
      },
    ];

    let filteredUsers = mockUsers;

    if (filters.status) {
      filteredUsers = filteredUsers.filter(user => user.kycStatus === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.username.toLowerCase().includes(searchLower) ||
        user.steamId64.toLowerCase().includes(searchLower) ||
        user.id.toLowerCase().includes(searchLower)
      );
    }

    const startIndex = ((filters.page || 1) - 1) * (filters.limit || 20);
    const endIndex = startIndex + (filters.limit || 20);
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return NextResponse.json({
      users: paginatedUsers,
      total: filteredUsers.length,
      page: filters.page || 1,
      limit: filters.limit || 20,
      totalPages: Math.ceil(filteredUsers.length / (filters.limit || 20)),
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
