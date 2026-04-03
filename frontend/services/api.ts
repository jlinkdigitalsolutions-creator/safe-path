import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const cfg = original as { _retry?: boolean } | undefined;
    if (
      error.response?.status === 401 &&
      original &&
      !cfg?._retry &&
      useAuthStore.getState().refreshToken
    ) {
      (original as { _retry?: boolean })._retry = true;
      try {
        const { data } = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken: useAuthStore.getState().refreshToken,
        });
        useAuthStore.getState().setSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
        });
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().clearSession();
      }
    }
    return Promise.reject(error);
  }
);
