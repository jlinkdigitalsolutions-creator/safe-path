import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation error",
      issues: err.flatten(),
    });
    return;
  }
  console.error(err);
  const message =
    err instanceof Error ? err.message : "Internal Server Error";
  const status =
    err && typeof err === "object" && "status" in err && typeof (err as { status: unknown }).status === "number"
      ? (err as { status: number }).status
      : 500;
  res.status(status >= 400 && status < 600 ? status : 500).json({
    error: message,
  });
}
