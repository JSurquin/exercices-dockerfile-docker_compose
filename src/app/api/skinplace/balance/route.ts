import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { skinplaceService } from '@/lib/skinplace';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    logger.info('Skinplace balance API called');
    
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== 'ADMIN') {
      logger.warn('Unauthorized Skinplace balance access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Admin Skinplace balance access granted', { userId: session.user.id });

    // Récupérer le solde Skinplace
    const balance = await skinplaceService.getBalance();

    if (balance.status !== 'success') {
      logger.error('Failed to fetch Skinplace balance', balance);
      return NextResponse.json({
        success: false,
        error: 'Impossible de récupérer le solde Skinplace'
      }, { status: 500 });
    }

    logger.success('Skinplace balance fetched successfully', {
      total: balance.data.total,
      deposit: balance.data.deposit,
      hold: balance.data.hold
    });

    return NextResponse.json({
      success: true,
      data: {
        balance: balance.data.total,
        currency: 'EUR',
        available_balance: balance.data.deposit,
        pending_balance: balance.data.hold,
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error in Skinplace balance API', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}