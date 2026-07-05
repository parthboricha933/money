import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret-key");

export async function getAuthUser(req: NextRequest): Promise<{ userId: string; email: string } | null> {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return { userId: payload.userId as string, email: payload.email as string };
  } catch {
    return null;
  }
}
