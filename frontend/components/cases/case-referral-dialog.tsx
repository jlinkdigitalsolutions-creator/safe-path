"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addCaseReferral,
  fetchCaseById,
  patchCaseReferral,
  type CaseRow,
} from "@/services/modules/caseService";
import { hasPermission } from "@/store/authStore";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { canCreateReferralType, primaryCaseRole } from "@/components/cases/case-role-utils";

const REF_STATUSES = ["pending", "in_progress", "completed", "cancelled"] as const;

const REFERRAL_QUICK: {
  type: "police" | "legal" | "shelter" | "health";
  label: string;
  destinationName: string;
  notes: string;
}[] = [
  {
    type: "police",
    label: "Police",
    destinationName: "Police liaison / station",
    notes: "Forwarded for police coordination",
  },
  {
    type: "legal",
    label: "Legal",
    destinationName: "Legal aid / lawyer",
    notes: "Legal support requested",
  },
  {
    type: "shelter",
    label: "Shelter",
    destinationName: "Shelter partner",
    notes: "Shelter referral",
  },
  {
    type: "health",
    label: "Health",
    destinationName: "Health facility",
    notes: "Health referral",
  },
];

/** Minimal case context for referral coordination (full case loads inside the dialog). */
export type CaseReferralSummary = Pick<CaseRow, "id" | "caseNumber">;

type Props = {
  row: CaseReferralSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CaseReferralDialog({ row, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const myRoles = useAuthStore((s) => s.user?.roles ?? []);
  const canRefer = hasPermission("case:refer");

  const detailQ = useQuery({
    queryKey: ["case-detail", row?.id],
    queryFn: () => fetchCaseById(row!.id),
    enabled: open && !!row?.id && canRefer,
  });

  const addRefMut = useMutation({
    mutationFn: (body: {
      type: "police" | "legal" | "shelter" | "health";
      destinationName?: string | null;
      notes?: string | null;
    }) => addCaseReferral(row!.id, body),
    onSuccess: () => {
      toast.success("Referral added");
      void qc.invalidateQueries({ queryKey: ["case-detail", row?.id] });
      void qc.invalidateQueries({ queryKey: ["case-analytics"] });
    },
    onError: () => toast.error("Referral failed"),
  });

  const patchRefMut = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { status?: (typeof REF_STATUSES)[number]; notes?: string | null };
    }) => patchCaseReferral(id, body),
    onSuccess: () => {
      toast.success("Referral updated");
      void qc.invalidateQueries({ queryKey: ["case-detail", row?.id] });
    },
    onError: () => toast.error("Could not update referral"),
  });

  const referrals = useMemo(
    () => detailQ.data?.Referrals ?? [],
    [detailQ.data?.Referrals]
  );

  const roleLabel = primaryCaseRole(myRoles).replace(/_/g, " ");

  if (!row || !canRefer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Referrals · {row.caseNumber}</DialogTitle>
          <DialogDescription>
            {roleLabel} — quick-add options reflect your role; update statuses in the table below.
          </DialogDescription>
        </DialogHeader>

        {detailQ.isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {!detailQ.isLoading && (
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Coordination</CardTitle>
              <CardDescription>
              Police, legal, shelter, or health. New referrals set the case to <strong>Forwarded</strong>{" "}
              unless it is already resolved or closed.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {REFERRAL_QUICK.filter((q) => canCreateReferralType(myRoles, q.type)).map((q) => (
                  <Button
                    key={q.type}
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    disabled={addRefMut.isPending}
                    onClick={() =>
                      addRefMut.mutate({
                        type: q.type,
                        destinationName: q.destinationName,
                        notes: q.notes,
                      })
                    }
                  >
                    {q.label}
                  </Button>
                ))}
              </div>

              <div className="overflow-x-auto rounded-xl border border-border/50">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30 text-xs uppercase text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="py-2 pr-3 font-medium">Destination</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                          No referrals yet.
                        </td>
                      </tr>
                    )}
                    {referrals.map((r) => (
                      <tr key={r.id} className="border-b border-border/40 last:border-0">
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="capitalize">
                            {r.type.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="max-w-[180px] py-2 pr-3 text-muted-foreground">
                          {r.destinationName ?? "—"}
                        </td>
                        <td className="py-2 pr-3 capitalize">{r.status.replace(/_/g, " ")}</td>
                        <td className="px-3 py-2">
                          <select
                            className="h-9 w-full max-w-[160px] rounded-lg border border-input bg-background px-2 text-xs"
                            value={r.status}
                            onChange={(e) =>
                              patchRefMut.mutate({
                                id: r.id,
                                body: {
                                  status: e.target.value as (typeof REF_STATUSES)[number],
                                },
                              })
                            }
                            disabled={patchRefMut.isPending}
                          >
                            {REF_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}
