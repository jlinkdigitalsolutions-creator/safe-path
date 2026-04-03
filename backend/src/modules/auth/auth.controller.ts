import type { Request, Response } from "express";
import { z } from "zod";
import * as authService from "./auth.service.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  roleName: z.string().min(1),
});

export async function login(req: Request, res: Response): Promise<void> {
  const body = loginSchema.parse(req.body);
  const result = await authService.login(body.email, body.password, req);
  res.json(result);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const body = refreshSchema.parse(req.body);
  const result = await authService.refreshSession(body.refreshToken, req);
  res.json(result);
}

export async function logout(req: Request, res: Response): Promise<void> {
  const body = refreshSchema.partial().parse(req.body);
  await authService.logout(body.refreshToken, req);
  res.status(204).send();
}

export async function register(req: Request, res: Response): Promise<void> {
  const body = registerSchema.parse(req.body);
  const actorId = req.auth!.userId;
  const user = await authService.registerUser(body, actorId, req);
  res.status(201).json(user);
}

export async function me(req: Request, res: Response): Promise<void> {
  res.json({
    user: {
      id: req.auth!.userId,
      email: req.auth!.email,
      roles: req.auth!.roles,
      permissions: req.auth!.permissions,
    },
  });
}
