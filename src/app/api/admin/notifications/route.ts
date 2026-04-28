import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/prisma/prisma";
import {
  requireAdminOrModeratorSessionWithDbCheck,
  requireAdminSessionWithDbCheck,
} from "@/lib/require-admin";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminOrModeratorSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const type = searchParams.get("type");
    const priority = searchParams.get("priority");
    const createdBy = searchParams.get("createdBy");

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (createdBy) where.createdBy = createdBy;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        include: {
          user: {
            select: {
              id: true,
              steamUsername: true,
              email: true,
            },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    const stats = await prisma.notification.groupBy({
      by: ["type"],
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats,
    });
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notifications" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");

    if (!notificationId) {
      return NextResponse.json(
        { error: "ID de notification requis" },
        { status: 400 }
      );
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "NOTIFICATION_DELETED",
        details: {
          notificationId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la notification" },
      { status: 500 }
    );
  }
}
