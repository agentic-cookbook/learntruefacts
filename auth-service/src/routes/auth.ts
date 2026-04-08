import { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { signAccessToken, signRefreshToken, verifyToken } from "../auth/jwt.js";
import { generateRefreshToken, storeRefreshToken, validateRefreshToken, revokeRefreshToken } from "../auth/session.js";
import { authMiddleware } from "../middleware/auth.js";

export const authRoutes = new Hono<AppEnv>();

authRoutes.post("/register", async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();

  if (!email || !password || password.length < 12) {
    return c.json(
      { type: "about:blank", title: "Bad Request", status: 400, detail: "Email and password (min 12 chars) required" },
      400,
    );
  }

  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    return c.json(
      { type: "about:blank", title: "Conflict", status: 409, detail: "Email already registered" },
      409,
    );
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({ email, passwordHash }).returning();

  const accessToken = await signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken();
  await storeRefreshToken(user.id, refreshToken);

  return c.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } }, 201);
});

authRoutes.post("/login", async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return c.json(
      { type: "about:blank", title: "Unauthorized", status: 401, detail: "Invalid credentials" },
      401,
    );
  }

  const accessToken = await signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken();
  await storeRefreshToken(user.id, refreshToken);

  return c.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } });
});

authRoutes.post("/refresh", async (c) => {
  const { refreshToken } = await c.req.json<{ refreshToken: string }>();

  if (!refreshToken) {
    return c.json({ type: "about:blank", title: "Bad Request", status: 400, detail: "Refresh token required" }, 400);
  }

  let payload;
  try {
    const result = await verifyToken(refreshToken);
    payload = result.payload;
  } catch {
    return c.json({ type: "about:blank", title: "Unauthorized", status: 401, detail: "Invalid refresh token" }, 401);
  }

  const userId = payload.sub!;
  const valid = await validateRefreshToken(userId, refreshToken);
  if (!valid) {
    return c.json({ type: "about:blank", title: "Unauthorized", status: 401, detail: "Refresh token revoked" }, 401);
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    return c.json({ type: "about:blank", title: "Unauthorized", status: 401, detail: "User not found" }, 401);
  }

  await revokeRefreshToken(userId, refreshToken);

  const newAccessToken = await signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const newRefreshToken = generateRefreshToken();
  await storeRefreshToken(user.id, newRefreshToken);

  return c.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
});

authRoutes.post("/logout", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const { refreshToken } = await c.req.json<{ refreshToken: string }>();

  if (refreshToken) {
    await revokeRefreshToken(userId, refreshToken);
  }

  return c.json({ message: "Logged out" });
});

authRoutes.get("/me", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    return c.json({ type: "about:blank", title: "Not Found", status: 404, detail: "User not found" }, 404);
  }
  return c.json({ id: user.id, email: user.email, role: user.role });
});
