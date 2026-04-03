"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCases,
  createCase,
  deleteCase,
  type CaseRow,
} from "@/services/modules/caseService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { hasPermission } from "@/store/authStore";
import { ListFilter, Pencil, Plus, Share2, Trash2, UserCheck, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CaseIntakeForm } from "@/components/cases/case-intake-form";
import { CaseEditDialog } from "@/components/cases/case-edit-dialog";
import { CaseAssignmentDialog } from "@/components/cases/case-assignment-dialog";
import { CaseReferralDialog } from "@/components/cases/case-referral-dialog";
import { SearchToolbar } from "@/components/health/search-toolbar";
import { formatCaseStatusLabel, type CaseWorkflowStatus } from "@/lib/case-status";

function caseStatusBadgeClass(status: string): string {
  const s = status as CaseWorkflowStatus;
  if (s === "closed")
    return "border-muted-foreground/25 bg-muted/60 text-muted-foreground";
  if (s === "resolved") return "border-success/40 bg-success/10 text-success";
  if (s === "forwarded") return "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200";
  if (s === "in_progress") return "border-primary/30 bg-primary/10 text-primary";
  return "";
}

type Scope = "all" | "mine";

export default function CasesPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CaseRow | null>(null);
  const [assigning, setAssigning] = useState<CaseRow | null>(null);
  const [referring, setReferring] = useState<CaseRow | null>(null);

  useEffect(() => {
    if (searchParams.get("scope") === "mine") setScope("mine");
  }, [searchParams]);

  function setScopeAndUrl(next: Scope) {
    setScope(next);
    const q = new URLSearchParams(searchParams.toString());
    if (next === "mine") q.set("scope", "mine");
    else q.delete("scope");
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  const { data, isLoading } = useQuery({
    queryKey: ["cases", search, scope],
    queryFn: () =>
      fetchCases({
        page: 1,
        pageSize: 50,
        search: search || undefined,
        assignedToMe: scope === "mine",
      }),
  });

  const createMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) => createCase(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["cases"] });
      void qc.invalidateQueries({ queryKey: ["case-analytics"] });
      toast.success("Case created");
      setOpen(false);
    },
    onError: () => toast.error("Create failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCase(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["cases"] });
      void qc.invalidateQueries({ queryKey: ["case-analytics"] });
      toast.success("Case deleted");
    },
    onError: () => toast.error("Delete failed"),
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Case registry</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Search and open the case editor, assignment, or referrals — each action matches your permissions.
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="inline-flex rounded-xl border border-border/80 bg-muted/30 p-1">
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                scope === "all"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setScopeAndUrl("all")}
            >
              <ListFilter className="h-4 w-4" />
              All cases
            </button>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                scope === "mine"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setScopeAndUrl("mine")}
            >
              <UserCheck className="h-4 w-4" />
              My assignments
            </button>
          </div>
          <SearchToolbar
            value={search}
            onChange={(v) => {
              setSearch(v);
            }}
            placeholder="Search case number, district, summary…"
          />
          {hasPermission("case:create") && (
            <Button className="rounded-xl" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              New case
            </Button>
          )}
        </div>
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg">
              {scope === "mine" ? "Assigned to you" : "All cases"}
            </CardTitle>
            <CardDescription>
              {data
                ? `${data.total} ${scope === "mine" ? "assigned" : "total"}`
                : isLoading
                  ? "Loading…"
                  : "—"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 sm:px-6">
          {isLoading ? (
            <div className="space-y-2 px-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-y border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Case</th>
                  <th className="py-3 pr-4 font-medium">Country</th>
                  <th className="py-3 pr-4 font-medium">Region / District</th>
                  <th className="py-3 pr-4 font-medium">Type</th>
                  <th className="py-3 pr-4 font-medium">Urgency</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((c) => (
                  <tr
                    key={c.id}
                    className={cn(
                      "border-b border-border/40 last:border-0",
                      scope === "mine" && "bg-primary/[0.03]"
                    )}
                  >
                    <td className="px-6 py-3 font-medium">{c.caseNumber}</td>
                    <td className="py-3 pr-4">
                      {(c as CaseRow & { country?: string }).country ?? "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {c.region}
                      <span className="text-muted-foreground"> · {c.district}</span>
                    </td>
                    <td className="py-3 pr-4 capitalize">{c.type}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className="capitalize">
                        {c.urgency}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant="outline"
                        className={cn("capitalize", caseStatusBadgeClass(c.status))}
                      >
                        {formatCaseStatusLabel(c.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        {hasPermission("case:update") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-lg"
                            onClick={() => setEditing(c)}
                            title="Edit case"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission("case:assign") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-lg"
                            onClick={() => setAssigning(c)}
                            title="Assign case"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission("case:refer") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-lg"
                            onClick={() => setReferring(c)}
                            title="Referrals"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission("case:delete") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-lg text-destructive"
                            onClick={() => {
                              if (
                                confirm(
                                  `Delete case ${c.caseNumber}? This cannot be undone.`
                                )
                              ) {
                                deleteMut.mutate(c.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New case</DialogTitle>
            <DialogDescription>
              Intake creates the case and notifies officers; reporters receive acknowledgement when not
              anonymous.
            </DialogDescription>
          </DialogHeader>
          <CaseIntakeForm onSubmit={(values) => createMut.mutate(values)} loading={createMut.isPending} />
        </DialogContent>
      </Dialog>

      <CaseEditDialog
        row={editing}
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
      />
      <CaseAssignmentDialog
        row={assigning}
        open={!!assigning}
        onOpenChange={(v) => !v && setAssigning(null)}
      />
      <CaseReferralDialog
        row={referring}
        open={!!referring}
        onOpenChange={(v) => !v && setReferring(null)}
      />
    </div>
  );
}
