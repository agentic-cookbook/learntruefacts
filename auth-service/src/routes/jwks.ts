import { Hono } from "hono";
import { getPublicJWK } from "../config/keys.js";

export const jwksRoutes = new Hono();

jwksRoutes.get("/jwks.json", async (c) => {
  const jwk = await getPublicJWK();
  c.header("Cache-Control", "public, max-age=3600");
  return c.json({ keys: [jwk] });
});
