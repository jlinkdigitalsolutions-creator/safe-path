import * as repo from "./users.repository.js";
import { writeAudit } from "../../shared/services/audit.service.js";
import type { Request } from "express";

export async function list(req: Request) {
  const users = await repo.listUsers();
  await writeAudit({
    userId: req.auth!.userId,
    action: "users.list",
    entityType: "user",
    req,
  });
  return users;
}

export async function listRolesCatalog() {
  return repo.listRoles();
}

export async function updateUser(
  id: string,
  body: { fullName?: string; phone?: string | null; isActive?: boolean },
  actorId: string,
  req: Request
) {
  const user = await repo.findUserById(id);
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }
  if (actorId === id && body.isActive === false) {
    throw Object.assign(new Error("You cannot deactivate your own account"), {
      status: 400,
    });
  }
  await repo.updateUserFields(id, body);
  const updated = await repo.findUserById(id);
  await writeAudit({
    userId: actorId,
    action: "users.update",
    entityType: "user",
    entityId: id,
    details: body,
    req,
  });
  return updated;
}

export async function setUserRoles(
  userId: string,
  roleNames: string[],
  actorId: string,
  req: Request
) {
  const user = await repo.findUserById(userId);
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }
  const found = await repo.findRoleIdsByNames(roleNames);
  if (found.length !== roleNames.length) {
    const missing = roleNames.filter(
      (n) => !found.some((r) => r.name === n)
    );
    throw Object.assign(
      new Error(`Unknown role(s): ${missing.join(", ")}`),
      { status: 400 }
    );
  }
  if (actorId === userId) {
    throw Object.assign(
      new Error("You cannot change your own roles; ask another administrator."),
      { status: 400 }
    );
  }
  await repo.replaceUserRoles(
    userId,
    found.map((r) => r.id)
  );
  const updated = await repo.findUserById(userId);
  await writeAudit({
    userId: actorId,
    action: "users.assign_role",
    entityType: "user",
    entityId: userId,
    details: { roleNames },
    req,
  });
  return updated;
}
