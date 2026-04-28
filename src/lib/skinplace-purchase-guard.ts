import { skinplaceService } from '@/lib/skinplace';

const PAGE_SIZE = 50;
const MAX_SCAN_PAGES = 10;

/**
 * Vérifie qu'un `purchase_id` apparaît dans l'historique d'achat filtré par notre `customId` (souvent l’id utilisateur).
 * Limite l’IDOR sur GET /purchase/items.
 */
export async function assertPurchaseIdBelongsToCustomId(
  purchaseId: string,
  customId: string
): Promise<boolean> {
  for (let page = 1; page <= MAX_SCAN_PAGES; page++) {
    const res = await skinplaceService.getPurchaseHistory(
      page,
      PAGE_SIZE,
      customId,
      false
    );
    if (res.status !== 'success' || !res.data?.length) {
      return false;
    }
    for (const row of res.data) {
      if (row.id === purchaseId || row.reference_id === purchaseId) {
        return true;
      }
    }
    if (res.data.length < PAGE_SIZE) {
      break;
    }
  }
  return false;
}
