import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await emailService.reload();
    const result = await emailService.testConnection();

    if (result.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.message }, { status: 422 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('SMTP test error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
