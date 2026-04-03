import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { PermissionKey } from "../constants/permissions.js";

export type AccessPayload = {
  sub: string;
  email: string;
  roles: string[];
  permissions: PermissionKey[];
  typ: "access";
};

export function signAccessToken(payload: Omit<AccessPayload, "typ">): string {
  const full: AccessPayload = { ...payload, typ: "access" };
  const opts: SignOptions = {
    expiresIn: env.jwtAccessExpires as SignOptions["expiresIn"],
    issuer: "safepath",
  };
  return jwt.sign(full, env.jwtAccessSecret, opts);
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.jwtAccessSecret, {
    issuer: "safepath",
  });
  if (typeof decoded !== "object" || decoded === null || !("typ" in decoded))
    throw new Error("Invalid token");
  const p = decoded as AccessPayload;
  if (p.typ !== "access") throw new Error("Invalid token type");
  return p;
}
