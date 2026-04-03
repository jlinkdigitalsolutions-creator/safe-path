import type { Request, Response } from "express";
import { z } from "zod";
import * as usersService from "./users.service.js";

export async function list(req: Request, res: Response): Promise<void> {
  const users = await usersService.list(req);
  res.json(users);
}

export async function rolesCatalog(_req: Request, res: Response): Promise<void> {
  const roles = await usersService.listRolesCatalog();
  res.json(roles);
}

const patchUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function patchUser(req: Request, res: Response): Promise<void> {
  const id = z.string().uuid().parse(req.params.id);
  const body = patchUserSchema.parse(req.body);
  const user = await usersService.updateUser(
    id,
    body,
    req.auth!.userId,
    req
  );
  res.json(user);
}

const putRolesSchema = z.object({
  roleNames: z.array(z.string().min(1)).min(1),
});

export async function putRoles(req: Request, res: Response): Promise<void> {
  const id = z.string().uuid().parse(req.params.id);
  const body = putRolesSchema.parse(req.body);
  const user = await usersService.setUserRoles(
    id,
    body.roleNames,
    req.auth!.userId,
    req
  );
  res.json(user);
}
