import { prisma } from './prisma/prisma';
import { initiateKyc, createAddress } from './src/lib/kycaid';

async function testKycFlow() {
  console.log('🧪 Test du flow KYC KYCAID...\n');

  try {
    // 1. Recuperer utilisateur de test
    console.log('1️⃣ Recuperation de utilisateur de test...');
    const user = await prisma.user.findUnique({
      where: { email: 'test@moonskin.com' },
    });

    if (!user) {
      console.error('❌ Utilisateur de test non trouvé');
      return;
    }
    console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id})\n`);

    // 2. Initier le KYC avec adresse (crée applicant + adresse + vérification)
    console.log('2️⃣ Initiation du KYC complet (applicant + adresse + verification)...');
    const result = await initiateKyc(user.id, {
      country: 'FR',
      city: 'Paris',
      postalCode: '75001',
      streetName: 'Rue de Rivoli',
      buildingNumber: '10',
    });
    console.log(`✅ KYC initié avec succès:`);
    console.log(`   - Applicant ID: ${result.applicantId}`);
    console.log(`   - Verification ID: ${result.verificationId}`);
    console.log(`   - Verification URL: ${result.verificationUrl}\n`);

    // 4. Vérifier la base de données
    console.log('4️⃣ Vérification de la base de données...');
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        kycDocuments: true,
        kycVerifications: true,
      },
    });

    // Récupérer les adresses séparément (pas de relation directe)
    const addresses = await prisma.kycAddress.findMany({
      where: { applicantId: updatedUser?.kycaidApplicantId ?? undefined },
    });

    console.log(`✅ Données utilisateur mises à jour:`);
    console.log(`   - KYC Status: ${updatedUser?.kycStatus}`);
    console.log(`   - Applicant ID: ${updatedUser?.kycaidApplicantId}`);
    console.log(`   - Adresses: ${addresses.length}`);
    console.log(`   - Documents: ${updatedUser?.kycDocuments.length ?? 0}`);
    console.log(`   - Vérifications: ${updatedUser?.kycVerifications.length ?? 0}\n`);

    console.log('✨ Test terminé avec succès!');
  } catch (error: any) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testKycFlow();
