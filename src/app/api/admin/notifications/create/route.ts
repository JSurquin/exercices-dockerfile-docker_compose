import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/prisma/prisma";
import { safeParseJson } from '@/lib/validation/helpers';
import { adminNotificationCreateSchema } from '@/lib/validation/schemas/admin-bodies';
import { requireAdminOrModeratorSessionWithDbCheck } from '@/lib/require-admin';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminOrModeratorSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, adminNotificationCreateSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const {
      type,
      priority = "NORMAL",
      titleFr,
      titleEn,
      messageFr,
      messageEn,
      titleCn,
      messageCn,
      link,
      metadata,
      userIds,
      targetAllUsers = false,
      expiresAt,
    } = parsed.data as Record<string, any>;

    if (!type || !titleFr || !titleEn || !messageFr || !messageEn) {
      return NextResponse.json(
        {
          error:
            "type, titleFr, titleEn, messageFr et messageEn sont requis",
        },
        { status: 400 }
      );
    }

    let targetUsers: string[] = [];

    if (targetAllUsers) {
      const allUsers = await prisma.user.findMany({
        select: { id: true },
      });
      targetUsers = allUsers.map((u) => u.id);
    } else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      targetUsers = userIds;
    } else {
      return NextResponse.json(
        {
          error:
            "Vous devez spécifier targetAllUsers: true ou fournir une liste d'userIds",
        },
        { status: 400 }
      );
    }

    const notifications = await prisma.notification.createMany({
      data: targetUsers.map((userId) => ({
        userId,
        type,
        priority,
        titleFr,
        titleEn,
        messageFr,
        messageEn,
        titleCn,
        messageCn,
        link,
        metadata,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: session.user.id,
      })),
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "NOTIFICATION_CREATED",
        details: {
          type,
          priority,
          targetAllUsers,
          userCount: targetUsers.length,
          titleFr,
        },
      },
    });

    return NextResponse.json({
      success: true,
      count: notifications.count,
      message: `${notifications.count} notification(s) créée(s)`,
    });
  } catch (error) {
    console.error("Error creating notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création des notifications" },
      { status: 500 }
    );
  }
}
