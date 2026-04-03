import { api } from "@/services/api";

export type RoleRow = {
  id: string;
  name: string;
  description: string | null;
};

export type UserRow = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  Roles?: RoleRow[];
};

export async function fetchUsers() {
  const { data } = await api.get<UserRow[]>("/users");
  return data;
}

export async function fetchRoleCatalog() {
  const { data } = await api.get<RoleRow[]>("/users/roles");
  return data;
}

export async function updateUser(
  id: string,
  body: { fullName?: string; phone?: string | null; isActive?: boolean }
) {
  const { data } = await api.patch<UserRow>(`/users/${id}`, body);
  return data;
}

export async function setUserRoles(id: string, roleNames: string[]) {
  const { data } = await api.put<UserRow>(`/users/${id}/roles`, { roleNames });
  return data;
}

export async function registerUser(body: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  roleName: string;
}) {
  const { data } = await api.post("/auth/register", body);
  return data as UserRow;
}
