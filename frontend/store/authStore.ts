import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setSession: (payload: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  }) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user }),
      clearSession: () =>
        set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: "safepath-auth" }
  )
);

export function hasPermission(permission: string) {
  const perms = useAuthStore.getState().user?.permissions ?? [];
  return perms.includes(permission);
}

const CASE_MODULE_PERMS = [
  "case:read",
  "case:create",
  "case:update",
  "case:assign",
  "case:refer",
  "case:delete",
] as const;

const HEALTH_MODULE_PERMS = [
  "health:read",
  "health:create",
  "health:update",
  "health:delete",
] as const;

export function canAccessCaseModule() {
  return CASE_MODULE_PERMS.some((p) => hasPermission(p));
}

export function canAccessHealthModule() {
  return HEALTH_MODULE_PERMS.some((p) => hasPermission(p));
}

export function canAccessAdminModule() {
  return hasPermission("users:read");
}
