import { AuditLog } from "../../database/models/index.js";
import type { Request } from "express";

export async function writeAudit(params: {
  userId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
  req?: Request;
}): Promise<void> {
  const ip =
    params.req?.ip ||
    (params.req?.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    null;
  await AuditLog.create({
    userId: params.userId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    details: params.details ?? null,
    ipAddress: ip,
  });
}
