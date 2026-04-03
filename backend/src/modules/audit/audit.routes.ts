import { Router } from "express";
import * as controller from "./audit.controller.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { requirePermission } from "../../shared/middlewares/rbac.middleware.js";

const r = Router();

r.get(
  "/",
  authenticate,
  requirePermission("audit:read"),
  (req, res, next) => {
    void controller.list(req, res).catch(next);
  }
);

export { r as auditRoutes };
