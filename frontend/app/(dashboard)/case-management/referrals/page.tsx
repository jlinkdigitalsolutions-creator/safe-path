"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import {
  fetchReferrals,
  patchCaseReferral,
  type ReferralListRow,
} from "@/services/modules/caseService";
import { hasPermission } from "@/store/authStore";
import {
  CaseReferralDialog,
  type CaseReferralSummary,
} from "@/components/cases/case-referral-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchToolbar } from "@/components/health/search-toolbar";
import { toast } from "sonner";
import { ExternalLink, Pencil } from "lucide-react";

const REF_STATUSES = ["pending", "in_progress", "completed", "cancelled"] as const;
const REF_TYPES = ["police", "legal", "shelter", "health"] as const;

function formatShortDate(iso: string | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function ReferralsManagementPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const [coordCase, setCoordCase] = useState<CaseReferralSummary | null>(null);
  const [coordOpen, setCoordOpen] = useState(false);
  const [editRow, setEditRow] = useState<ReferralListRow | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editDestination, setEditDestination] = useState("");

  const canManage = hasPermission("case:refer");

  const query = useQuery({
    queryKey: ["referrals", page, search, statusFilter, typeFilter, pageSize],
    queryFn: () =>
      fetchReferrals({
        page,
        pageSize,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      }),
  });

  const patchMut = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof patchCaseReferral>[1];
    }) => patchCaseReferral(id, body),
    onSuccess: () => {
      toast.success("Referral updated");
      void qc.invalidateQueries({ queryKey: ["referrals"] });
      void qc.invalidateQueries({ queryKey: ["case-analytics"] });
      void qc.invalidateQueries({ queryKey: ["case-detail"] });
    },
    onError: () => toast.error("Update failed"),
  });

  const totalPages =
    query.data == null || query.data.total === 0
      ? 1
      : Math.ceil(query.data.total / pageSize);

  function openCoordinator(row: ReferralListRow) {
    setCoordCase({ id: row.Case.id, caseNumber: row.Case.caseNumber });
    setCoordOpen(true);
  }

  function openEditDetails(row: ReferralListRow) {
    setEditRow(row);
    setEditNotes(row.notes ?? "");
    setEditDestination(row.destinationName ?? "");
  }

  function saveEditDetails() {
    if (!editRow) return;
    patchMut.mutate(
      {
        id: editRow.id,
        body: {
          notes: editNotes.trim() || null,
          destinationName: editDestination.trim() || null,
        },
      },
      {
        onSuccess: () => {
          setEditRow(null);
        },
      }
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Referral management</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            All case referrals in one place. Filter by status or type; coordinators can update progress and
            notes from here.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <SearchToolbar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search case number, region…"
          />
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <select
                className="flex h-10 min-w-[140px] rounded-xl border border-input bg-background px-3 text-sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All statuses</option>
                {REF_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <select
                className="flex h-10 min-w-[140px] rounded-xl border border-input bg-background px-3 text-sm"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All types</option>
                {REF_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg">Referrals</CardTitle>
            <CardDescription>
              {query.data
                ? `${query.data.total} total · page ${query.data.page} of ${Math.max(1, totalPages)}`
                : query.isLoading
                  ? "Loading…"
                  : "—"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 sm:px-6">
          {query.isLoading ? (
            <div className="space-y-2 px-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : (
            <>
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead>
                  <tr className="border-y border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Case</th>
                    <th className="py-3 pr-4 font-medium">Location</th>
                    <th className="py-3 pr-4 font-medium">Type</th>
                    <th className="py-3 pr-4 font-medium">Destination</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Updated</th>
                    <th className="px-6 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(query.data?.data ?? []).map((r) => (
                    <tr key={r.id} className="border-b border-border/40 last:border-0">
                      <td className="px-6 py-3">
                        <div className="font-medium">{r.Case.caseNumber}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          Case {r.Case.status.replace(/_/g, " ")} · {r.Case.urgency}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        {r.Case.region}
                        <span className="text-muted-foreground"> · {r.Case.district}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className="capitalize">
                          {r.type}
                        </Badge>
                      </td>
                      <td className="max-w-[200px] truncate py-3 pr-4 text-muted-foreground">
                        {r.destinationName ?? "—"}
                      </td>
                      <td className="py-3 pr-4">
                        {canManage ? (
                          <select
                            className="h-9 max-w-[150px] rounded-lg border border-input bg-background px-2 text-xs capitalize"
                            value={r.status}
                            onChange={(e) =>
                              patchMut.mutate({
                                id: r.id,
                                body: {
                                  status: e.target.value as (typeof REF_STATUSES)[number],
                                },
                              })
                            }
                            disabled={patchMut.isPending}
                          >
                            {REF_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="capitalize text-muted-foreground">
                            {r.status.replace(/_/g, " ")}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {formatShortDate(r.updatedAt ?? r.createdAt)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button variant="ghost" size="sm" className="rounded-lg gap-1" asChild>
                            <Link href="/case-management/cases" title="Open case registry">
                              <ExternalLink className="h-4 w-4" />
                              Registry
                            </Link>
                          </Button>
                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-lg"
                                onClick={() => openEditDetails(r)}
                              >
                                <Pencil className="h-4 w-4" />
                                Details
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-lg"
                                onClick={() => openCoordinator(r)}
                              >
                                Coordinate
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {query.data && query.data.data.length === 0 && (
                <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No referrals match these filters.
                </p>
              )}
              {query.data && totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2 border-t border-border/60 px-6 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <CaseReferralDialog
        row={coordCase}
        open={coordOpen}
        onOpenChange={(open) => {
          setCoordOpen(open);
          if (!open) setCoordCase(null);
        }}
      />

      <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Referral details</DialogTitle>
            <DialogDescription>
              Update destination label and notes. Case {editRow?.Case.caseNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Destination</Label>
              <Input
                className="rounded-xl"
                value={editDestination}
                onChange={(e) => setEditDestination(e.target.value)}
                placeholder="Organization or contact"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <textarea
                className="min-h-[100px] rounded-xl border border-input bg-background px-3 py-2 text-sm"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Coordination notes…"
              />
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className="rounded-xl" onClick={() => setEditRow(null)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              disabled={patchMut.isPending}
              onClick={() => saveEditDetails()}
            >
              {patchMut.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
