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
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const now = new Date();
    const m = month ? parseInt(month) : now.getMonth() + 1;
    const y = year ? parseInt(year) : now.getFullYear();

    const budget = await db.budget.findFirst({
      where: { userId, month: m, year: y },
    });

    if (!budget) {
      return NextResponse.json([]);
    }

    const where: any = { budgetId: budget.id };
    if (category && category !== "all") {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { note: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const expenses = await db.expense.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Expense GET error:", error);
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
    const { amount, category, note, date } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    const expenseDate = new Date(date);
    const m = expenseDate.getMonth() + 1;
    const y = expenseDate.getFullYear();

    let budget = await db.budget.findFirst({
      where: { userId, month: m, year: y },
    });

    if (!budget) {
      budget = await db.budget.create({
        data: { amount: 0, month: m, year: y, userId },
      });
    }

    const expense = await db.expense.create({
      data: {
        amount,
        category,
        note: note || "",
        date: expenseDate,
        userId,
        budgetId: budget.id,
      },
    });

    // Check budget usage and create notifications
    const totalSpent = await db.expense.aggregate({
      where: { budgetId: budget.id },
      _sum: { amount: true },
    });

    const spent = totalSpent._sum.amount || 0;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    const thresholds = [
      { type: "100", min: 100, message: "You've used 100% of your budget!" },
      { type: "90", min: 90, message: "Warning: You've used 90% of your budget!" },
      { type: "75", min: 75, message: "Heads up: You've used 75% of your budget." },
      { type: "50", min: 50, message: "You've used 50% of your budget." },
    ];

    for (const threshold of thresholds) {
      if (percentage >= threshold.min) {
        const existing = await db.notification.findFirst({
          where: {
            userId,
            type: threshold.type,
            createdAt: {
              gte: new Date(new Date().setDate(1)),
            },
          },
        });
        if (!existing) {
          await db.notification.create({
            data: {
              type: threshold.type,
              message: threshold.message,
              userId,
            },
          });
        }
        break;
      }
    }

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Expense POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
