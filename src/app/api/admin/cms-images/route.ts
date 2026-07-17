import { NextRequest, NextResponse } from 'next/server';
import { CmsImageUploadError, saveCmsImage } from '@/lib/cms-image-upload';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }

    const result = await saveCmsImage(file);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CmsImageUploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error uploading CMS image:', error);
    return NextResponse.json({ error: 'Erreur lors du téléversement de l\'image' }, { status: 500 });
  }
}
