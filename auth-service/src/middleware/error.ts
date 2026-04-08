import type { ErrorHandler } from "hono";

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  const status = "status" in err && typeof err.status === "number" ? err.status : 500;

  return c.json(
    {
      type: "about:blank",
      title: status === 500 ? "Internal Server Error" : err.message,
      status,
      detail: status === 500 ? "An unexpected error occurred" : err.message,
    },
    status as any,
  );
};
