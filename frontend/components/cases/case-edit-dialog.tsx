"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCaseById,
  updateCase,
  type CaseDetail,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { primaryCaseRole } from "@/components/cases/case-role-utils";
import { CASE_WORKFLOW_STATUSES, formatCaseStatusLabel } from "@/lib/case-status";
const URGENCY = ["low", "medium", "high", "critical"] as const;

const ROLE_HINTS: Record<string, string> = {
  admin: "Full access.",
  social_worker: "Intake, assign, refer.",
  ngo_staff: "Update cases and referrals.",
  police: "Status and referrals.",
  legal_counsel: "Legal referral follow-up.",
  viewer: "View only.",
};

type Props = {
  row: CaseRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CaseEditDialog({ row, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const myRoles = useAuthStore((s) => s.user?.roles ?? []);
  const hint = ROLE_HINTS[primaryCaseRole(myRoles)] ?? "";

  const detailQ = useQuery({
    queryKey: ["case-detail", row?.id],
    queryFn: () => fetchCaseById(row!.id),
    enabled: open && !!row?.id,
  });

  const detail = detailQ.data;
  const base = (detail ?? row) as CaseDetail | CaseRow | null;

  const [status, setStatus] = useState("");
  const [urgency, setUrgency] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [kebele, setKebele] = useState("");
  const [summary, setSummary] = useState("");

  useEffect(() => {
    if (!base) return;
    setStatus(base.status);
    setUrgency(base.urgency);
    setCountry((base as CaseRow).country ?? "Ethiopia");
    setRegion(base.region);
    setDistrict(base.district);
    setKebele((base as CaseRow).kebele ?? "");
    setSummary((base as CaseRow).summary ?? "");
  }, [base]);

  const updateMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      updateCase(row!.id, payload),
    onSuccess: () => {
      toast.success("Case updated");
      void qc.invalidateQueries({ queryKey: ["cases"] });
      void qc.invalidateQueries({ queryKey: ["case-analytics"] });
      void qc.invalidateQueries({ queryKey: ["case-detail", row?.id] });
    },
    onError: () => toast.error("Update failed"),
  });

  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{row.caseNumber}</DialogTitle>
          <DialogDescription>
            {primaryCaseRole(myRoles).replace(/_/g, " ")} · {hint}
          </DialogDescription>
        </DialogHeader>

        {detailQ.isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {!detailQ.isLoading && hasPermission("case:update") && (
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Case record</CardTitle>
              <CardDescription>
                Set open, in progress, forwarded (external handoff), resolved, or closed.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {CASE_WORKFLOW_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {formatCaseStatusLabel(s)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Urgency</Label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                  >
                    {URGENCY.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input className="rounded-xl" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Input className="rounded-xl" value={region} onChange={(e) => setRegion(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>District</Label>
                  <Input className="rounded-xl" value={district} onChange={(e) => setDistrict(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Kebele</Label>
                <Input className="rounded-xl" value={kebele} onChange={(e) => setKebele(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Summary</Label>
                <textarea
                  className="min-h-[88px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </div>
              <Button
                className="rounded-xl"
                disabled={updateMut.isPending}
                onClick={() =>
                  updateMut.mutate({
                    status,
                    urgency,
                    country,
                    region,
                    district,
                    kebele,
                    summary: summary || null,
                  })
                }
              >
                {updateMut.isPending ? "Saving…" : "Save case changes"}
              </Button>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}
