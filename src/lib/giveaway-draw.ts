import crypto from 'crypto';

export type UserEntryWeight = { userId: string; entries: number };

/**
 * Tirage pondéré sans remplacement : chaque utilisateur ne peut gagner qu’une fois.
 * Utilise HMAC-SHA256(seed, round) pour un tirage reproductible à partir du seed.
 */
export function pickWeightedUniqueWinners(
  rows: UserEntryWeight[],
  winnerCount: number,
  randomSeedHex: string
): string[] {
  const pool = rows
    .filter((r) => r.entries > 0)
    .map((r) => ({ userId: r.userId, weight: r.entries }));

  const winners: string[] = [];
  const seedBuf = Buffer.from(randomSeedHex, 'hex');
  if (seedBuf.length < 16) {
    throw new Error('Invalid random seed');
  }

  for (let round = 0; round < winnerCount && pool.length > 0; round++) {
    const total = pool.reduce((s, p) => s + p.weight, 0);
    if (total <= 0) break;

    const h = crypto.createHmac('sha256', seedBuf).update(`round:${round}`).digest();
    const pick = h.readUInt32BE(0) % total;

    let acc = 0;
    let chosenIdx = 0;
    for (let i = 0; i < pool.length; i++) {
      acc += pool[i].weight;
      if (pick < acc) {
        chosenIdx = i;
        break;
      }
    }

    const chosen = pool[chosenIdx];
    winners.push(chosen.userId);
    pool.splice(chosenIdx, 1);
  }

  return winners;
}

export function generateGiveawayRandomSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}
