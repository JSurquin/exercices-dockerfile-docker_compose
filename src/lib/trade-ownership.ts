import { prisma } from '~/prisma/prisma';

/**
 * Vérifie qu'un trade appartient bien à un utilisateur donné.
 * Retourne true si le trade existe et appartient à l'utilisateur, false sinon.
 * 
 * @param tradeId - ID du trade à vérifier
 * @param userId - ID de l'utilisateur propriétaire présumé
 * @returns Promise<boolean> - true si ownership validé, false sinon
 */
export async function assertTradeOwnership(
  tradeId: string,
  userId: string
): Promise<boolean> {
  if (!tradeId || !userId) {
    return false;
  }

  try {
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      select: { userId: true },
    });

    if (!trade) {
      return false;
    }

    return trade.userId === userId;
  } catch (error) {
    console.error('Error checking trade ownership:', error);
    return false;
  }
}

/**
 * Vérifie qu'un trade appartient à l'utilisateur, sinon lance une erreur.
 * À utiliser dans les routes qui doivent absolument valider l'ownership.
 * 
 * @param tradeId - ID du trade
 * @param userId - ID de l'utilisateur
 * @throws Error si le trade n'appartient pas à l'utilisateur
 */
export async function requireTradeOwnership(
  tradeId: string,
  userId: string
): Promise<void> {
  const isOwner = await assertTradeOwnership(tradeId, userId);
  
  if (!isOwner) {
    throw new Error('TRADE_OWNERSHIP_VIOLATION');
  }
}
