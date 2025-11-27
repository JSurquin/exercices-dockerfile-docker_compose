import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { skinplaceService } from '@/lib/skinplace';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    logger.info('Skinplace history API called');
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== 'ADMIN') {
      logger.warn('Unauthorized Skinplace history access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Admin Skinplace history access granted', { userId: session.user.id });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Récupérer l'historique Skinplace
    const history = await skinplaceService.getInstantHistory(page, limit);

    if (history.status !== 'success') {
      logger.error('Failed to fetch Skinplace history', history);
      return NextResponse.json({
        success: false,
        error: 'Impossible de récupérer l\'historique Skinplace'
      }, { status: 500 });
    }

    logger.success('Skinplace history fetched successfully', {
      items: history.data?.length || 0,
      page,
      limit
    });

    return NextResponse.json({
      success: true,
      data: {
        items: history.data || [],
        total_items: history.data?.length || 0,
        page: page,
        limit: limit,
        has_more: (history.data?.length || 0) >= limit
      }
    });

  } catch (error) {
    logger.error('Error in Skinplace history API', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}