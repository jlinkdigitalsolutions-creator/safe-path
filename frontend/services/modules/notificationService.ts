import { api } from "@/services/api";

export async function fetchNotifications(page = 1, pageSize = 30) {
  const { data } = await api.get<{
    data: Array<{
      id: string;
      title: string;
      body: string;
      read: boolean;
      createdAt: string;
      meta?: Record<string, unknown>;
    }>;
    total: number;
  }>("/notifications", { params: { page, pageSize } });
  return data;
}

export async function markNotificationRead(id: string) {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
}
