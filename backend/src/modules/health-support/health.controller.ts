import type { Request, Response } from "express";
import { z } from "zod";
import * as healthService from "./health.service.js";

const campaignSchema = z.object({
  name: z.string().min(1),
  region: z.string().min(1),
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  targetCoveragePercent: z.number().min(0).max(100),
  currentCoveragePercent: z.number().min(0).max(100).optional(),
  status: z.string().optional(),
  ageMin: z.number().min(0).max(120).optional(),
  ageMax: z.number().min(0).max(120).optional(),
  smsReminderEnabled: z.boolean().optional(),
  targetDistricts: z.string().nullable().optional(),
  language: z.string().optional(),
  eligiblePopulation: z.coerce.number().int().nonnegative().nullable().optional(),
  vaccinatedCount: z.coerce.number().int().nonnegative().nullable().optional(),
});

const messageSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  channel: z.string().min(1),
  audience: z.string().min(1),
  topic: z.string().optional(),
  language: z.string().optional(),
  reachEstimate: z.number().optional(),
  sentAt: z.string().nullable().optional(),
});

const facilitySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["clinic", "hospital", "ngo", "community_center"]),
  country: z.string().min(1).optional(),
  region: z.string().min(1),
  district: z.string().min(1),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  services: z.array(z.string()).nullable().optional(),
});

const listFacilitiesQuery = z.object({
  region: z.string().optional(),
  country: z.string().optional(),
  service: z.string().optional(),
  type: z.enum(["clinic", "hospital", "ngo", "community_center"]).optional(),
});

export async function getCampaigns(req: Request, res: Response): Promise<void> {
  const data = await healthService.campaigns(req);
  res.json(data);
}

export async function getMessages(req: Request, res: Response): Promise<void> {
  const data = await healthService.messages(req);
  res.json(data);
}

export async function getFacilities(req: Request, res: Response): Promise<void> {
  const q = listFacilitiesQuery.parse(req.query);
  const data = await healthService.facilities(q, req);
  res.json(data);
}

export async function postCampaign(req: Request, res: Response): Promise<void> {
  const body = campaignSchema.parse(req.body);
  const c = await healthService.createCampaign(
    {
      ...body,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
    req
  );
  res.status(201).json(c);
}

export async function patchCampaign(req: Request, res: Response): Promise<void> {
  const body = campaignSchema.partial().parse(req.body);
  const payload: Record<string, unknown> = { ...body };
  if (body.startDate) payload.startDate = new Date(body.startDate);
  if (body.endDate !== undefined)
    payload.endDate = body.endDate ? new Date(body.endDate) : null;
  const c = await healthService.patchCampaign(req.params.id, payload, req);
  res.json(c);
}

export async function deleteCampaign(req: Request, res: Response): Promise<void> {
  await healthService.removeCampaign(req.params.id, req);
  res.status(204).send();
}

export async function postCampaignReminders(req: Request, res: Response): Promise<void> {
  const data = await healthService.sendCampaignReminders(req.params.id, req);
  res.json(data);
}

export async function postMessage(req: Request, res: Response): Promise<void> {
  const body = messageSchema.parse(req.body);
  const m = await healthService.createMessage(
    {
      ...body,
      sentAt: body.sentAt ? new Date(body.sentAt) : null,
    },
    req
  );
  res.status(201).json(m);
}

export async function patchMessage(req: Request, res: Response): Promise<void> {
  const body = messageSchema.partial().parse(req.body);
  const payload: Record<string, unknown> = { ...body };
  if (body.sentAt !== undefined)
    payload.sentAt = body.sentAt ? new Date(body.sentAt) : null;
  const m = await healthService.patchMessage(req.params.id, payload, req);
  res.json(m);
}

export async function deleteMessage(req: Request, res: Response): Promise<void> {
  await healthService.removeMessage(req.params.id, req);
  res.status(204).send();
}

export async function postMessageBroadcast(req: Request, res: Response): Promise<void> {
  const data = await healthService.broadcastAwareness(req.params.id, req);
  res.json(data);
}

export async function postFacility(req: Request, res: Response): Promise<void> {
  const body = facilitySchema.parse(req.body);
  const f = await healthService.createFacility(body, req);
  res.status(201).json(f);
}

export async function patchFacility(req: Request, res: Response): Promise<void> {
  const body = facilitySchema.partial().parse(req.body);
  const f = await healthService.patchFacility(req.params.id, body, req);
  res.json(f);
}

export async function deleteFacility(req: Request, res: Response): Promise<void> {
  await healthService.removeFacility(req.params.id, req);
  res.status(204).send();
}

export async function dashboard(req: Request, res: Response): Promise<void> {
  const data = await healthService.healthDashboard(req);
  res.json(data);
}
