import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth";
import { prisma } from "~/prisma/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "MODERATOR") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
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
    } = body;

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
