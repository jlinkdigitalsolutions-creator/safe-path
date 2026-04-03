import { Router } from "express";
import * as controller from "./health.controller.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import {
  requirePermission,
  requireAnyPermission,
} from "../../shared/middlewares/rbac.middleware.js";

const r = Router();

r.use(authenticate);

r.get(
  "/vaccination-campaigns",
  requirePermission("health:read"),
  (req, res, next) => {
    void controller.getCampaigns(req, res).catch(next);
  }
);
r.post(
  "/vaccination-campaigns",
  requirePermission("health:create"),
  (req, res, next) => {
    void controller.postCampaign(req, res).catch(next);
  }
);
r.patch(
  "/vaccination-campaigns/:id",
  requirePermission("health:update"),
  (req, res, next) => {
    void controller.patchCampaign(req, res).catch(next);
  }
);
r.delete(
  "/vaccination-campaigns/:id",
  requirePermission("health:delete"),
  (req, res, next) => {
    void controller.deleteCampaign(req, res).catch(next);
  }
);
r.post(
  "/vaccination-campaigns/:id/send-reminders",
  requirePermission("health:update"),
  (req, res, next) => {
    void controller.postCampaignReminders(req, res).catch(next);
  }
);

r.get("/health-messages", requirePermission("health:read"), (req, res, next) => {
  void controller.getMessages(req, res).catch(next);
});
r.post(
  "/health-messages",
  requirePermission("health:create"),
  (req, res, next) => {
    void controller.postMessage(req, res).catch(next);
  }
);
r.patch(
  "/health-messages/:id",
  requirePermission("health:update"),
  (req, res, next) => {
    void controller.patchMessage(req, res).catch(next);
  }
);
r.delete(
  "/health-messages/:id",
  requirePermission("health:delete"),
  (req, res, next) => {
    void controller.deleteMessage(req, res).catch(next);
  }
);
r.post(
  "/health-messages/:id/broadcast",
  requirePermission("health:update"),
  (req, res, next) => {
    void controller.postMessageBroadcast(req, res).catch(next);
  }
);

r.get("/facilities", requirePermission("health:read"), (req, res, next) => {
  void controller.getFacilities(req, res).catch(next);
});
r.post(
  "/facilities",
  requirePermission("health:create"),
  (req, res, next) => {
    void controller.postFacility(req, res).catch(next);
  }
);
r.patch(
  "/facilities/:id",
  requirePermission("health:update"),
  (req, res, next) => {
    void controller.patchFacility(req, res).catch(next);
  }
);
r.delete(
  "/facilities/:id",
  requirePermission("health:delete"),
  (req, res, next) => {
    void controller.deleteFacility(req, res).catch(next);
  }
);

r.get(
  "/dashboard/summary",
  requireAnyPermission("health:read", "dashboard:view"),
  (req, res, next) => {
    void controller.dashboard(req, res).catch(next);
  }
);

export { r as healthRoutes };
