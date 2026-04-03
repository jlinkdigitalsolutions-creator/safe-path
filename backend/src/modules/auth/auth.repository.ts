import {
  User,
  Role,
  Permission,
  RefreshToken,
} from "../../database/models/index.js";
import type { PermissionKey } from "../../shared/constants/permissions.js";

export type UserWithRoles = User & {
  Roles?: (Role & { Permissions?: Permission[] })[];
};

export async function findUserWithAccess(email: string) {
  return User.findOne({
    where: { email: email.toLowerCase() },
    include: [
      {
        model: Role,
        through: { attributes: [] },
        include: [
          {
            model: Permission,
            through: { attributes: [] },
          },
        ],
      },
    ],
  });
}

export async function findUserWithAccessById(id: string) {
  return User.findByPk(id, {
    include: [
      {
        model: Role,
        through: { attributes: [] },
        include: [
          {
            model: Permission,
            through: { attributes: [] },
          },
        ],
      },
    ],
  });
}

export function flattenPermissions(user: UserWithRoles): PermissionKey[] {
  const keys = new Set<string>();
  const roles = user.Roles ?? [];
  for (const role of roles) {
    const perms = role.Permissions ?? [];
    for (const p of perms) {
      keys.add(p.key);
    }
  }
  return [...keys] as PermissionKey[];
}

export function flattenRoles(user: UserWithRoles): string[] {
  return (user.Roles ?? []).map((r) => r.name);
}

export async function saveRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date
) {
  return RefreshToken.create({ userId, tokenHash, expiresAt });
}

export async function findRefreshByHash(tokenHash: string) {
  return RefreshToken.findOne({
    where: { tokenHash, revokedAt: null },
    include: [User],
  });
}

export async function revokeRefreshToken(id: string) {
  await RefreshToken.update(
    { revokedAt: new Date() },
    { where: { id } }
  );
}
