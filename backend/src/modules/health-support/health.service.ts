import * as repo from "./health.repository.js";
import { writeAudit } from "../../shared/services/audit.service.js";
import type { Request } from "express";
import * as notifications from "../notifications/notification.service.js";
import {
  computeCurrentCoveragePercent,
  type CoverageInput,
} from "./coverage.util.js";

export async function campaigns(req: Request) {
  await writeAudit({
    userId: req.auth!.userId,
    action: "health.campaigns_list",
    entityType: "vaccination_campaign",
    req,
  });
  return repo.listCampaigns();
}

export async function messages(req: Request) {
  await writeAudit({
    userId: req.auth!.userId,
    action: "health.messages_list",
    entityType: "health_message",
    req,
  });
  return repo.listMessages();
}

export async function facilities(
  query: { region?: string; type?: string; country?: string; service?: string },
  req: Request
) {
  await writeAudit({
    userId: req.auth!.userId,
    action: "health.facilities_list",
    entityType: "facility",
    details: query,
    req,
  });
  return repo.listFacilities(query);
}

export async function createCampaign(body: Record<string, unknown>, req: Request) {
  const merged = { ...body };
  merged.currentCoveragePercent = computeCurrentCoveragePercent(
    merged as CoverageInput
  );
  const c = await repo.createCampaign(merged);
  await writeAudit({
    userId: req.auth!.userId,
    action: "health.campaign_create",
    entityType: "vaccination_campaign",
    entityId: c.id,
    req,
  });
  return c;
}

export async function patchCampaign(id: string, body: Record<string, unknown>, req: Request) {
  const existing = await repo.getCampaign(id);
  if (!existing) {
    throw Object.assign(new Error("Campaign not found"), { status: 404 });
  }
  const plain = existing.get({ plain: true }) as Record<string, unknown>;
  const merged = { ...plain, ...body };
  merged.currentCoveragePercent = computeCurrentCoveragePercent(
    merged as CoverageInput
  );
  const c = await repo.updateCampaign(id, {
    ...body,
    currentCoveragePercent: merged.currentCoveragePercent,
  });
  if (!c) throw Object.assign(new Error("Campaign not found"), { status: 404 });
  await writeAudit({
    userId: req.auth!.userId,
    action: "health.campaign_update",
    entityType: "vaccination_campaign",
    entityId: id,
    req,
  });
  return c;
}

export async function removeCampaign(id: string, req: Request) {
  const n = await repo.deleteCampaign(id);
  if (!n) throw Object.assign(new Error("Campaign not found"), { status: 404 });
  await writeAudit({
    userId: req.auth!.userId,
    action: "health.campaign_delete",
    entityType: "vaccination_campaign",
    entityId: id,
    req,
  });
}

export async function sendCampaignReminders(id: string, req: Request) {
  const c = await repo.getCampaign(id);
  if (!c) throw Object.assign(new Error("Campaign not found"), { status: 404 });
  if (!c.smsReminderEnabled) {
    throw Object.assign(new Error("SMS reminders disabled for this campaign"), {
      status: 400,
    });
  }
  await notifications.sendVaccinationReminderSms({
    campaignName: c.name,
    region: c.region,
    ageMin: c.ageMin ?? 9,
    ageMax: c.ageMax ?? 45,
    language: c.language ?? "en",
  });
  await writeAudit({
    userId: req.auth!.userId,
    action: "health.campaign_send_reminders",
    entityType: "vaccination_campaign",
    entityId: id,
    req,
  });
  return { ok: true, message: "Reminder SMS dispatched (mock gateway)" };
}

export async function createMessage(body: Record<string, unknown>, req: Request) {
  const m = await repo.createMessage(body);
  await writeAudit({
    userId: req.auth!.userId,
    action: "health.message_create",
    entityType: "health_message",
    entityId: m.id,
    req,
  });
  return m;
}

export async function patchMessage(id: string, body: Record<string, unknown>, req: Request) {
  const m = await repo.updateMessage(id, body);
  if (!m) throw Object.assign(new Error("Message not found"), { status: 404 });
  await writeAudit({
    userId: req.auth!.userId,
    action: "health.message_update",
    entityType: "health_message",
    entityId: id,
    req,
  });
  return m;
}

export async function removeMessage(id: string, req: Request) {
  const n = await repo.deleteMessage(id);
  if (!n) throw Object.assign(new Error("Message not found"), { status: 404 });
  await writeAudit({
    userId: req.auth!.userId,
    action: "health.message_delete",
    entityType: "health_message",
    entityId: id,
    req,
  });
}

export async function broadcastAwareness(id: string, req: Request) {
  const m = await repo.getMessage(id);
  if (!m) throw Object.assign(new Error("Message not found"), { status: 404 });
  await notifications.sendHealthAwarenessSms({
    title: m.title,
    topic: m.topic ?? "health",
    channel: m.channel,
  });
  await m.update({ sentAt: new Date() });
  await writeAudit({
    userId: req.auth!.userId,
    action: "health.message_broadcast",
    entityType: "health_message",
    entityId: id,
    req,
  });
  return { ok: true, message: "Awareness SMS dispatched (mock gateway)" };
}

export async function createFacility(body: Record<string, unknown>, req: Request) {
  const f = await repo.createFacility(body);
  await writeAudit({
    userId: req.auth!.userId,
    action: "health.facility_create",
    entityType: "facility",
    entityId: f.id,
    req,
  });
  return f;
}

export async function patchFacility(id: string, body: Record<string, unknown>, req: Request) {
  const f = await repo.updateFacility(id, body);
  if (!f) throw Object.assign(new Error("Facility not found"), { status: 404 });
  await writeAudit({
    userId: req.auth!.userId,
    action: "health.facility_update",
    entityType: "facility",
    entityId: id,
    req,
  });
  return f;
}

export async function removeFacility(id: string, req: Request) {
  const n = await repo.deleteFacility(id);
  if (!n) throw Object.assign(new Error("Facility not found"), { status: 404 });
  await writeAudit({
    userId: req.auth!.userId,
    action: "health.facility_delete",
    entityType: "facility",
    entityId: id,
    req,
  });
}

export async function healthDashboard(req: Request) {
  const campaigns = await repo.listCampaigns();
  const messages = await repo.listMessages();
  const facilities = await repo.listFacilities({});
  const totalReach = messages.reduce((s, m) => s + (m.reachEstimate ?? 0), 0);
  /** Mean of each campaign’s stored current % (not weighted by population). */
  const coverageAvg =
    campaigns.length === 0
      ? 0
      : campaigns.reduce((s, c) => s + (c.currentCoveragePercent ?? 0), 0) /
        campaigns.length;
  const byRegion = facilities.reduce<Record<string, number>>((acc, f) => {
    acc[f.region] = (acc[f.region] ?? 0) + 1;
    return acc;
  }, {});
  await writeAudit({
    userId: req.auth!.userId,
    action: "health.dashboard",
    entityType: "dashboard",
    req,
  });
  return {
    campaigns,
    messages,
    facilities,
    stats: {
      totalReach,
      avgVaccinationCoverage: Math.round(coverageAvg),
      facilityCount: facilities.length,
      facilitiesByRegion: Object.entries(byRegion).map(([region, count]) => ({
        region,
        count,
      })),
    },
  };
}
