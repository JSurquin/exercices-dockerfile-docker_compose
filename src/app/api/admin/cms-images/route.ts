import { NextRequest, NextResponse } from 'next/server';
import { isCmsImageUploadError, saveCmsImage } from '@/lib/cms-image-upload';
import { requireAdminOrModeratorSessionWithDbCheck } from '@/lib/require-admin';

export const runtime = 'nodejs';

function getUploadFile(formData: FormData): File | null {
  const entry = formData.get('file');
  if (!entry || typeof entry !== 'object' || !('arrayBuffer' in entry)) {
    return null;
  }
  return entry as File;
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminOrModeratorSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = getUploadFile(formData);

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }

    const result = await saveCmsImage(file);
    return NextResponse.json(result);
  } catch (error) {
    if (isCmsImageUploadError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error uploading CMS image:', error);
    return NextResponse.json({ error: 'Erreur lors du téléversement de l\'image' }, { status: 500 });
  }
}
