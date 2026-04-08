import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { env } from "./config/env.js";

const server = serve({ fetch: app.fetch, port: env.PORT });

console.log(`learn-true-facts backend listening on port ${env.PORT}`);

export default app;
