import type { Request, Response } from "express";
import { z } from "zod";
import * as notificationService from "./notification.service.js";

const listQuery = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
});

export async function list(req: Request, res: Response): Promise<void> {
  const q = listQuery.parse(req.query);
  const page = Math.max(1, q.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, q.pageSize ?? 20));
  const result = await notificationService.listMine(
    req.auth!.userId,
    page,
    pageSize
  );
  res.json({
    data: result.rows,
    total: result.count,
    page,
    pageSize,
  });
}

const markSchema = z.object({ id: z.string().uuid() });

export async function markRead(req: Request, res: Response): Promise<void> {
  const { id } = markSchema.parse(req.params);
  const n = await notificationService.markAsRead(id, req.auth!.userId);
  if (!n) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(n);
}
