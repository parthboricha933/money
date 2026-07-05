// Simple password hashing for development
// Uses a basic SHA-256 approach via Web Crypto API (available in Node.js 18+)

export async function hashPassword(password: string): Promise<string> {
  const salt = Math.random().toString(36).substring(2, 15);
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${salt}:${hashHex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const verifyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hash === verifyHash;
}
