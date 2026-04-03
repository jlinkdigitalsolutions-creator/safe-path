import type { Request, Response } from "express";
import { z } from "zod";
import * as caseService from "./case.service.js";
import { CASE_STATUSES } from "../../database/models/Case.js";

const caseStatusFilter = z.enum(
  CASE_STATUSES as unknown as [string, ...string[]]
);

const caseSchema = z.object({
  type: z.enum(["rape", "physical", "emotional"]),
  country: z.string().min(1).optional(),
  region: z.string().min(1),
  district: z.string().min(1),
  kebele: z.string().min(1),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  anonymous: z.boolean(),
  summary: z.string().optional(),
  locationNotes: z.string().optional(),
  reportedById: z.string().uuid().optional().nullable(),
});

const intakeSchema = caseSchema.extend({
  intakeChannel: z.enum(["sms", "ivr", "web"]),
  reporterUserId: z.string().uuid().optional().nullable(),
});

const listQuery = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  search: z.string().optional(),
  status: caseStatusFilter.optional(),
  type: z.enum(["rape", "physical", "emotional"]).optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  country: z.string().optional(),
  urgency: z.enum(["low", "medium", "high", "critical"]).optional(),
  assignedToMe: z
    .string()
    .optional()
    .transform((s) => s === "true" || s === "1"),
});

const exportQuery = listQuery.omit({ page: true, pageSize: true });

export async function intake(req: Request, res: Response): Promise<void> {
  const body = intakeSchema.parse(req.body);
  const c = await caseService.intakeCase(body, req);
  res.status(201).json(c);
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = caseSchema.parse(req.body);
  const c = await caseService.createCase(body, req);
  res.status(201).json(c);
}

export async function list(req: Request, res: Response): Promise<void> {
  const q = listQuery.parse(req.query);
  const result = await caseService.listCases(q, req);
  res.json(result);
}

export async function exportCsv(req: Request, res: Response): Promise<void> {
  const q = exportQuery.parse(req.query);
  const csv = await caseService.exportCasesCsv(q, req);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="safepath-cases-export.csv"'
  );
  res.send(csv);
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const c = await caseService.getCase(req.params.id, req);
  res.json(c);
}

const updateSchema = z.object({
  status: caseStatusFilter.optional(),
  urgency: z.enum(["low", "medium", "high", "critical"]).optional(),
  summary: z.string().nullable().optional(),
  locationNotes: z.string().nullable().optional(),
  country: z.string().min(1).optional(),
  region: z.string().min(1).optional(),
  district: z.string().min(1).optional(),
  kebele: z.string().min(1).optional(),
  type: z.enum(["rape", "physical", "emotional"]).optional(),
});

export async function update(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  const c = await caseService.updateCase(req.params.id, body, req);
  res.json(c);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await caseService.deleteCase(req.params.id, req);
  res.status(204).send();
}

const assignSchema = z.object({
  assigneeId: z.string().uuid(),
  notes: z.string().nullable().optional(),
});

export async function assign(req: Request, res: Response): Promise<void> {
  const body = assignSchema.parse(req.body);
  const a = await caseService.assignCase(req.params.id, body, req);
  res.status(201).json(a);
}

const referralSchema = z.object({
  type: z.enum(["shelter", "legal", "health", "police"]),
  destinationName: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function addReferral(req: Request, res: Response): Promise<void> {
  const body = referralSchema.parse(req.body);
  const r = await caseService.addReferral(req.params.id, body, req);
  res.status(201).json(r);
}

const referralPatchSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  notes: z.string().nullable().optional(),
  destinationName: z.string().nullable().optional(),
});

export async function patchReferral(req: Request, res: Response): Promise<void> {
  const body = referralPatchSchema.parse(req.body);
  const r = await caseService.patchReferral(req.params.referralId, body, req);
  res.json(r);
}

const referralListQuery = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
  search: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  type: z.enum(["shelter", "legal", "health", "police"]).optional(),
});

export async function listReferrals(req: Request, res: Response): Promise<void> {
  const q = referralListQuery.parse(req.query);
  const result = await caseService.listReferrals(q, req);
  res.json(result);
}

export async function analytics(req: Request, res: Response): Promise<void> {
  const data = await caseService.analyticsSummary(req);
  res.json(data);
}

export async function listAssignees(req: Request, res: Response): Promise<void> {
  const data = await caseService.listAssignableUsers(req);
  res.json(data);
}
