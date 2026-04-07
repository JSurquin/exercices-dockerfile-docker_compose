import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || session.user.role !== 'ADMIN') {
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
