import type { Request, Response, NextFunction } from "express";
import type { PermissionKey } from "../constants/permissions.js";

export function requirePermission(...required: PermissionKey[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const ok = required.some((p) => req.auth!.permissions.includes(p));
    if (!ok) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

export function requireAnyPermission(...required: PermissionKey[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const ok = required.some((p) => req.auth!.permissions.includes(p));
    if (!ok) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const ok = roles.some((r) => req.auth!.roles.includes(r));
    if (!ok) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
