import { createApplicant, createAddress, createFile, uploadFile, createDocument, createVerification } from '../src/lib/kycaid';
import fs from 'fs';

async function testCompleteKycFlow() {
  console.log('🧪 Test du flow KYC complet\n');

  try {
    // 1. Créer un applicant
    console.log('1️⃣ Création de l\'applicant...');
    const applicant = await createApplicant({
      userId: 'test-user-123',
      email: 'test@example.com',
      firstName: 'Jean',
      lastName: 'Dupont',
      dob: '1990-01-01',
      residenceCountry: 'FR',
    });
    console.log('✅ Applicant créé:', applicant.applicant_id);

    // 2. Créer une adresse
    console.log('\n2️⃣ Création de l\'adresse...');
    const address = await createAddress({
      applicant_id: applicant.applicant_id,
      type: 'REGISTERED',
      country: 'FR',
      city: 'Paris',
      postal_code: '75001',
      street_name: 'Rue de Rivoli',
      building_number: '1',
    });
    console.log('✅ Adresse créée:', address.address_id);

    // 3. Upload un document (simulé)
    console.log('\n3️⃣ Upload d\'un document...');
    const fileObj = await createFile();
    console.log('✅ File object créé:', fileObj.file_id);

    // NOTE : Pour un vrai test, charger un fichier réel
    // const fileBuffer = fs.readFileSync('./test-id-card.jpg');
    // await uploadFile(fileObj.file_id, fileBuffer, 'id-card.jpg', 'image/jpeg');
    console.log('⚠️  Upload de fichier réel non effectué (simulé)');

    // 4. Créer le document
    console.log('\n4️⃣ Création du document...');
    const document = await createDocument({
      applicant_id: applicant.applicant_id,
      type: 'ID_CARD',
      front_side_id: fileObj.file_id,
    });
    console.log('✅ Document créé:', document.document_id);

    // 5. Créer une vérification
    console.log('\n5️⃣ Création de la vérification...');
    const verification = await createVerification({
      applicantId: applicant.applicant_id,
      externalApplicantId: 'test-user-123',
    });
    console.log('✅ Vérification créée:', verification.verification_id);
    console.log('📝 URL du formulaire:', verification.form_url);

    console.log('\n✅ Test complet réussi !');
    console.log('\n📊 Résumé :');
    console.log(`   - Applicant ID: ${applicant.applicant_id}`);
    console.log(`   - Address ID: ${address.address_id}`);
    console.log(`   - Document ID: ${document.document_id}`);
    console.log(`   - Verification ID: ${verification.verification_id}`);
    console.log(`\n🔗 Ouvrez cette URL pour compléter la vérification :`);
    console.log(`   ${verification.form_url}`);
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Fonction pour tester uniquement la création d'un applicant
async function testApplicantCreation() {
  console.log('🧪 Test de création d\'applicant simple\n');
  
  try {
    const applicant = await createApplicant({
      userId: `test-user-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      dob: '1995-05-15',
      residenceCountry: 'FR',
    });
    
    console.log('✅ Applicant créé avec succès !');
    console.log('   ID:', applicant.applicant_id);
    console.log('   Type:', applicant.type);
    console.log('   Email:', applicant.email);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

// Fonction pour tester la création d'une adresse
async function testAddressCreation(applicantId: string) {
  console.log('🧪 Test de création d\'adresse\n');
  
  try {
    const address = await createAddress({
      applicant_id: applicantId,
      type: 'REGISTERED',
      country: 'FR',
      city: 'Lyon',
      postal_code: '69001',
      street_name: 'Rue de la République',
      building_number: '10',
      unit_number: 'Apt 5',
    });
    
    console.log('✅ Adresse créée avec succès !');
    console.log('   ID:', address.address_id);
    console.log('   Type:', address.type);
    console.log('   Ville:', address.city);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

// Exécution
const testType = process.argv[2] || 'full';

switch (testType) {
  case 'full':
    testCompleteKycFlow();
    break;
  case 'applicant':
    testApplicantCreation();
    break;
  case 'address':
    const applicantId = process.argv[3];
    if (!applicantId) {
      console.error('❌ Veuillez fournir un applicant_id comme argument');
      console.log('Usage: npm run test:kyc address <applicant_id>');
      process.exit(1);
    }
    testAddressCreation(applicantId);
    break;
  default:
    console.log('Usage:');
    console.log('  npm run test:kyc full       - Test complet du flow');
    console.log('  npm run test:kyc applicant  - Test création applicant seulement');
    console.log('  npm run test:kyc address <applicant_id> - Test création adresse');
}
