import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { claimDailyLogin } from '@/lib/points-service';
import { prisma } from '~/prisma/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    const result = await claimDailyLogin(session.user.id);

    if (!result) {
      // Déjà réclamé aujourd'hui, renvoyer le statut actuel
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayLogin = await prisma.dailyLogin.findUnique({
        where: { userId_loginDate: { userId: session.user.id, loginDate: today } },
      });
      return NextResponse.json({
        alreadyClaimed: true,
        streak: todayLogin?.streak ?? 1,
      });
    }

    return NextResponse.json({ alreadyClaimed: false, ...result });
  } catch (error) {
    console.error('[user/daily-login] POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogin = await prisma.dailyLogin.findUnique({
      where: { userId_loginDate: { userId: session.user.id, loginDate: today } },
    });

    // Récupérer l'historique des 7 derniers jours
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLogins = await prisma.dailyLogin.findMany({
      where: {
        userId: session.user.id,
        loginDate: { gte: sevenDaysAgo },
      },
      orderBy: { loginDate: 'desc' },
    });

    return NextResponse.json({
      alreadyClaimed: !!todayLogin,
      currentStreak: todayLogin?.streak ?? 0,
      recentLogins,
    });
  } catch (error) {
    console.error('[user/daily-login] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
