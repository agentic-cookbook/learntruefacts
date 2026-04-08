import { createHash, randomBytes } from "crypto";
import { db } from "../db/client.js";
import { refreshTokens } from "../db/schema.js";
import { eq, and, gt } from "drizzle-orm";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString("hex");
}

export async function storeRefreshToken(userId: string, token: string): Promise<void> {
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await db.insert(refreshTokens).values({ userId, tokenHash, expiresAt });
}

export async function validateRefreshToken(userId: string, token: string): Promise<boolean> {
  const tokenHash = hashToken(token);
  const result = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.userId, userId),
        eq(refreshTokens.tokenHash, tokenHash),
        gt(refreshTokens.expiresAt, new Date()),
      ),
    );
  return result.length > 0;
}

export async function revokeRefreshToken(userId: string, token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await db
    .delete(refreshTokens)
    .where(and(eq(refreshTokens.userId, userId), eq(refreshTokens.tokenHash, tokenHash)));
}
