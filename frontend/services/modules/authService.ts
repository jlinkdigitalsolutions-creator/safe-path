import { api } from "@/services/api";
import type { AuthUser } from "@/store/authStore";

export async function login(email: string, password: string) {
  const { data } = await api.post<{
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  }>("/auth/login", { email, password });
  return data;
}

export async function logout(refreshToken: string | null) {
  await api.post("/auth/logout", { refreshToken });
}

export async function fetchMe() {
  const { data } = await api.get<{ user: AuthUser }>("/auth/me");
  return data.user;
}
