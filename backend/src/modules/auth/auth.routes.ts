import { Router } from "express";
import * as controller from "./auth.controller.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { requirePermission } from "../../shared/middlewares/rbac.middleware.js";

const r = Router();

r.post("/login", (req, res, next) => {
  void controller.login(req, res).catch(next);
});
r.post("/refresh", (req, res, next) => {
  void controller.refresh(req, res).catch(next);
});
r.post("/logout", (req, res, next) => {
  void controller.logout(req, res).catch(next);
});
r.get("/me", authenticate, (req, res, next) => {
  void controller.me(req, res).catch(next);
});
r.post(
  "/register",
  authenticate,
  requirePermission("users:create"),
  (req, res, next) => {
    void controller.register(req, res).catch(next);
  }
);

export { r as authRoutes };
