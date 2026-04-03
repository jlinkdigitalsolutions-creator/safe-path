import { createHash, randomBytes } from "crypto";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Opaque refresh token (stored hashed server-side). */
export function generateOpaqueRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}
