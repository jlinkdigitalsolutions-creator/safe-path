import { api } from "@/services/api";

export async function fetchHealthDashboard() {
  const { data } = await api.get("/health-support/dashboard/summary");
  return data as {
    campaigns: Array<Record<string, unknown>>;
    messages: Array<Record<string, unknown>>;
    facilities: Array<Record<string, unknown>>;
    stats: {
      totalReach: number;
      avgVaccinationCoverage: number;
      facilityCount: number;
      facilitiesByRegion: { region: string; count: number }[];
    };
  };
}

export async function fetchCampaigns() {
  const { data } = await api.get("/health-support/vaccination-campaigns");
  return data as Record<string, unknown>[];
}

export async function fetchHealthMessages() {
  const { data } = await api.get("/health-support/health-messages");
  return data as Record<string, unknown>[];
}

export async function fetchFacilities(params?: Record<string, string>) {
  const { data } = await api.get("/health-support/facilities", { params });
  return data as Record<string, unknown>[];
}

export async function createCampaign(payload: Record<string, unknown>) {
  const { data } = await api.post("/health-support/vaccination-campaigns", payload);
  return data;
}

export async function updateCampaign(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(
    `/health-support/vaccination-campaigns/${id}`,
    payload
  );
  return data;
}

export async function deleteCampaign(id: string) {
  await api.delete(`/health-support/vaccination-campaigns/${id}`);
}

export async function sendCampaignReminders(id: string) {
  const { data } = await api.post(
    `/health-support/vaccination-campaigns/${id}/send-reminders`
  );
  return data as { ok: boolean; message: string };
}

export async function createHealthMessage(payload: Record<string, unknown>) {
  const { data } = await api.post("/health-support/health-messages", payload);
  return data;
}

export async function updateHealthMessage(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/health-support/health-messages/${id}`, payload);
  return data;
}

export async function deleteHealthMessage(id: string) {
  await api.delete(`/health-support/health-messages/${id}`);
}

export async function broadcastHealthMessage(id: string) {
  const { data } = await api.post(
    `/health-support/health-messages/${id}/broadcast`
  );
  return data as { ok: boolean; message: string };
}

export async function createFacility(payload: Record<string, unknown>) {
  const { data } = await api.post("/health-support/facilities", payload);
  return data;
}

export async function updateFacility(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/health-support/facilities/${id}`, payload);
  return data;
}

export async function deleteFacility(id: string) {
  await api.delete(`/health-support/facilities/${id}`);
}
