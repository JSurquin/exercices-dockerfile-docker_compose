import { NextRequest, NextResponse } from 'next/server';
import {
  getChatUploadFile,
  isChatImageUploadError,
  saveChatImage,
} from '@/lib/chat-image-upload';
import { resolveChatIdentity } from '@/lib/require-admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const identity = await resolveChatIdentity(request);
    if (identity.kind === 'invalid') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = getChatUploadFile(formData);

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }

    const result = await saveChatImage(file);
    return NextResponse.json(result);
  } catch (error) {
    if (isChatImageUploadError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Error uploading chat image:', error);
    return NextResponse.json(
      { error: "Erreur lors du téléversement de l'image" },
      { status: 500 },
    );
  }
}
