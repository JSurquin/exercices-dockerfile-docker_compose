import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ filename: string }>;
}

function isSafeFilename(filename: string): boolean {
  return /^[a-f0-9-]+\.(jpg|jpeg|png|webp|gif)$/i.test(filename);
}

/** Compatibilité avec les anciennes URLs /uploads/cms/* enregistrées en base. */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { filename } = await params;
  if (!isSafeFilename(filename)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.redirect(new URL(`/api/cms-media/${filename}`, request.url), 307);
}
