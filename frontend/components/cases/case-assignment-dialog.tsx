"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignCase,
  fetchCaseAssignees,
  fetchCaseById,
  type CaseRow,
} from "@/services/modules/caseService";
import { hasPermission } from "@/store/authStore";
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

type Props = {
  row: CaseRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CaseAssignmentDialog({ row, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const canAssign = hasPermission("case:assign");

  const detailQ = useQuery({
    queryKey: ["case-detail", row?.id],
    queryFn: () => fetchCaseById(row!.id),
    enabled: open && !!row?.id && canAssign,
  });

  const assigneesQ = useQuery({
    queryKey: ["case-assignees"],
    queryFn: fetchCaseAssignees,
    enabled: open && canAssign,
  });

  const detail = detailQ.data;
  const [assigneeId, setAssigneeId] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  useEffect(() => {
    if (!open) {
      setAssigneeId("");
      setAssignNotes("");
    }
  }, [open]);

  const assignMut = useMutation({
    mutationFn: () =>
      assignCase(row!.id, {
        assigneeId,
        notes: assignNotes || null,
      }),
    onSuccess: () => {
      toast.success("Case assigned");
      setAssignNotes("");
      void qc.invalidateQueries({ queryKey: ["cases"] });
      void qc.invalidateQueries({ queryKey: ["case-detail", row?.id] });
    },
    onError: () => toast.error("Assignment failed"),
  });

  const assignments = useMemo(
    () =>
      (detail?.CaseAssignments ?? []).filter((a) => a.active !== false),
    [detail?.CaseAssignments]
  );

  if (!row || !canAssign) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Assign · {row.caseNumber}</DialogTitle>
          <DialogDescription>
            Hand off to a user with the right role. Sets the case to in progress when assigned.
          </DialogDescription>
        </DialogHeader>

        {detailQ.isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {!detailQ.isLoading && (
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Assignment</CardTitle>
              <CardDescription>Choose assignee and optional notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {assignments.length > 0 && (
                <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Active: </span>
                  {assignments.map((a) => (
                    <span key={a.id} className="font-medium">
                      {a.Assignee?.fullName ?? a.assigneeId}
                    </span>
                  ))}
                </div>
              )}
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label>Assign to</Label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                  >
                    <option value="">Select user…</option>
                    {(assigneesQ.data ?? []).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.roles.join(", ")})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input
                    className="rounded-xl"
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                  />
                </div>
              </div>
              <Button
                className="rounded-xl"
                disabled={!assigneeId || assignMut.isPending}
                onClick={() => assignMut.mutate()}
              >
                {assignMut.isPending ? "Assigning…" : "Assign case"}
              </Button>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}
