import { api } from "@/services/api";

export type ReferralRow = {
  id: string;
  caseId: string;
  type: string;
  status: string;
  destinationName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type ReferralListCaseSnippet = {
  id: string;
  caseNumber: string;
  region: string;
  district: string;
  urgency: string;
  status: string;
  type: string;
};

export type ReferralListRow = ReferralRow & {
  Case: ReferralListCaseSnippet;
};

export type CaseAssignmentRow = {
  id: string;
  assigneeId: string;
  active: boolean;
  notes: string | null;
  Assignee?: { id: string; fullName: string; email: string };
};

export type CaseRow = {
  id: string;
  caseNumber: string;
  country?: string;
  type: string;
  region: string;
  district: string;
  kebele?: string;
  urgency: string;
  status: string;
  summary?: string | null;
  createdAt: string;
};

export type CaseDetail = CaseRow & {
  Referrals?: ReferralRow[];
  CaseAssignments?: CaseAssignmentRow[];
};

export type AssignableUser = {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
};

export type CaseAnalytics = {
  total: number;
  byRegion: Record<string, string | number>[];
  byDistrict: Record<string, string | number>[];
  byCountry: Record<string, string | number>[];
  byType: Record<string, string | number>[];
  byStatus: Record<string, string | number>[];
  byUrgency: Record<string, string | number>[];
  referralOutcomes: { status: string; count: string }[];
  referralsByType: { type: string; count: string }[];
  survivorsReceivingSupport: number;
  generatedAt: string;
};

export async function fetchCases(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  type?: string;
  region?: string;
  district?: string;
  country?: string;
  urgency?: string;
  assignedToMe?: boolean;
} = {}) {
  const { assignedToMe, ...rest } = params;
  const { data } = await api.get<{
    data: CaseRow[];
    total: number;
    page: number;
    pageSize: number;
  }>("/case-management/cases", {
    params: {
      ...rest,
      ...(assignedToMe ? { assignedToMe: "true" } : {}),
    },
  });
  return data;
}

export async function fetchCaseAnalytics() {
  const { data } = await api.get<CaseAnalytics>("/case-management/analytics/summary");
  return data;
}

export async function createCase(payload: Record<string, unknown>) {
  const { data } = await api.post("/case-management/cases", payload);
  return data;
}

export async function updateCase(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/case-management/cases/${id}`, payload);
  return data;
}

export async function deleteCase(id: string) {
  await api.delete(`/case-management/cases/${id}`);
}

export async function fetchCaseById(id: string) {
  const { data } = await api.get<CaseDetail>(`/case-management/cases/${id}`);
  return data;
}

export async function fetchReferrals(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  type?: string;
}) {
  const { data } = await api.get<{
    data: ReferralListRow[];
    total: number;
    page: number;
    pageSize: number;
  }>("/case-management/referrals", { params });
  return data;
}

export async function fetchCaseAssignees() {
  const { data } = await api.get<AssignableUser[]>("/case-management/assignees");
  return data;
}

export async function assignCase(
  caseId: string,
  body: { assigneeId: string; notes?: string | null }
) {
  const { data } = await api.post(`/case-management/cases/${caseId}/assign`, body);
  return data;
}

export async function addCaseReferral(
  caseId: string,
  body: {
    type: "shelter" | "legal" | "health" | "police";
    destinationName?: string | null;
    notes?: string | null;
  }
) {
  const { data } = await api.post(`/case-management/cases/${caseId}/referrals`, body);
  return data;
}

export async function patchCaseReferral(
  referralId: string,
  body: {
    status?: "pending" | "in_progress" | "completed" | "cancelled";
    notes?: string | null;
    destinationName?: string | null;
  }
) {
  const { data } = await api.patch(`/case-management/referrals/${referralId}`, body);
  return data;
}

export async function downloadCasesExport(
  params: Record<string, string | undefined>
) {
  const res = await api.get("/case-management/reports/export", {
    params,
    responseType: "blob",
  });
  const blob = new Blob([res.data as BlobPart], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `safepath-cases-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
