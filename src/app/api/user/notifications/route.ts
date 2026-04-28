import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth";
import { prisma } from "~/prisma/prisma";
import { safeParseJson, safeParseSearchParams } from "@/lib/validation/helpers";
import { notificationsListQuerySchema } from "@/lib/validation/schemas/common";
import {
  notificationMarkReadSchema,
} from "@/lib/validation/schemas/user";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = safeParseSearchParams(searchParams, notificationsListQuerySchema);
    if (!q.ok) {
      return q.response;
    }
    const { page, limit, unreadOnly } = q.data;

    const skip = (page - 1) * limit;

    const where = {
      userId: session.user.id,
      ...(unreadOnly ? { read: false } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: session.user.id,
          read: false,
        },
      }),
    ]);

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, notificationMarkReadSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const { notificationId } = parsed.data;

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification non trouvée" },
        { status: 404 }
      );
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, notification: updated });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la notification" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des notifications" },
      { status: 500 }
    );
  }
}
