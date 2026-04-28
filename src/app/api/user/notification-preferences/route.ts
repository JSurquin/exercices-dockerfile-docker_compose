import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth";
import { prisma } from "~/prisma/prisma";
import { safeParseJson } from "@/lib/validation/helpers";
import { notificationPreferencesPutSchema } from "@/lib/validation/schemas/user";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: session.user.id },
    });

    if (!preferences) {
      preferences = await prisma.notificationPreferences.create({
        data: {
          userId: session.user.id,
          emailNotifications: true,
          pushNotifications: false,
          tradeAlerts: true,
          payoutAlerts: true,
          kycAlerts: true,
          giveawayAlerts: true,
          missionAlerts: true,
          marketingEmails: false,
          securityAlerts: true,
          systemAnnouncements: true,
        },
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des préférences" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, notificationPreferencesPutSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const {
      emailNotifications,
      pushNotifications,
      tradeAlerts,
      payoutAlerts,
      kycAlerts,
      giveawayAlerts,
      missionAlerts,
      marketingEmails,
      securityAlerts,
      systemAnnouncements,
    } = parsed.data;

    const preferences = await prisma.notificationPreferences.upsert({
      where: { userId: session.user.id },
      update: {
        emailNotifications,
        pushNotifications,
        tradeAlerts,
        payoutAlerts,
        kycAlerts,
        giveawayAlerts,
        missionAlerts,
        marketingEmails,
        securityAlerts,
        systemAnnouncements,
      },
      create: {
        userId: session.user.id,
        emailNotifications: emailNotifications ?? true,
        pushNotifications: pushNotifications ?? false,
        tradeAlerts: tradeAlerts ?? true,
        payoutAlerts: payoutAlerts ?? true,
        kycAlerts: kycAlerts ?? true,
        giveawayAlerts: giveawayAlerts ?? true,
        missionAlerts: missionAlerts ?? true,
        marketingEmails: marketingEmails ?? false,
        securityAlerts: securityAlerts ?? true,
        systemAnnouncements: systemAnnouncements ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des préférences" },
      { status: 500 }
    );
  }
}
