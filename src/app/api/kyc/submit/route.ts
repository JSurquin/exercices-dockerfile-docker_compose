import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { 
  createApplicant, 
  createVerification, 
  uploadFile, 
  createDocument,
  createAddress
} from '@/lib/kycaid';
import { prisma } from '~/prisma/prisma';
import { emailService } from '@/lib/email';

/**
 * Mapper les types de documents du frontend vers les types KYCAID
 */
function mapDocumentTypeToKycaid(frontendType: string): string {
  const mapping: Record<string, string> = {
    'id_card': 'GOVERNMENT_ID',
    'ID_CARD': 'GOVERNMENT_ID',
    'passport': 'PASSPORT',
    'PASSPORT': 'PASSPORT',
    'driving_license': 'DRIVERS_LICENSE',
    'DRIVING_LICENSE': 'DRIVERS_LICENSE',
  };
  
  return mapping[frontendType] || 'GOVERNMENT_ID';
}

/**
 * POST /api/kyc/submit
 * Soumet un dossier KYC complet à KYCAID
 * 
 * Body (FormData):
 * - personalInfo: JSON string with firstName, lastName, dob, nationality, address, city, postalCode, country
 * - documentType: string (id_card, passport, driving_license)
 * - identityFile: File (document d'identité)
 * - identityBackFile: File (optionnel - verso)
 * - selfieFile: File
 * - addressFile: File (optionnel)
 * 
 * Flow KYCAID:
 * 1. Upload des fichiers → file_id
 * 2. Création des documents (GOVERNMENT_ID, SELFIE_IMAGE, ADDRESS_DOCUMENT)
 * 3. Création de la vérification → verification_id
 * 4. KYCAID traite automatiquement tous les documents
 * 5. Webhook reçu quand la vérification est terminée (approved/declined)
 */
export async function POST(request: NextRequest) {
  console.log('');
  console.log('='.repeat(80));
  console.log('🚀 [KYC SUBMIT] Début de la soumission KYC complète');
  console.log('='.repeat(80));

  try {
    // =========================================================================
    // ÉTAPE 1 : VÉRIFIER L'AUTHENTIFICATION
    // =========================================================================
    console.log('📋 [KYC SUBMIT] Étape 1/8 : Vérification de l\'authentification...');
    
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      console.error('❌ [KYC SUBMIT] Utilisateur non authentifié');
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log(`✅ [KYC SUBMIT] Utilisateur authentifié : ${userId}`);

    // =========================================================================
    // ÉTAPE 2 : RÉCUPÉRER ET VALIDER LES DONNÉES
    // =========================================================================
    console.log('📋 [KYC SUBMIT] Étape 2/8 : Récupération des données du formulaire...');
    
    const formData = await request.formData();
    
    const personalInfoStr = formData.get('personalInfo') as string;
    const documentType = formData.get('documentType') as string;
    const identityFile = formData.get('identityFile') as File | null;
    const identityBackFile = formData.get('identityBackFile') as File | null;
    const selfieFile = formData.get('selfieFile') as File | null;
    const addressFile = formData.get('addressFile') as File | null;

    // Mapper le type de document vers le format KYCAID
    const kycaidDocumentType = mapDocumentTypeToKycaid(documentType);

    console.log('📄 [KYC SUBMIT] Données reçues :');
    console.log(`  - Document Type (frontend): ${documentType}`);
    console.log(`  - Document Type (KYCAID): ${kycaidDocumentType}`);
    console.log(`  - Identity File: ${identityFile?.name || 'N/A'} (${identityFile?.size || 0} bytes)`);
    console.log(`  - Identity Back File: ${identityBackFile?.name || 'N/A'} (${identityBackFile?.size || 0} bytes)`);
    console.log(`  - Selfie File: ${selfieFile?.name || 'N/A'} (${selfieFile?.size || 0} bytes)`);
    console.log(`  - Address File: ${addressFile?.name || 'N/A'} (${addressFile?.size || 0} bytes)`);

    if (!personalInfoStr || !documentType || !identityFile || !selfieFile) {
      console.error('❌ [KYC SUBMIT] Données manquantes');
      return NextResponse.json(
        { error: 'Données incomplètes : informations personnelles, document d\'identité et selfie obligatoires' },
        { status: 400 }
      );
    }

    const personalInfo = JSON.parse(personalInfoStr);
    console.log('👤 [KYC SUBMIT] Informations personnelles :');
    console.log(`  - Nom: ${personalInfo.firstName} ${personalInfo.lastName}`);
    console.log(`  - Date de naissance: ${personalInfo.dateOfBirth}`);
    console.log(`  - Nationalité: ${personalInfo.nationality}`);
    console.log(`  - Adresse: ${personalInfo.address}, ${personalInfo.city} ${personalInfo.postalCode}, ${personalInfo.country}`);

    // =========================================================================
    // ÉTAPE 3 : VÉRIFIER SI KYC DÉJÀ EN COURS OU VÉRIFIÉ
    // =========================================================================
    console.log('📋 [KYC SUBMIT] Étape 3/8 : Vérification du statut actuel...');
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        kycStatus: true, 
        email: true, 
        name: true,
        kycaidApplicantId: true,
      },
    });

    if (!user) {
      console.error('❌ [KYC SUBMIT] Utilisateur non trouvé en base');
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    console.log(`📊 [KYC SUBMIT] Statut KYC actuel : ${user.kycStatus}`);

    if (user.kycStatus === 'VERIFIED' || user.kycStatus === 'KYCAID_VERIFIED') {
      console.log('✅ [KYC SUBMIT] KYC déjà vérifié, arrêt du processus');
      return NextResponse.json({
        success: true,
        status: 'VERIFIED',
        message: 'Votre identité est déjà vérifiée',
      });
    }

    // =========================================================================
    // ÉTAPE 4 : CRÉER OU RÉCUPÉRER L'APPLICANT KYCAID
    // =========================================================================
    console.log('📋 [KYC SUBMIT] Étape 4/8 : Création/récupération de l\'applicant KYCAID...');
    
    let applicantId = user.kycaidApplicantId;

    if (!applicantId) {
      console.log('🆕 [KYC SUBMIT] Création d\'un nouvel applicant KYCAID...');
      const applicant = await createApplicant({
        userId,
        email: user.email,
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        dob: personalInfo.dateOfBirth,
        residenceCountry: personalInfo.country,
      });

      applicantId = applicant.applicant_id;
      console.log(`✅ [KYC SUBMIT] Applicant créé : ${applicantId}`);

      // Mettre à jour l'utilisateur avec l'applicantId
      await prisma.user.update({
        where: { id: userId },
        data: { kycaidApplicantId: applicantId },
      });
      console.log('💾 [KYC SUBMIT] ApplicantId sauvegardé en base');
    } else {
      console.log(`✅ [KYC SUBMIT] Applicant existant : ${applicantId}`);
    }

    // =========================================================================
    // ÉTAPE 5 : CRÉER L'ADRESSE (si elle n'existe pas déjà)
    // =========================================================================
    console.log('📋 [KYC SUBMIT] Étape 5/8 : Vérification/Ajout de l\'adresse...');
    
    // Vérifier si une adresse REGISTERED existe déjà
    const existingAddress = await prisma.kycAddress.findFirst({
      where: {
        applicantId,
        type: 'REGISTERED',
      },
    });

    if (existingAddress) {
      console.log(`✅ [KYC SUBMIT] Adresse REGISTERED existe déjà : ${existingAddress.kycaidAddressId}`);
    } else {
      try {
        const addressData = await createAddress({
          applicant_id: applicantId,
          type: 'REGISTERED',
          country: personalInfo.country,
          city: personalInfo.city,
          postal_code: personalInfo.postalCode,
          street_name: personalInfo.address,
          building_number: '', // On peut améliorer le parsing de l'adresse
        });

        console.log(`✅ [KYC SUBMIT] Adresse créée : ${addressData.address_id}`);

        // Sauvegarder en base
        await prisma.kycAddress.create({
          data: {
            applicantId,
            type: 'REGISTERED',
            country: personalInfo.country,
            city: personalInfo.city,
            postalCode: personalInfo.postalCode,
            streetName: personalInfo.address,
            buildingNumber: '',
            kycaidAddressId: addressData.address_id,
          },
        });
        console.log('💾 [KYC SUBMIT] Adresse sauvegardée en base');
      } catch (error: any) {
        // Si l'erreur indique que l'adresse existe déjà, ce n'est pas grave
        if (error.message?.includes('already exists')) {
          console.log('ℹ️  [KYC SUBMIT] Adresse REGISTERED existe déjà dans KYCAID');
        } else {
          console.warn('⚠️  [KYC SUBMIT] Erreur lors de la création de l\'adresse (non bloquant) :', error);
        }
      }
    }

    // =========================================================================
    // ÉTAPE 6 : UPLOADER LES DOCUMENTS
    // =========================================================================
    console.log('📋 [KYC SUBMIT] Étape 6/8 : Upload des documents...');
    
    // 6.1 - Document d'identité (recto)
    console.log('📄 [KYC SUBMIT] 6.1 - Upload du document d\'identité (recto)...');
    const frontBuffer = Buffer.from(await identityFile.arrayBuffer());
    const frontFileObj = await uploadFile(
      frontBuffer,
      identityFile.name,
      identityFile.type
    );
    console.log(`  ✓ Fichier uploadé : ${identityFile.name} (${identityFile.size} bytes) → file_id: ${frontFileObj.file_id}`);

    // 6.2 - Document d'identité (verso si présent)
    let backFileId: string | undefined;
    if (identityBackFile) {
      console.log('📄 [KYC SUBMIT] 6.2 - Upload du document d\'identité (verso)...');
      const backBuffer = Buffer.from(await identityBackFile.arrayBuffer());
      const backFileObj = await uploadFile(
        backBuffer,
        identityBackFile.name,
        identityBackFile.type
      );
      backFileId = backFileObj.file_id;
      console.log(`  ✓ Fichier uploadé : ${identityBackFile.name} (${identityBackFile.size} bytes) → file_id: ${backFileId}`);
    }

    // 6.3 - Créer le document d'identité dans KYCAID
    console.log('📄 [KYC SUBMIT] 6.3 - Création du document d\'identité dans KYCAID...');
    console.log(`  → Type KYCAID: ${kycaidDocumentType}`);
    const document = await createDocument({
      applicant_id: applicantId,
      type: kycaidDocumentType,
      front_side_id: frontFileObj.file_id,
      back_side_id: backFileId,
    });
    console.log(`✅ [KYC SUBMIT] Document créé : ${document.document_id}`);

    // Sauvegarder en base
    const savedDoc = await prisma.kycDocument.create({
      data: {
        userId,
        type: kycaidDocumentType as any,
        status: 'PENDING',
        kycaidApplicantId: applicantId,
        kycaidDocumentId: document.document_id,
      },
    });
    console.log(`💾 [KYC SUBMIT] Document sauvegardé en base : ${savedDoc.id}`);

    // Sauvegarder les fichiers
    await prisma.kycFile.createMany({
      data: [
        {
          documentId: savedDoc.id,
          fileName: identityFile.name,
          fileType: identityFile.type,
          fileSize: identityFile.size,
          side: 'FRONT',
          kycaidFileId: frontFileObj.file_id,
          uploadedToKycaid: true,
        },
        ...(backFileId && identityBackFile ? [{
          documentId: savedDoc.id,
          fileName: identityBackFile.name,
          fileType: identityBackFile.type,
          fileSize: identityBackFile.size,
          side: 'BACK' as const,
          kycaidFileId: backFileId,
          uploadedToKycaid: true,
        }] : []),
      ],
    });
    console.log('💾 [KYC SUBMIT] Fichiers sauvegardés en base');

    // 6.4 - Selfie
    console.log('📄 [KYC SUBMIT] 6.4 - Upload du selfie...');
    const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer());
    const selfieFileObj = await uploadFile(
      selfieBuffer,
      selfieFile.name,
      selfieFile.type
    );
    console.log(`  ✓ Fichier uploadé : ${selfieFile.name} (${selfieFile.size} bytes) → file_id: ${selfieFileObj.file_id}`);

    // Créer le document selfie
    const selfieDoc = await createDocument({
      applicant_id: applicantId,
      type: 'SELFIE_IMAGE',
      front_side_id: selfieFileObj.file_id,
    });
    console.log(`✅ [KYC SUBMIT] Selfie créé : ${selfieDoc.document_id}`);

    const savedSelfieDoc = await prisma.kycDocument.create({
      data: {
        userId,
        type: 'SELFIE_IMAGE' as any,
        status: 'PENDING',
        kycaidApplicantId: applicantId,
        kycaidDocumentId: selfieDoc.document_id,
      },
    });

    await prisma.kycFile.create({
      data: {
        documentId: savedSelfieDoc.id,
        fileName: selfieFile.name,
        fileType: selfieFile.type,
        fileSize: selfieFile.size,
        side: 'SELFIE',
        kycaidFileId: selfieFileObj.file_id,
        uploadedToKycaid: true,
      },
    });
    console.log('💾 [KYC SUBMIT] Selfie sauvegardé en base');

    // 6.5 - Justificatif de domicile (optionnel)
    if (addressFile) {
      console.log('📄 [KYC SUBMIT] 6.5 - Upload du justificatif de domicile...');
      const addressBuffer = Buffer.from(await addressFile.arrayBuffer());
      const addressFileObj = await uploadFile(
        addressBuffer,
        addressFile.name,
        addressFile.type
      );
      console.log(`  ✓ Fichier uploadé : ${addressFile.name} (${addressFile.size} bytes) → file_id: ${addressFileObj.file_id}`);

      const addressDoc = await createDocument({
        applicant_id: applicantId,
        type: 'ADDRESS_DOCUMENT',
        front_side_id: addressFileObj.file_id,
      });
      console.log(`✅ [KYC SUBMIT] Justificatif créé : ${addressDoc.document_id}`);

      const savedAddressDoc = await prisma.kycDocument.create({
        data: {
          userId,
          type: 'ADDRESS_DOCUMENT' as any,
          status: 'PENDING',
          kycaidApplicantId: applicantId,
          kycaidDocumentId: addressDoc.document_id,
        },
      });

      await prisma.kycFile.create({
        data: {
          documentId: savedAddressDoc.id,
          fileName: addressFile.name,
          fileType: addressFile.type,
          fileSize: addressFile.size,
          side: 'PROOF',
          kycaidFileId: addressFileObj.file_id,
          uploadedToKycaid: true,
        },
      });
      console.log('💾 [KYC SUBMIT] Justificatif sauvegardé en base');
    }

    // =========================================================================
    // ÉTAPE 7 : CRÉER LA VÉRIFICATION KYCAID
    // =========================================================================
    // Note: La création de la vérification démarre automatiquement le processus
    // de vérification. KYCAID va analyser tous les documents uploadés de manière
    // asynchrone et enverra un webhook avec le résultat.
    console.log('📋 [KYC SUBMIT] Étape 7/8 : Création de la vérification...');
    
    const verification = await createVerification({
      applicantId,
      externalApplicantId: userId,
    });
    console.log(`✅ [KYC SUBMIT] Vérification créée : ${verification.verification_id}`);
    console.log(`📝 [KYC SUBMIT] Form URL : ${verification.form_url}`);

    // Sauvegarder la vérification en base
    await prisma.kycVerification.create({
      data: {
        userId,
        kycaidVerificationId: verification.verification_id,
        kycaidApplicantId: applicantId,
        status: 'PENDING',
        formUrl: verification.form_url,
      },
    });
    console.log('💾 [KYC SUBMIT] Vérification sauvegardée en base');

    // =========================================================================
    // La vérification est automatiquement traitée par KYCAID
    // =========================================================================
    console.log('✅ [KYC SUBMIT] Vérification créée et en cours de traitement automatique');
    console.log('ℹ️  [KYC SUBMIT] KYCAID traite maintenant les documents de manière asynchrone');
    console.log('ℹ️  [KYC SUBMIT] Vous recevrez un webhook quand la vérification sera terminée');

    // =========================================================================
    // ÉTAPE 8 : METTRE À JOUR LE STATUT UTILISATEUR
    // =========================================================================
    console.log('📋 [KYC SUBMIT] Étape 8/9 : Mise à jour du statut utilisateur...');
    
    await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: 'IN_PROGRESS' },
    });
    console.log('✅ [KYC SUBMIT] Statut utilisateur mis à jour : IN_PROGRESS');

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'KYC_SUBMITTED',
        details: {
          applicantId,
          verificationId: verification.verification_id,
          documentsUploaded: {
            identity: identityFile.name,
            identityBack: identityBackFile?.name,
            selfie: selfieFile.name,
            address: addressFile?.name,
          },
        },
      },
    });
    console.log('💾 [KYC SUBMIT] Log d\'audit créé');

    // =========================================================================
    // ÉTAPE 9 : ENVOYER L'EMAIL DE CONFIRMATION
    // =========================================================================
    console.log('📋 [KYC SUBMIT] Étape 9/9 : Envoi de l\'email de confirmation...');
    
    try {
      // Récupérer les infos utilisateur pour l'email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          steamUsername: true,
        },
      });

      if (user?.email) {
        const submissionDate = new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        await emailService.sendKycSubmittedConfirmation(
          user.email,
          user.steamUsername || 'Utilisateur',
          submissionDate
        );
        console.log(`✅ [KYC SUBMIT] Email de confirmation envoyé à ${user.email}`);
      } else {
        console.warn('⚠️  [KYC SUBMIT] Impossible d\'envoyer l\'email : email utilisateur non trouvé');
      }
    } catch (emailError: any) {
      // L'erreur d'email ne doit pas bloquer la soumission KYC
      console.error('⚠️  [KYC SUBMIT] Erreur lors de l\'envoi de l\'email (non bloquant) :', emailError.message);
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('✨ [KYC SUBMIT] SOUMISSION KYC TERMINÉE AVEC SUCCÈS');
    console.log('='.repeat(80));
    console.log('');

    return NextResponse.json({
      success: true,
      status: 'IN_PROGRESS',
      verificationId: verification.verification_id,
      formUrl: verification.form_url,
      message: 'Votre dossier KYC a été soumis avec succès. La vérification est en cours.',
    });

  } catch (error: any) {
    console.error('');
    console.error('💥'.repeat(40));
    console.error('❌ [KYC SUBMIT] ERREUR CRITIQUE');
    console.error('💥'.repeat(40));
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('💥'.repeat(40));
    console.error('');

    return NextResponse.json(
      { 
        error: 'Erreur lors de la soumission du KYC',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
