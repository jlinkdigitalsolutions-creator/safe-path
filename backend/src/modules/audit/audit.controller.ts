import type { Request, Response } from "express";
import { z } from "zod";
import * as auditService from "./audit.service.js";

const qSchema = z.object({
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
});

export async function list(req: Request, res: Response): Promise<void> {
  const q = qSchema.parse(req.query);
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 50;
  const { rows, count } = await auditService.list(page, pageSize);
  res.json({
    data: rows,
    total: count,
    page,
    pageSize,
  });
}
