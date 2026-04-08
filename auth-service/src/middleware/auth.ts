import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../app.js";
import { verifyToken } from "../auth/jwt.js";

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json(
      { type: "about:blank", title: "Unauthorized", status: 401, detail: "Missing or invalid Authorization header" },
      401,
    );
  }

  const token = authHeader.slice(7);
  try {
    const { payload } = await verifyToken(token);
    c.set("userId", payload.sub!);
    c.set("userEmail", payload.email as string);
    c.set("userRole", payload.role as string);
  } catch {
    return c.json(
      { type: "about:blank", title: "Unauthorized", status: 401, detail: "Invalid or expired token" },
      401,
    );
  }

  await next();
};

export const adminOnly: MiddlewareHandler<AppEnv> = async (c, next) => {
  const role = c.get("userRole");
  if (role !== "admin") {
    return c.json(
      { type: "about:blank", title: "Forbidden", status: 403, detail: "Admin access required" },
      403,
    );
  }
  await next();
};
