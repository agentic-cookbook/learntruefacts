import type { MiddlewareHandler } from "hono";
import { verifyToken } from "../auth/jwt.js";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
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
    c.set("userId" as any, payload.sub!);
    c.set("userEmail" as any, payload.email as string);
    c.set("userRole" as any, payload.role as string);
  } catch {
    return c.json(
      { type: "about:blank", title: "Unauthorized", status: 401, detail: "Invalid or expired token" },
      401,
    );
  }

  await next();
};

export const adminOnly: MiddlewareHandler = async (c, next) => {
  const role = c.get("userRole" as any);
  if (role !== "admin") {
    return c.json(
      { type: "about:blank", title: "Forbidden", status: 403, detail: "Admin access required" },
      403,
    );
  }
  await next();
};
