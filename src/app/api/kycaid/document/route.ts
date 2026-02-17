import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { uploadFile, createDocument, deleteDocument, isIdentityDocumentType, KYCAID_IDENTITY_DOCUMENT_TYPES } from '@/lib/kycaid';
import { prisma } from '~/prisma/prisma';

/**
 * POST /api/kycaid/document
 * Upload un document (ID card, passport, etc.)
 */
export async function POST(request: NextRequest) {
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

    const documentType = formData.get('type') as string; // ID_CARD, PASSPORT, etc.
    const frontFile = formData.get('frontFile') as File | null;
    const backFile = formData.get('backFile') as File | null; // Optionnel (recto/verso)

    if (!documentType || !frontFile) {
      return NextResponse.json(
        { error: 'Type et fichier recto obligatoires' },
        { status: 400 }
      );
    }

    // Récupérer l'applicantId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kycaidApplicantId: true },
    });

    if (!user?.kycaidApplicantId) {
      return NextResponse.json(
        { error: 'Applicant KYCAID non trouvé' },
        { status: 400 }
      );
    }

    // KYCAID n'autorise qu'un seul document "identité" par applicant. Si un existe déjà (retry, remplacement), on le supprime puis on recrée.
    if (isIdentityDocumentType(documentType)) {
      const existing = await prisma.kycDocument.findFirst({
        where: {
          kycaidApplicantId: user.kycaidApplicantId,
          type: { in: [...KYCAID_IDENTITY_DOCUMENT_TYPES] },
        },
      });
      if (existing?.kycaidDocumentId) {
        try {
          await deleteDocument(existing.kycaidDocumentId);
        } catch {
          // ignore (404, etc.)
        }
        await prisma.kycFile.deleteMany({ where: { documentId: existing.id } });
        await prisma.kycDocument.delete({ where: { id: existing.id } });
      }
    }

    // Étape 1 : Upload le fichier recto
    console.log('[KYCAID Document] Upload du fichier recto...');
    const frontBuffer = Buffer.from(await frontFile.arrayBuffer());
    const frontFileObj = await uploadFile(
      frontBuffer,
      frontFile.name,
      frontFile.type
    );
    console.log(`[KYCAID Document] Recto uploadé : ${frontFileObj.file_id}`);

    // Étape 2 : Si verso, upload aussi
    let backFileId: string | undefined;
    if (backFile) {
      console.log('[KYCAID Document] Upload du fichier verso...');
      const backBuffer = Buffer.from(await backFile.arrayBuffer());
      const backFileObj = await uploadFile(
        backBuffer,
        backFile.name,
        backFile.type
      );
      backFileId = backFileObj.file_id;
      console.log(`[KYCAID Document] Verso uploadé : ${backFileId}`);
    }

    // Étape 3 : Créer le document KYCAID
    const document = await createDocument({
      applicant_id: user.kycaidApplicantId,
      type: documentType as any,
      front_side_id: frontFileObj.file_id,
      back_side_id: backFileId,
    });

    console.log(`[KYCAID Document] Document KYCAID créé : ${document.document_id}`);

    // Étape 4 : Sauvegarder en base
    const savedDoc = await prisma.kycDocument.create({
      data: {
        userId,
        type: documentType as any,
        status: 'PENDING',
        kycaidApplicantId: user.kycaidApplicantId,
        kycaidDocumentId: document.document_id,
      },
    });

    // Sauvegarder les fichiers
    await prisma.kycFile.create({
      data: {
        documentId: savedDoc.id,
        fileName: frontFile.name,
        fileType: frontFile.type,
        fileSize: frontFile.size,
        side: 'FRONT',
        kycaidFileId: frontFileObj.file_id,
        uploadedToKycaid: true,
      },
    });

    if (backFileId && backFile) {
      await prisma.kycFile.create({
        data: {
          documentId: savedDoc.id,
          fileName: backFile.name,
          fileType: backFile.type,
          fileSize: backFile.size,
          side: 'BACK',
          kycaidFileId: backFileId,
          uploadedToKycaid: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      document: savedDoc,
    });
  } catch (error) {
    console.error('[KYCAID Document] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload du document' },
      { status: 500 }
    );
  }
}
