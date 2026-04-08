import "dotenv/config";

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  JWT_PRIVATE_KEY: required("JWT_PRIVATE_KEY"),
  JWT_PUBLIC_KEY: required("JWT_PUBLIC_KEY"),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "*",
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parseInt(process.env.PORT ?? "3001", 10),
};
