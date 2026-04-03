"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchRoleCatalog,
  fetchUsers,
  registerUser,
  setUserRoles,
  updateUser,
  type UserRow,
} from "@/services/modules/userService";
import { hasPermission } from "@/store/authStore";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function roleNamesFromUser(u: UserRow): string[] {
  const roles = u.Roles ?? [];
  return roles.map((r) => r.name);
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const usersQ = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
  });
  const rolesQ = useQuery({
    queryKey: ["admin-roles"],
    queryFn: fetchRoleCatalog,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [rolesUser, setRolesUser] = useState<UserRow | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState("social_worker");

  const createMut = useMutation({
    mutationFn: () =>
      registerUser({
        email: newEmail,
        password: newPassword,
        fullName: newName,
        phone: newPhone || undefined,
        roleName: newRole,
      }),
    onSuccess: () => {
      toast.success("User created");
      setCreateOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      setNewPhone("");
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? "Create failed");
    },
  });

  const toggleActiveMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateUser(id, { isActive }),
    onSuccess: () => {
      toast.success("User updated");
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Update failed"),
  });

  const rolesMut = useMutation({
    mutationFn: ({ id, roleNames }: { id: string; roleNames: string[] }) =>
      setUserRoles(id, roleNames),
    onSuccess: () => {
      toast.success("Roles updated");
      setRolesUser(null);
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message ?? "Could not update roles");
    },
  });

  function openRolesDialog(u: UserRow) {
    setRolesUser(u);
    setSelectedRoles(new Set(roleNamesFromUser(u)));
  }

  function toggleRole(name: string) {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const loading = usersQ.isLoading || rolesQ.isLoading;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Users</h2>
        <p className="text-sm text-muted-foreground">Accounts and roles.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>All users</CardTitle>
            <CardDescription>Team members and roles</CardDescription>
          </div>
          {hasPermission("users:create") && (
            <Button className="rounded-2xl" onClick={() => setCreateOpen(true)}>
              Add user
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Roles</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(usersQ.data ?? []).map((u) => {
                    const isSelf = u.id === currentUserId;
                    const names = roleNamesFromUser(u);
                    return (
                      <tr key={u.id} className="border-b border-border/40">
                        <td className="py-3 pr-4 font-medium">{u.fullName}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{u.email}</td>
                        <td className="py-3 pr-4">
                          {u.isActive ? (
                            <Badge>Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {names.map((r) => (
                              <Badge key={r} variant="outline" className="text-[10px]">
                                {r.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-2">
                            {hasPermission("users:update") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl"
                                disabled={isSelf}
                                onClick={() =>
                                  toggleActiveMut.mutate({
                                    id: u.id,
                                    isActive: !u.isActive,
                                  })
                                }
                              >
                                {u.isActive ? "Deactivate" : "Activate"}
                              </Button>
                            )}
                            {hasPermission("users:assign_role") && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="rounded-xl"
                                disabled={isSelf}
                                onClick={() => openRolesDialog(u)}
                              >
                                Roles
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New user</DialogTitle>
            <DialogDescription>
              Creates a login with the selected default role. Password min. 8 characters.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input className="rounded-xl" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                className="rounded-xl"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                className="rounded-xl"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone (optional)</Label>
              <Input className="rounded-xl" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                {(rolesQ.data ?? []).map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <Button
              className="rounded-xl"
              disabled={
                !newEmail || !newPassword || newPassword.length < 8 || !newName || createMut.isPending
              }
              onClick={() => createMut.mutate()}
            >
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rolesUser} onOpenChange={(o) => !o && setRolesUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign roles</DialogTitle>
            <DialogDescription>
              {rolesUser?.fullName} — select at least one role. You cannot edit your own account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {(rolesQ.data ?? []).map((r) => (
              <label
                key={r.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 px-3 py-2"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  checked={selectedRoles.has(r.name)}
                  onChange={() => toggleRole(r.name)}
                />
                <span className="text-sm font-medium">{r.name.replace(/_/g, " ")}</span>
              </label>
            ))}
            <Button
              className="w-full rounded-xl"
              disabled={selectedRoles.size === 0 || rolesMut.isPending}
              onClick={() => {
                if (!rolesUser) return;
                rolesMut.mutate({
                  id: rolesUser.id,
                  roleNames: Array.from(selectedRoles),
                });
              }}
            >
              Save roles
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
