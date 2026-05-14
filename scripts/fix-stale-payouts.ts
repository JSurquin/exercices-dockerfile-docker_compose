import { PrismaClient, PayoutStatus } from '@prisma/client';

const prisma = new PrismaClient();

const DRY_RUN = !process.argv.includes('--fix');

const PAID_STATUSES: PayoutStatus[] = ['PAID', 'FLEXIFY_PAID', 'WHITEPAY_COMPLETE'];
const FAILED_STATUSES: PayoutStatus[] = ['FAILED', 'FLEXIFY_FAILED', 'WHITEPAY_DECLINED', 'CANCELLED'];
const FINAL_STATUSES: PayoutStatus[] = [...PAID_STATUSES, ...FAILED_STATUSES];

const DISPLAY_BUG_STATUSES: PayoutStatus[] = [
  'FLEXIFY_PAID',
  'FLEXIFY_FAILED',
  'WHITEPAY_COMPLETE',
  'WHITEPAY_DECLINED',
];

interface Mismatch {
  id: string;
  userId: string;
  currentStatus: string;
  correctStatus: string;
  amountCents: number;
  createdAt: Date;
  paidAt: Date | null;
  paymentMethodType: string;
  reason: string;
}

async function main() {
  console.log(`\n=== fix-stale-payouts (${DRY_RUN ? 'LECTURE SEULE' : 'MODE CORRECTION'}) ===\n`);

  const mismatches: Mismatch[] = [];

  // -----------------------------------------------------------------------
  // 1. Provider statuses that display wrong in the UI
  //    These have the right "provider final" status but it maps to "En attente"
  //    in the old badge function. We normalize them to PAID / FAILED.
  // -----------------------------------------------------------------------
  const displayBugged = await prisma.payout.findMany({
    where: { status: { in: DISPLAY_BUG_STATUSES } },
    include: { paymentMethod: true },
  });

  for (const p of displayBugged) {
    const correctStatus = PAID_STATUSES.includes(p.status) ? 'PAID' : 'FAILED';
    mismatches.push({
      id: p.id,
      userId: p.userId,
      currentStatus: p.status,
      correctStatus,
      amountCents: p.amountCents,
      createdAt: p.createdAt,
      paidAt: p.paidAt,
      paymentMethodType: p.paymentMethod.type,
      reason: `Statut provider "${p.status}" → normalisation vers "${correctStatus}"`,
    });
  }

  // -----------------------------------------------------------------------
  // 2. Payouts stuck in non-final status for > 7 days
  //    These likely had a missed webhook.
  // -----------------------------------------------------------------------
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const stuckPayouts = await prisma.payout.findMany({
    where: {
      status: { notIn: FINAL_STATUSES },
      createdAt: { lt: sevenDaysAgo },
    },
    include: { paymentMethod: true },
  });

  for (const p of stuckPayouts) {
    mismatches.push({
      id: p.id,
      userId: p.userId,
      currentStatus: p.status,
      correctStatus: '???',
      amountCents: p.amountCents,
      createdAt: p.createdAt,
      paidAt: p.paidAt,
      paymentMethodType: p.paymentMethod.type,
      reason: `Bloqué depuis ${p.createdAt.toISOString()} (> 7 jours) — vérifier manuellement chez le provider`,
    });
  }

  // -----------------------------------------------------------------------
  // 3. Payouts marked PAID but balance never debited
  // -----------------------------------------------------------------------
  const paidNotDebited = await prisma.payout.findMany({
    where: {
      status: { in: PAID_STATUSES },
      balanceDebitedAt: null,
    },
    include: { paymentMethod: true },
  });

  for (const p of paidNotDebited) {
    const alreadyInMismatches = mismatches.some(m => m.id === p.id);
    if (!alreadyInMismatches) {
      mismatches.push({
        id: p.id,
        userId: p.userId,
        currentStatus: p.status,
        correctStatus: 'PAID',
        amountCents: p.amountCents,
        createdAt: p.createdAt,
        paidAt: p.paidAt,
        paymentMethodType: p.paymentMethod.type,
        reason: `Payé mais balance non débitée (balanceDebitedAt = null)`,
      });
    }
  }

  // -----------------------------------------------------------------------
  // Report
  // -----------------------------------------------------------------------
  if (mismatches.length === 0) {
    console.log('Aucun décalage détecté.\n');
    await prisma.$disconnect();
    return;
  }

  console.log(`${mismatches.length} décalage(s) détecté(s) :\n`);
  for (const m of mismatches) {
    console.log(`  Payout ${m.id}`);
    console.log(`    user:     ${m.userId}`);
    console.log(`    méthode:  ${m.paymentMethodType}`);
    console.log(`    montant:  ${(m.amountCents / 100).toFixed(2)} €`);
    console.log(`    statut:   ${m.currentStatus} → ${m.correctStatus}`);
    console.log(`    créé:     ${m.createdAt.toISOString()}`);
    console.log(`    raison:   ${m.reason}`);
    console.log('');
  }

  // -----------------------------------------------------------------------
  // Apply fixes (only for status normalization, not stuck payouts)
  // -----------------------------------------------------------------------
  if (!DRY_RUN) {
    const fixable = mismatches.filter(m => m.correctStatus !== '???');
    console.log(`Application des corrections sur ${fixable.length} payout(s)...\n`);

    for (const m of fixable) {
      try {
        await prisma.payout.update({
          where: { id: m.id },
          data: {
            status: m.correctStatus as 'PAID' | 'FAILED',
            ...(m.correctStatus === 'PAID' && !m.paidAt ? { paidAt: new Date() } : {}),
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: m.userId,
            action: 'SCRIPT_PAYOUT_STATUS_FIX',
            details: {
              payoutId: m.id,
              previousStatus: m.currentStatus,
              newStatus: m.correctStatus,
              reason: m.reason,
            },
          },
        });

        console.log(`  ✓ ${m.id}: ${m.currentStatus} → ${m.correctStatus}`);
      } catch (err) {
        console.error(`  ✗ ${m.id}: ${err}`);
      }
    }

    const unfixable = mismatches.filter(m => m.correctStatus === '???');
    if (unfixable.length > 0) {
      console.log(`\n${unfixable.length} payout(s) nécessitent une vérification manuelle (pas de correction automatique).`);
    }
  } else {
    console.log('Mode lecture seule. Relancez avec --fix pour appliquer les corrections.\n');
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Erreur fatale:', err);
  prisma.$disconnect();
  process.exit(1);
});
