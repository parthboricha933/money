import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { SignJWT } from "jose";
import { getAuthUser } from "@/lib/getAuthUser";
import { NextRequest } from "next/server";

const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret-key");

export async function POST(req: NextRequest) {
  try {
    // Check if already authenticated
    const auth = await getAuthUser(req);
    if (auth) {
      const user = await db.user.findUnique({
        where: { id: auth.userId },
        select: { id: true, email: true, name: true },
      });
      if (user) {
        return NextResponse.json({ user, alreadyAuthenticated: true });
      }
    }

    // Try to find existing default user
    let user = await db.user.findFirst({
      where: { email: "default@budget.app" },
    });

    if (!user) {
      // Create default user with a random password
      const hashedPassword = await hashPassword("default-budget-user-2024");
      user = await db.user.create({
        data: {
          email: "default@budget.app",
          name: "Budget User",
          password: hashedPassword,
        },
      });

      // Create a default budget for the current month
      const now = new Date();
      await db.budget.create({
        data: {
          amount: 0,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          userId: user.id,
        },
      });
    }

    // Create JWT token
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("365d")
      .sign(SECRET);

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      alreadyAuthenticated: false,
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Auto-login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
