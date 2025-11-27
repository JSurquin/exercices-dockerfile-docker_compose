import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { skinplaceService } from '@/lib/skinplace';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    logger.info('Skinplace hold API called');
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== 'ADMIN') {
      logger.warn('Unauthorized Skinplace hold access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Admin Skinplace hold access granted', { userId: session.user.id });

    // Récupérer les hold orders Skinplace
    const hold = await skinplaceService.getHoldOrders();

    if (hold.status !== 'success') {
      logger.error('Failed to fetch Skinplace hold orders', hold);
      return NextResponse.json({
        success: false,
        error: 'Impossible de récupérer les hold orders Skinplace'
      }, { status: 500 });
    }

    logger.success('Skinplace hold orders fetched successfully', {
      orders: hold.data?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: {
        orders: hold.data || [],
        total_value: 0,
        total_orders: hold.data?.length || 0
      }
    });

  } catch (error) {
    logger.error('Error in Skinplace hold API', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}