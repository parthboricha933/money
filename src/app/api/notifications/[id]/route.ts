import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const notification = await db.notification.update({
      where: { id, userId: auth.userId },
      data: { read: true },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Notification PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
