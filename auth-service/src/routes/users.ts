import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { authMiddleware, adminOnly } from "../middleware/auth.js";

export const usersRoutes = new Hono();

usersRoutes.use("*", authMiddleware, adminOnly);

usersRoutes.get("/", async (c) => {
  const allUsers = await db
    .select({ id: users.id, email: users.email, role: users.role, createdAt: users.createdAt })
    .from(users);
  return c.json(allUsers);
});

usersRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const { role } = await c.req.json<{ role: string }>();

  if (!["admin", "user"].includes(role)) {
    return c.json({ type: "about:blank", title: "Bad Request", status: 400, detail: "Role must be admin or user" }, 400);
  }

  const [updated] = await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id)).returning();
  if (!updated) {
    return c.json({ type: "about:blank", title: "Not Found", status: 404, detail: "User not found" }, 404);
  }

  return c.json({ id: updated.id, email: updated.email, role: updated.role });
});

usersRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");

  if (id === userId) {
    return c.json({ type: "about:blank", title: "Bad Request", status: 400, detail: "Cannot delete yourself" }, 400);
  }

  const [deleted] = await db.delete(users).where(eq(users.id, id)).returning();
  if (!deleted) {
    return c.json({ type: "about:blank", title: "Not Found", status: 404, detail: "User not found" }, 404);
  }

  return c.json({ message: "User deleted" });
});
