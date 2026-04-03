import { Router } from "express";
import * as controller from "./case.controller.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import {
  requirePermission,
  requireAnyPermission,
} from "../../shared/middlewares/rbac.middleware.js";

const r = Router();

r.post(
  "/intake",
  authenticate,
  requirePermission("case:create"),
  (req, res, next) => {
    void controller.intake(req, res).catch(next);
  }
);

r.get(
  "/cases",
  authenticate,
  requirePermission("case:read"),
  (req, res, next) => {
    void controller.list(req, res).catch(next);
  }
);
r.post(
  "/cases",
  authenticate,
  requirePermission("case:create"),
  (req, res, next) => {
    void controller.create(req, res).catch(next);
  }
);
r.get(
  "/cases/:id",
  authenticate,
  requirePermission("case:read"),
  (req, res, next) => {
    void controller.getOne(req, res).catch(next);
  }
);
r.patch(
  "/cases/:id",
  authenticate,
  requirePermission("case:update"),
  (req, res, next) => {
    void controller.update(req, res).catch(next);
  }
);
r.delete(
  "/cases/:id",
  authenticate,
  requirePermission("case:delete"),
  (req, res, next) => {
    void controller.remove(req, res).catch(next);
  }
);
r.get(
  "/reports/export",
  authenticate,
  requirePermission("case:read"),
  (req, res, next) => {
    void controller.exportCsv(req, res).catch(next);
  }
);
r.post(
  "/cases/:id/assign",
  authenticate,
  requirePermission("case:assign"),
  (req, res, next) => {
    void controller.assign(req, res).catch(next);
  }
);
r.post(
  "/cases/:id/referrals",
  authenticate,
  requirePermission("case:refer"),
  (req, res, next) => {
    void controller.addReferral(req, res).catch(next);
  }
);
r.patch(
  "/referrals/:referralId",
  authenticate,
  requirePermission("case:refer"),
  (req, res, next) => {
    void controller.patchReferral(req, res).catch(next);
  }
);

r.get(
  "/referrals",
  authenticate,
  requirePermission("case:read"),
  (req, res, next) => {
    void controller.listReferrals(req, res).catch(next);
  }
);

r.get(
  "/analytics/summary",
  authenticate,
  requireAnyPermission("dashboard:view", "case:read"),
  (req, res, next) => {
    void controller.analytics(req, res).catch(next);
  }
);

r.get(
  "/assignees",
  authenticate,
  requirePermission("case:assign"),
  (req, res, next) => {
    void controller.listAssignees(req, res).catch(next);
  }
);

export { r as caseRoutes };
