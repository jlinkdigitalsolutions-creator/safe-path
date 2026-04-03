import {
  findUserWithAccess,
  findUserWithAccessById,
  flattenPermissions,
  flattenRoles,
  saveRefreshToken,
  findRefreshByHash,
  revokeRefreshToken,
  type UserWithRoles,
} from "./auth.repository.js";
import { verifyPassword, hashPassword } from "../../shared/utils/password.js";
import { signAccessToken } from "../../shared/utils/jwt.js";
import {
  hashToken,
  generateOpaqueRefreshToken,
} from "../../shared/utils/crypto.js";
import { env } from "../../config/env.js";
import { writeAudit } from "../../shared/services/audit.service.js";
import { User, UserRole } from "../../database/models/index.js";
import type { Request } from "express";

function parseRefreshTtlMs(): number {
  const raw = env.jwtRefreshExpires.trim();
  const m = raw.match(/^(\d+)([dhms])$/);
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(m[1]);
  const u = m[2];
  const mult =
    u === "d"
      ? 86400000
      : u === "h"
        ? 3600000
        : u === "m"
          ? 60000
          : 1000;
  return n * mult;
}

function refreshExpiresDate(): Date {
  return new Date(Date.now() + parseRefreshTtlMs());
}

export async function login(
  email: string,
  password: string,
  req: Request
) {
  const user = await findUserWithAccess(email);
  if (!user || !user.isActive) {
    await writeAudit({
      userId: null,
      action: "auth.login_failed",
      entityType: "user",
      details: { email },
      req,
    });
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    await writeAudit({
      userId: user.id,
      action: "auth.login_failed",
      entityType: "user",
      entityId: user.id,
      req,
    });
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }

  const roles = flattenRoles(user as UserWithRoles);
  const permissions = flattenPermissions(user as UserWithRoles);
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    roles,
    permissions,
  });

  const refreshToken = generateOpaqueRefreshToken();
  await saveRefreshToken(
    user.id,
    hashToken(refreshToken),
    refreshExpiresDate()
  );

  await writeAudit({
    userId: user.id,
    action: "auth.login",
    entityType: "user",
    entityId: user.id,
    req,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
      permissions,
    },
  };
}

export async function refreshSession(refreshToken: string, req: Request) {
  const record = await findRefreshByHash(hashToken(refreshToken));
  if (!record || record.expiresAt < new Date()) {
    throw Object.assign(new Error("Invalid refresh token"), { status: 401 });
  }

  const user = await findUserWithAccessById(record.userId);
  if (!user || !user.isActive) {
    throw Object.assign(new Error("Invalid refresh token"), { status: 401 });
  }

  await revokeRefreshToken(record.id);

  const roles = flattenRoles(user as UserWithRoles);
  const permissions = flattenPermissions(user as UserWithRoles);
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    roles,
    permissions,
  });

  const newRefresh = generateOpaqueRefreshToken();
  await saveRefreshToken(
    user.id,
    hashToken(newRefresh),
    refreshExpiresDate()
  );

  await writeAudit({
    userId: user.id,
    action: "auth.refresh",
    entityType: "user",
    entityId: user.id,
    req,
  });

  return {
    accessToken,
    refreshToken: newRefresh,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
      permissions,
    },
  };
}

export async function logout(refreshToken: string | undefined, req: Request) {
  if (!refreshToken) return;
  const record = await findRefreshByHash(hashToken(refreshToken));
  if (record) {
    await revokeRefreshToken(record.id);
    await writeAudit({
      userId: record.userId,
      action: "auth.logout",
      entityType: "user",
      entityId: record.userId,
      req,
    });
  }
}

export async function registerUser(
  params: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    roleName: string;
  },
  actorId: string,
  req: Request
) {
  const existing = await User.findOne({
    where: { email: params.email.toLowerCase() },
  });
  if (existing) {
    throw Object.assign(new Error("Email already registered"), { status: 409 });
  }
  const passwordHash = await hashPassword(params.password);
  const user = await User.create({
    email: params.email.toLowerCase(),
    passwordHash,
    fullName: params.fullName,
    phone: params.phone ?? null,
  });
  const { Role } = await import("../../database/models/index.js");
  const role = await Role.findOne({ where: { name: params.roleName } });
  if (!role) {
    throw Object.assign(new Error("Role not found"), { status: 400 });
  }
  await UserRole.create({ userId: user.id, roleId: role.id });
  await writeAudit({
    userId: actorId,
    action: "users.create",
    entityType: "user",
    entityId: user.id,
    details: { email: user.email, role: params.roleName },
    req,
  });
  const full = await findUserWithAccessById(user.id);
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roles: full ? flattenRoles(full as UserWithRoles) : [params.roleName],
    permissions: full ? flattenPermissions(full as UserWithRoles) : [],
  };
}
