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

    const now = new Date();
    const m = month ? parseInt(month) : now.getMonth() + 1;
    const y = year ? parseInt(year) : now.getFullYear();

    const budget = await db.budget.findFirst({
      where: { userId, month: m, year: y },
      include: { expenses: true },
    });

    if (!budget) {
      return NextResponse.json({
        budget: 0,
        totalSpent: 0,
        remaining: 0,
        expenses: [],
        categoryBreakdown: {},
        dailySpending: [],
        weeklySpending: [],
      });
    }

    const totalSpent = budget.expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = budget.amount - totalSpent;

    const categoryBreakdown: Record<string, number> = {};
    budget.expenses.forEach((e) => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
    });

    const dailyMap: Record<string, number> = {};
    budget.expenses.forEach((e) => {
      const day = new Date(e.date).getDate();
      dailyMap[day] = (dailyMap[day] || 0) + e.amount;
    });
    const dailySpending = Object.entries(dailyMap).map(([day, amount]) => ({
      day: parseInt(day),
      amount,
    }));

    const weeklyMap: Record<string, number> = {};
    budget.expenses.forEach((e) => {
      const d = new Date(e.date);
      const weekNum = Math.ceil(d.getDate() / 7);
      const key = `Week ${weekNum}`;
      weeklyMap[key] = (weeklyMap[key] || 0) + e.amount;
    });
    const weeklySpending = Object.entries(weeklyMap).map(([week, amount]) => ({
      week,
      amount,
    }));

    return NextResponse.json({
      budget: budget.amount,
      totalSpent,
      remaining,
      expenses: budget.expenses,
      categoryBreakdown,
      dailySpending,
      weeklySpending,
    });
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
