export const PERMISSIONS = [
  "users:read",
  "users:create",
  "users:update",
  "users:assign_role",
  "case:create",
  "case:read",
  "case:update",
  "case:assign",
  "case:refer",
  "case:delete",
  "health:read",
  "health:create",
  "health:update",
  "health:delete",
  "notifications:read",
  "notifications:send",
  "audit:read",
  "dashboard:view",
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];

export const ROLES = [
  "admin",
  "social_worker",
  "police",
  "ngo_staff",
  "legal_counsel",
  "health_officer",
  "viewer",
] as const;

export type RoleKey = (typeof ROLES)[number];
