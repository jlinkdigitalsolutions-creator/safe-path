import * as repo from "./notification.repository.js";
import { sendMockSms } from "../../shared/services/sms.mock.js";
import { User } from "../../database/models/index.js";

const CASE_OFFICER_ROLES = [
  "admin",
  "social_worker",
  "ngo_staff",
  "police",
] as const;

export async function notifyCaseCreated(params: {
  caseNumber: string;
  urgency: string;
  region: string;
  caseId?: string;
}) {
  const userIds = await repo.findUserIdsByRoleNames([...CASE_OFFICER_ROLES]);
  const isUrgent = params.urgency === "critical" || params.urgency === "high";
  const title = isUrgent
    ? `URGENT: Case ${params.caseNumber}`
    : `New case ${params.caseNumber}`;
  const body = `Reported in ${params.region}. Urgency: ${params.urgency}.`;
  for (const uid of userIds) {
    await repo.createNotification({
      userId: uid,
      title,
      body,
      meta: {
        type: isUrgent ? "case_urgent" : "case_created",
        caseNumber: params.caseNumber,
        caseId: params.caseId,
      },
    });
  }
  const officers = await User.findAll({
    where: { id: userIds },
    attributes: ["phone"],
  });
  for (const p of officers) {
    if (p.phone) {
      await sendMockSms({
        to: p.phone,
        body: `[SafePath] ${title}. ${body}`,
        meta: { kind: isUrgent ? "urgent_case_alert" : "new_case_alert" },
      });
    }
  }
}

/** SMS to survivor/reporter acknowledging receipt (when not anonymous). */
export async function acknowledgeCaseReportToReporter(params: {
  caseNumber: string;
  reporterUserId: string;
}) {
  const user = await User.findByPk(params.reporterUserId, {
    attributes: ["phone", "fullName"],
  });
  if (!user?.phone) return;
  const msg = `[SafePath] We received your report ${params.caseNumber}. A coordinator will follow up. For emergencies call local authorities.`;
  await sendMockSms({
    to: user.phone,
    body: msg,
    meta: { kind: "case_acknowledgement" },
  });
  await repo.createNotification({
    userId: params.reporterUserId,
    title: "Report received",
    body: `Your case ${params.caseNumber} has been logged.`,
    meta: { type: "case_ack", caseNumber: params.caseNumber },
  });
}

export async function notifyCaseStatusChanged(params: {
  caseNumber: string;
  caseId: string;
  previousStatus: string;
  newStatus: string;
  assigneeIds: string[];
}) {
  const title = `Case ${params.caseNumber} updated`;
  const body = `Status: ${params.previousStatus} → ${params.newStatus}`;
  const notifyIds = new Set<string>(params.assigneeIds);
  const officerIds = await repo.findUserIdsByRoleNames([
    "admin",
    "social_worker",
    "police",
  ]);
  for (const id of officerIds) notifyIds.add(id);

  for (const uid of notifyIds) {
    await repo.createNotification({
      userId: uid,
      title,
      body,
      meta: {
        type: "case_status",
        caseId: params.caseId,
        caseNumber: params.caseNumber,
        newStatus: params.newStatus,
      },
    });
  }

  const users = await User.findAll({
    where: { id: [...notifyIds] },
    attributes: ["phone"],
  });
  const smsBody = `[SafePath] ${params.caseNumber}: status is now ${params.newStatus}.`;
  for (const u of users) {
    if (u.phone) {
      await sendMockSms({
        to: u.phone,
        body: smsBody,
        meta: { kind: "case_status_update" },
      });
    }
  }
}

/** Broadcast vaccination reminder SMS (mock) for eligible cohorts. */
export async function sendVaccinationReminderSms(params: {
  campaignName: string;
  region: string;
  ageMin: number;
  ageMax: number;
  language: string;
}) {
  const officers = await repo.findUserIdsByRoleNames(["health_officer", "admin"]);
  const users = await User.findAll({
    where: { id: officers },
    attributes: ["phone"],
  });
  const msg = `[SafePath Health] ${params.campaignName} (${params.region}). Ages ${params.ageMin}–${params.ageMax}. Visit your nearest clinic. Lang: ${params.language}`;
  for (const u of users) {
    if (u.phone) {
      await sendMockSms({
        to: u.phone,
        body: msg,
        meta: { kind: "vaccination_reminder", campaign: params.campaignName },
      });
    }
  }
}

/** Awareness / education SMS broadcast (mock) — targets health officers as proxy for IVR/SMS gateway. */
export async function sendHealthAwarenessSms(params: {
  title: string;
  topic: string;
  channel: string;
}) {
  const ids = await repo.findUserIdsByRoleNames(["health_officer", "admin", "ngo_staff"]);
  const users = await User.findAll({ where: { id: ids }, attributes: ["phone"] });
  const msg = `[SafePath] ${params.topic}: ${params.title} (${params.channel})`;
  for (const u of users) {
    if (u.phone) {
      await sendMockSms({ to: u.phone, body: msg, meta: { kind: "health_awareness" } });
    }
  }
}

export async function listMine(
  userId: string,
  page: number,
  pageSize: number
) {
  return repo.listForUser(userId, page, pageSize);
}

export async function markAsRead(id: string, userId: string) {
  return repo.markRead(id, userId);
}
