import { Hono } from "hono";
import { logger } from "hono/logger";
import { corsMiddleware } from "./middleware/cors.js";
import { errorHandler } from "./middleware/error.js";
import { requestLogger } from "./middleware/logger.js";
import { authRoutes } from "./routes/auth.js";
import { usersRoutes } from "./routes/users.js";
import { jwksRoutes } from "./routes/jwks.js";
import { healthRoutes } from "./routes/health.js";

export type AppEnv = {
  Variables: {
    userId: string;
    userEmail: string;
    userRole: string;
    requestId: string;
  };
};

const app = new Hono<AppEnv>();

app.use("*", logger());
app.use("*", corsMiddleware);
app.use("*", requestLogger);
app.onError(errorHandler);
app.notFound((c) => {
  return c.json(
    { type: "about:blank", title: "Not Found", status: 404, detail: `${c.req.method} ${c.req.path} not found` },
    404,
  );
});

app.route("/api/auth", authRoutes);
app.route("/api/admin/users", usersRoutes);
app.route("/.well-known", jwksRoutes);
app.route("/api/health", healthRoutes);

export { app };
