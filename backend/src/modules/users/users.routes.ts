import { Router } from "express";
import * as controller from "./users.controller.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { requirePermission } from "../../shared/middlewares/rbac.middleware.js";

const r = Router();

r.use(authenticate);

r.get("/roles", requirePermission("users:read"), (req, res, next) => {
  void controller.rolesCatalog(req, res).catch(next);
});

r.get("/", requirePermission("users:read"), (req, res, next) => {
  void controller.list(req, res).catch(next);
});

r.patch(
  "/:id",
  requirePermission("users:update"),
  (req, res, next) => {
    void controller.patchUser(req, res).catch(next);
  }
);

r.put(
  "/:id/roles",
  requirePermission("users:assign_role"),
  (req, res, next) => {
    void controller.putRoles(req, res).catch(next);
  }
);

export { r as usersRoutes };
