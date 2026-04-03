import { Router } from "express";
import * as controller from "./notification.controller.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { requirePermission } from "../../shared/middlewares/rbac.middleware.js";

const r = Router();

r.use(authenticate);

r.get("/", requirePermission("notifications:read"), (req, res, next) => {
  void controller.list(req, res).catch(next);
});

r.patch(
  "/:id/read",
  requirePermission("notifications:read"),
  (req, res, next) => {
    void controller.markRead(req, res).catch(next);
  }
);

export { r as notificationRoutes };
