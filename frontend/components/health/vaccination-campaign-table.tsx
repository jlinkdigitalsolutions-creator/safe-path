"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCampaign, sendCampaignReminders } from "@/services/modules/healthService";
import { hasPermission } from "@/store/authStore";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchToolbar } from "@/components/health/search-toolbar";
import { Pencil } from "lucide-react";

type Props = {
  campaigns: Record<string, unknown>[];
  loading: boolean;
  onRefresh: () => void;
  onEdit?: (row: Record<string, unknown>) => void;
};

function pct(
  c: Record<string, unknown>,
  camel: string,
  snake: string
) {
  const v = c[camel] ?? c[snake];
  if (v == null || v === "") return "—";
  return `${Number(v)}%`;
}

function num(c: Record<string, unknown>, camel: string, snake: string) {
  const v = c[camel] ?? c[snake];
  if (v == null || v === "") return "—";
  return Number(v).toLocaleString();
}

export function VaccinationCampaignTable({ campaigns, loading, onRefresh, onEdit }: Props) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return campaigns;
    const s = q.toLowerCase();
    return campaigns.filter((c) => JSON.stringify(c).toLowerCase().includes(s));
  }, [campaigns, q]);

  const reminderMut = useMutation({
    mutationFn: sendCampaignReminders,
    onSuccess: (r) => {
      toast.success(r.message);
      void qc.invalidateQueries({ queryKey: ["health-dashboard"] });
      void qc.invalidateQueries({ queryKey: ["health-campaigns"] });
    },
    onError: () => toast.error("Reminder send failed"),
  });

  const delMut = useMutation({
    mutationFn: deleteCampaign,
    onSuccess: () => {
      toast.success("Campaign removed");
      void qc.invalidateQueries({ queryKey: ["health-campaigns"] });
      void qc.invalidateQueries({ queryKey: ["health-dashboard"] });
    },
  });

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">Campaigns</CardTitle>
          <CardDescription>
            {loading ? "Loading…" : `${filtered.length} shown`}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchToolbar
            value={q}
            onChange={setQ}
            placeholder="Search name, region…"
          />
          <Button variant="outline" size="sm" className="rounded-xl" onClick={onRefresh}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0 sm:px-6">
        {loading ? (
          <Skeleton className="mx-6 h-40 w-[calc(100%-3rem)]" />
        ) : (
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-y border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="py-3 pr-4 font-medium">Region</th>
                <th className="py-3 pr-4 font-medium">Current</th>
                <th className="py-3 pr-4 font-medium">Target</th>
                <th className="py-3 pr-4 font-medium">Eligible</th>
                <th className="py-3 pr-4 font-medium">Vaccinated</th>
                <th className="py-3 pr-4 font-medium">Ages</th>
                <th className="py-3 pr-4 font-medium">SMS</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const id = String(c.id);
                return (
                  <tr key={id} className="border-b border-border/40 last:border-0">
                    <td className="px-6 py-3 font-medium">{String(c.name)}</td>
                    <td className="py-3 pr-4">{String(c.region)}</td>
                    <td className="py-3 pr-4 tabular-nums">
                      {pct(c, "currentCoveragePercent", "current_coverage_percent")}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {pct(c, "targetCoveragePercent", "target_coverage_percent")}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-muted-foreground">
                      {num(c, "eligiblePopulation", "eligible_population")}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-muted-foreground">
                      {num(c, "vaccinatedCount", "vaccinated_count")}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {String(c.ageMin ?? 9)}–{String(c.ageMax ?? 45)}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="secondary" className="text-[10px]">
                        {(c.smsReminderEnabled as boolean) ? "On" : "Off"}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {hasPermission("health:update") && onEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                            onClick={() => onEdit(c)}
                            title="Edit campaign"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission("health:update") && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="rounded-lg"
                            disabled={reminderMut.isPending}
                            onClick={() => reminderMut.mutate(id)}
                          >
                            Remind
                          </Button>
                        )}
                        {hasPermission("health:delete") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-lg text-destructive"
                            onClick={() => {
                              if (confirm("Delete this campaign?")) delMut.mutate(id);
                            }}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">No campaigns match.</p>
        )}
      </CardContent>
    </Card>
  );
}
