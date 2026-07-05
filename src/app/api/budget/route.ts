import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = auth.userId;
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const where: any = { userId };
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

    const budgets = await db.budget.findMany({
      where,
      include: { expenses: true },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json(budgets);
  } catch (error) {
    console.error("Budget GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = auth.userId;
    const { amount, month, year } = await req.json();

    if (!amount || amount < 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();

    const budget = await db.budget.upsert({
      where: {
        userId_month_year: { userId, month: m, year: y },
      },
      update: { amount },
      create: { amount, month: m, year: y, userId },
    });

    return NextResponse.json(budget);
  } catch (error) {
    console.error("Budget POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
