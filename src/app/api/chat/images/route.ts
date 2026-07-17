import { NextRequest, NextResponse } from 'next/server';
import { ChatImageUploadError, saveChatImage } from '@/lib/chat-image-upload';
import { resolveChatIdentity } from '@/lib/require-admin';

export async function POST(request: NextRequest) {
  try {
    const identity = await resolveChatIdentity(request);
    if (identity.kind === 'invalid') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }

    const result = await saveChatImage(file);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ChatImageUploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error uploading chat image:', error);
    return NextResponse.json(
      { error: "Erreur lors du téléversement de l'image" },
      { status: 500 },
    );
  }
}
