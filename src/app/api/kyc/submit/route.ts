import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';

export const maxDuration = 60;
import { 
  createApplicant, 
  createVerification, 
  uploadFile, 
  createDocument,
  createAddress,
  deleteExistingIdentityDocumentsInKycaid,
  isIdentityDocumentType,
  KYCAID_IDENTITY_DOCUMENT_TYPES,
} from '@/lib/kycaid';
import { prisma } from '~/prisma/prisma';
import { emailService } from '@/lib/email';
import { encrypt } from '@/lib/encryption';
import { logger } from '@/lib/logger';

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
  logger.info('[KYC SUBMIT] Starting KYC submission');

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const formData = await request.formData();
    
    const personalInfoStr = formData.get('personalInfo') as string;
    const documentType = formData.get('documentType') as string;
    const identityFile = formData.get('identityFile') as File | null;
    const identityBackFile = formData.get('identityBackFile') as File | null;
    const selfieFile = formData.get('selfieFile') as File | null;
    const addressFile = formData.get('addressFile') as File | null;

    const kycaidDocumentType = mapDocumentTypeToKycaid(documentType);

    if (!personalInfoStr || !documentType || !identityFile || !selfieFile) {
      return NextResponse.json(
        { error: 'Données incomplètes : informations personnelles, document d\'identité et selfie obligatoires' },
        { status: 400 }
      );
    }

    const personalInfo = JSON.parse(personalInfoStr);

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
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (user.kycStatus === 'VERIFIED' || user.kycStatus === 'KYCAID_VERIFIED') {
      return NextResponse.json({
        success: true,
        status: 'VERIFIED',
        message: 'Votre identité est déjà vérifiée',
      });
    }

    // Anti-spam : bloquer si une soumission KYC est déjà en cours (< 5 min)
    const recentPending = await prisma.kycVerification.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'UNUSED'] },
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentPending) {
      return NextResponse.json(
        {
          error: 'Une vérification KYC est déjà en cours. Veuillez patienter avant de réessayer.',
          status: 'IN_PROGRESS',
        },
        { status: 429 }
      );
    }

    let applicantId = user.kycaidApplicantId;

    if (!applicantId) {
      const applicant = await createApplicant({
        userId,
        email: user.email,
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        dob: personalInfo.dateOfBirth,
        residenceCountry: personalInfo.country,
      });

      applicantId = applicant.applicant_id;

      await prisma.user.update({
        where: { id: userId },
        data: { kycaidApplicantId: applicantId },
      });
    }

    const existingAddress = await prisma.kycAddress.findFirst({
      where: {
        applicantId,
        type: 'REGISTERED',
      },
    });

    if (!existingAddress) {
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

        await prisma.kycAddress.create({
          data: {
            applicantId,
            type: 'REGISTERED',
            country: String(personalInfo.country ?? ''),
            city: encrypt(String(personalInfo.city ?? '')),
            postalCode: encrypt(String(personalInfo.postalCode ?? '')),
            streetName: encrypt(String(personalInfo.address ?? '')),
            buildingNumber: encrypt(''),
            unitNumber: null,
            kycaidAddressId: addressData.address_id,
          },
        });
      } catch (error: any) {
        if (!error.message?.includes('already exists')) {
          logger.warn('[KYC SUBMIT] Address creation failed (non-blocking)');
        }
      }
    }

    const frontBuffer = Buffer.from(await identityFile.arrayBuffer());
    const frontFileObj = await uploadFile(
      frontBuffer,
      identityFile.name,
      identityFile.type
    );

    let backFileId: string | undefined;
    if (identityBackFile) {
      const backBuffer = Buffer.from(await identityBackFile.arrayBuffer());
      const backFileObj = await uploadFile(
        backBuffer,
        identityBackFile.name,
        identityBackFile.type
      );
      backFileId = backFileObj.file_id;
    }

    if (isIdentityDocumentType(kycaidDocumentType)) {
      const { stillPresent } = await deleteExistingIdentityDocumentsInKycaid(applicantId);
      if (stillPresent.length > 0) {
        logger.error('[KYC SUBMIT] Identity documents still present after cleanup');
        return NextResponse.json(
          {
            error: 'Un document d\'identité existe déjà chez KYCAID et n\'a pas pu être supprimé. Contactez le support avec l\'ID: ' + stillPresent[0],
            code: 'IDENTITY_DOCUMENT_BLOCKED',
            duplicateDocumentIds: stillPresent,
          },
          { status: 400 }
        );
      }
      const localIdentity = await prisma.kycDocument.findMany({
        where: { kycaidApplicantId: applicantId, type: { in: [...KYCAID_IDENTITY_DOCUMENT_TYPES] } },
      });
      for (const doc of localIdentity) {
        await prisma.kycFile.deleteMany({ where: { documentId: doc.id } });
        await prisma.kycDocument.delete({ where: { id: doc.id } });
      }
    }

    let documentId: string;
    try {
      const document = await createDocument({
        applicant_id: applicantId,
        type: kycaidDocumentType,
        front_side_id: frontFileObj.file_id,
        back_side_id: backFileId,
      });
      documentId = document.document_id;
    } catch (err: unknown) {
      const data = (err as { data?: { duplicate_document_ids?: string[]; type?: string } }).data;
      const ids = data?.duplicate_document_ids;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('422') && (data?.type === 'limit_exceeded' || ids?.length) && ids?.[0]) {
        // En prod la liste/delete peut échouer ou renvoyer vide → on reçoit 422. On réutilise le document existant.
        documentId = ids[0];
      } else {
        throw err;
      }
    }

    // Sauvegarder en base (ou mettre à jour si on a réutilisé un document existant)
    let savedDoc = await prisma.kycDocument.findFirst({
      where: { kycaidDocumentId: documentId, userId },
    });
    if (savedDoc) {
      await prisma.kycDocument.update({
        where: { id: savedDoc.id },
        data: { status: 'PENDING', type: kycaidDocumentType as any },
      });
      await prisma.kycFile.deleteMany({ where: { documentId: savedDoc!.id } });
    } else {
      savedDoc = await prisma.kycDocument.create({
        data: {
          userId,
          type: kycaidDocumentType as any,
          status: 'PENDING',
          kycaidApplicantId: applicantId,
          kycaidDocumentId: documentId,
        },
      });
    }

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

    const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer());
    const selfieFileObj = await uploadFile(
      selfieBuffer,
      selfieFile.name,
      selfieFile.type
    );

    const selfieDoc = await createDocument({
      applicant_id: applicantId,
      type: 'SELFIE_IMAGE',
      front_side_id: selfieFileObj.file_id,
    });

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

    if (addressFile) {
      const addressBuffer = Buffer.from(await addressFile.arrayBuffer());
      const addressFileObj = await uploadFile(
        addressBuffer,
        addressFile.name,
        addressFile.type
      );

      const addressDoc = await createDocument({
        applicant_id: applicantId,
        type: 'ADDRESS_DOCUMENT',
        front_side_id: addressFileObj.file_id,
      });

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
    }

    const verification = await createVerification({
      applicantId,
      externalApplicantId: userId,
    });

    await prisma.kycVerification.create({
      data: {
        userId,
        kycaidVerificationId: verification.verification_id,
        kycaidApplicantId: applicantId,
        status: 'PENDING',
        formUrl: verification.form_url,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: 'IN_PROGRESS' },
    });

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

    try {
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
      }
    } catch (emailError: any) {
      logger.warn('[KYC SUBMIT] Email sending failed (non-blocking)');
    }

    logger.success('[KYC SUBMIT] KYC submission completed');

    return NextResponse.json({
      success: true,
      status: 'IN_PROGRESS',
      verificationId: verification.verification_id,
      formUrl: verification.form_url,
      message: 'Votre dossier KYC a été soumis avec succès. La vérification est en cours.',
    });

  } catch (error: any) {
    logger.error('[KYC SUBMIT] Critical error', error);

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
