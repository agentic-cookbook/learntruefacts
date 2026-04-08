import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { env } from "./config/env.js";

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Auth service running on port ${info.port}`);
});
