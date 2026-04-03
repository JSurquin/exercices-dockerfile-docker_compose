// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateKycData() {
  console.log('🔄 Migration des données KYC existantes...');

  try {
    // 1. Migrer providerId → kycaidApplicantId dans KycDocument
    console.log('📝 Étape 1: Migration des KycDocument...');
    const documents = await prisma.kycDocument.findMany();
    
    let docCount = 0;
    for (const doc of documents) {
      await prisma.kycDocument.update({
        where: { id: doc.id },
        data: {
          kycaidApplicantId: (doc as any).providerId, // Copier l'ancien champ
        },
      });
      docCount++;
    }
    console.log(`✅ ${docCount} documents migrés`);

    // 2. Synchroniser kycaidApplicantId dans User depuis KycDocument
    console.log('📝 Étape 2: Synchronisation des utilisateurs...');
    const users = await prisma.user.findMany({
      include: {
        kycDocuments: {
          take: 1,
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    let userCount = 0;
    for (const user of users) {
      if (user.kycDocuments.length > 0 && (user.kycDocuments[0] as any).providerId) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            kycaidApplicantId: (user.kycDocuments[0] as any).providerId,
          },
        });
        userCount++;
      }
    }
    console.log(`✅ ${userCount} utilisateurs synchronisés`);

    console.log('\n✅ Migration terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  }
}

migrateKycData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
