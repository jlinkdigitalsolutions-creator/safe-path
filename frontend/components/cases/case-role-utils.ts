export const CASE_ROLE_ORDER = [
  "admin",
  "social_worker",
  "ngo_staff",
  "police",
  "legal_counsel",
  "viewer",
] as const;

export function primaryCaseRole(roles: string[]): string {
  for (const r of CASE_ROLE_ORDER) {
    if (roles.includes(r)) return r;
  }
  return roles[0] ?? "viewer";
}

/** Which referral quick-add types this role may create in the UI (server still enforces case:refer). */
export function canCreateReferralType(
  roles: string[],
  type: "police" | "legal" | "shelter" | "health"
): boolean {
  const pr = primaryCaseRole(roles);
  if (pr === "admin" || pr === "social_worker" || pr === "ngo_staff") return true;
  if (pr === "police") return type === "police";
  if (pr === "legal_counsel") return type === "legal";
  return false;
}
