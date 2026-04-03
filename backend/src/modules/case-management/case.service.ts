import { randomBytes } from "crypto";
import * as repo from "./case.repository.js";
import { writeAudit } from "../../shared/services/audit.service.js";
import * as notifications from "../notifications/notification.service.js";
import type { Request } from "express";
import type { CASE_TYPES, URGENCY_LEVELS } from "../../database/models/Case.js";
import {
  REFERRAL_STATUSES,
  type REFERRAL_TYPES,
} from "../../database/models/Referral.js";
import { Case } from "../../database/models/index.js";

function generateCaseNumber(): string {
  const y = new Date().getFullYear();
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `SP-${y}-${suffix}`;
}

function escapeCsvCell(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function intakeCase(
  body: {
    type: (typeof CASE_TYPES)[number];
    country?: string;
    region: string;
    district: string;
    kebele: string;
    urgency: (typeof URGENCY_LEVELS)[number];
    anonymous: boolean;
    summary?: string;
    locationNotes?: string;
    intakeChannel: "sms" | "ivr" | "web";
    reporterUserId?: string | null;
  },
  req: Request
) {
  const caseNumber = generateCaseNumber();
  const c = await repo.createCase({
    caseNumber,
    type: body.type,
    country: body.country ?? "Ethiopia",
    region: body.region,
    district: body.district,
    kebele: body.kebele,
    urgency: body.urgency,
    status: "open",
    anonymous: body.anonymous,
    reportedById: body.anonymous ? null : body.reporterUserId ?? null,
    intakeChannel: body.intakeChannel,
    summary: body.summary ?? null,
    locationNotes: body.locationNotes ?? null,
  });

  await writeAudit({
    userId: req.auth?.userId ?? null,
    action: "case.intake",
    entityType: "case",
    entityId: c.id,
    details: { caseNumber, channel: body.intakeChannel },
    req,
  });

  await notifications.notifyCaseCreated({
    caseNumber,
    urgency: body.urgency,
    region: body.region,
    caseId: c.id,
  });

  if (!body.anonymous && (body.reporterUserId || req.auth?.userId)) {
    const rid = body.reporterUserId ?? req.auth?.userId;
    if (rid) {
      await notifications.acknowledgeCaseReportToReporter({
        caseNumber,
        reporterUserId: rid,
      });
    }
  }

  return c;
}

export async function createCase(
  body: {
    type: (typeof CASE_TYPES)[number];
    country?: string;
    region: string;
    district: string;
    kebele: string;
    urgency: (typeof URGENCY_LEVELS)[number];
    anonymous: boolean;
    summary?: string;
    locationNotes?: string;
    reportedById?: string | null;
  },
  req: Request
) {
  return intakeCase(
    {
      ...body,
      intakeChannel: "web",
      reporterUserId: body.reportedById ?? req.auth?.userId ?? null,
    },
    req
  );
}

export async function listCases(
  query: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    type?: string;
    region?: string;
    district?: string;
    country?: string;
    urgency?: string;
    assignedToMe?: boolean;
  },
  req: Request
) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const assigneeId =
    query.assignedToMe && req.auth?.userId ? req.auth.userId : undefined;
  const { rows, count } = await repo.listCases({
    page,
    pageSize,
    filters: {
      search: query.search,
      status: query.status as never,
      type: query.type as never,
      region: query.region,
      district: query.district,
      country: query.country,
      urgency: query.urgency as never,
      assigneeId,
    },
  });
  return { data: rows, total: count, page, pageSize };
}

export async function listReferrals(
  query: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    type?: string;
  },
  _req: Request
) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const { rows, count } = await repo.listReferrals({
    page,
    pageSize,
    filters: {
      search: query.search,
      status: query.status,
      type: query.type,
    },
  });
  const data = rows.map((row) => {
    const plain = row.get({ plain: true }) as Record<string, unknown>;
    const nested = (plain.Case ?? plain.case) as Record<string, unknown> | undefined;
    return { ...plain, Case: nested };
  });
  return { data, total: count, page, pageSize };
}

export async function exportCasesCsv(
  query: {
    search?: string;
    status?: string;
    type?: string;
    region?: string;
    district?: string;
    country?: string;
    urgency?: string;
  },
  req: Request
) {
  const rows = await repo.findCasesForExport(
    {
      search: query.search,
      status: query.status as never,
      type: query.type as never,
      region: query.region,
      district: query.district,
      country: query.country,
      urgency: query.urgency as never,
    },
    50_000
  );
  await writeAudit({
    userId: req.auth!.userId,
    action: "case.export_csv",
    entityType: "case",
    details: { rowCount: rows.length },
    req,
  });

  const header = [
    "case_number",
    "country",
    "region",
    "district",
    "kebele",
    "type",
    "urgency",
    "status",
    "anonymous",
    "intake_channel",
    "summary",
    "created_at",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        escapeCsvCell(r.caseNumber),
        escapeCsvCell(r.country),
        escapeCsvCell(r.region),
        escapeCsvCell(r.district),
        escapeCsvCell(r.kebele),
        escapeCsvCell(r.type),
        escapeCsvCell(r.urgency),
        escapeCsvCell(r.status),
        escapeCsvCell(r.anonymous),
        escapeCsvCell(r.intakeChannel),
        escapeCsvCell(r.summary),
        escapeCsvCell(r.createdAt?.toISOString()),
      ].join(",")
    );
  }
  return lines.join("\r\n");
}

export async function getCase(id: string, req: Request) {
  const c = await repo.findCaseById(id);
  if (!c) {
    throw Object.assign(new Error("Case not found"), { status: 404 });
  }
  await writeAudit({
    userId: req.auth!.userId,
    action: "case.read",
    entityType: "case",
    entityId: id,
    req,
  });
  return c;
}

export async function updateCase(
  id: string,
  body: Partial<{
    status: string;
    urgency: string;
    summary: string | null;
    locationNotes: string | null;
    region: string;
    district: string;
    kebele: string;
    country: string;
    type: string;
  }>,
  req: Request
) {
  const existing = await Case.findByPk(id);
  if (!existing) {
    throw Object.assign(new Error("Case not found"), { status: 404 });
  }
  const previousStatus = existing.status;
  const c = await repo.updateCase(id, body as never);
  if (!c) {
    throw Object.assign(new Error("Case not found"), { status: 404 });
  }
  await writeAudit({
    userId: req.auth!.userId,
    action: "case.update",
    entityType: "case",
    entityId: id,
    details: body,
    req,
  });

  if (body.status && body.status !== previousStatus) {
    const assignees = await repo.getActiveAssigneeIdsForCase(id);
    await notifications.notifyCaseStatusChanged({
      caseNumber: c.caseNumber,
      caseId: c.id,
      previousStatus,
      newStatus: body.status,
      assigneeIds: assignees,
    });
  }

  return c;
}

export async function deleteCase(id: string, req: Request) {
  const c = await Case.findByPk(id);
  if (!c) {
    throw Object.assign(new Error("Case not found"), { status: 404 });
  }
  const n = await repo.deleteCaseById(id);
  if (!n) {
    throw Object.assign(new Error("Case not found"), { status: 404 });
  }
  await writeAudit({
    userId: req.auth!.userId,
    action: "case.delete",
    entityType: "case",
    entityId: id,
    details: { caseNumber: c.caseNumber },
    req,
  });
}

export async function assignCase(
  id: string,
  body: { assigneeId: string; notes?: string | null },
  req: Request
) {
  const c = await Case.findByPk(id);
  if (!c) {
    throw Object.assign(new Error("Case not found"), { status: 404 });
  }
  const assignment = await repo.addAssignment({
    caseId: id,
    assigneeId: body.assigneeId,
    assignedById: req.auth!.userId,
    notes: body.notes ?? null,
  });
  await c.update({ status: "in_progress" });
  await writeAudit({
    userId: req.auth!.userId,
    action: "case.assign",
    entityType: "case",
    entityId: id,
    details: { assigneeId: body.assigneeId },
    req,
  });
  return assignment;
}

export async function addReferral(
  caseId: string,
  body: {
    type: (typeof REFERRAL_TYPES)[number];
    destinationName?: string | null;
    notes?: string | null;
  },
  req: Request
) {
  const c = await Case.findByPk(caseId);
  if (!c) {
    throw Object.assign(new Error("Case not found"), { status: 404 });
  }
  const ref = await repo.createReferral({
    caseId,
    type: body.type,
    status: "pending",
    destinationName: body.destinationName ?? null,
    notes: body.notes ?? null,
    createdById: req.auth!.userId,
  });
  if (!["resolved", "closed"].includes(c.status)) {
    await c.update({ status: "forwarded" });
  }
  await writeAudit({
    userId: req.auth!.userId,
    action: "case.referral_create",
    entityType: "referral",
    entityId: ref.id,
    details: { caseId, type: body.type },
    req,
  });
  return ref;
}

export async function patchReferral(
  id: string,
  body: Partial<{
    status: (typeof REFERRAL_STATUSES)[number];
    notes: string | null;
    destinationName: string | null;
  }>,
  req: Request
) {
  const r = await repo.updateReferral(id, body);
  if (!r) {
    throw Object.assign(new Error("Referral not found"), { status: 404 });
  }
  await writeAudit({
    userId: req.auth!.userId,
    action: "case.referral_update",
    entityType: "referral",
    entityId: id,
    details: body,
    req,
  });
  return r;
}

export async function listAssignableUsers(req: Request) {
  const users = await repo.listAssignableUsers();
  await writeAudit({
    userId: req.auth!.userId,
    action: "case.assignees_list",
    entityType: "user",
    req,
  });
  return users.map((u) => {
    const row = u as { id: string; email: string; fullName: string; Roles?: { name: string }[] };
    return {
      id: row.id,
      email: row.email,
      fullName: row.fullName,
      roles: row.Roles?.map((r) => r.name) ?? [],
    };
  });
}

export async function analyticsSummary(req: Request) {
  const total = await Case.count();
  const byRegion = await repo.countByGroup("region");
  const byDistrict = await repo.countByGroup("district");
  const byCountry = await repo.countByGroup("country");
  const byType = await repo.countByGroup("type");
  const byStatus = await repo.countByGroup("status");
  const byUrgency = await repo.countByGroup("urgency");
  const referralOutcomes = await repo.referralOutcomeCounts();
  const referralsByType = await repo.referralCountsByType();
  const survivorsReceivingSupport = await repo.countSurvivorsReceivingSupport();
  await writeAudit({
    userId: req.auth!.userId,
    action: "case.analytics",
    entityType: "dashboard",
    details: {},
    req,
  });
  return {
    total,
    byRegion,
    byDistrict,
    byCountry,
    byType,
    byStatus,
    byUrgency,
    referralOutcomes,
    referralsByType,
    survivorsReceivingSupport,
    generatedAt: new Date().toISOString(),
  };
}
