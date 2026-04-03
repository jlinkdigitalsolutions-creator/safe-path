"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFacility } from "@/services/modules/healthService";
import { hasPermission } from "@/store/authStore";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchToolbar } from "@/components/health/search-toolbar";

type Props = {
  facilities: Record<string, unknown>[];
  loading: boolean;
  onRefresh: () => void;
};

export function FacilityTable({ facilities, loading, onRefresh }: Props) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return facilities;
    const s = q.toLowerCase();
    return facilities.filter((f) => JSON.stringify(f).toLowerCase().includes(s));
  }, [facilities, q]);

  const delMut = useMutation({
    mutationFn: deleteFacility,
    onSuccess: () => {
      toast.success("Facility removed");
      void qc.invalidateQueries({ queryKey: ["health-facilities"] });
    },
  });

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">Directory</CardTitle>
          <CardDescription>
            {loading ? "Loading…" : `${filtered.length} shown`}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchToolbar
            value={q}
            onChange={setQ}
            placeholder="Search name, region, service…"
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
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-y border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="py-3 pr-4 font-medium">Location</th>
                <th className="py-3 pr-4 font-medium">Services</th>
                <th className="py-3 pr-4 font-medium">Phone</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => {
                const id = String(f.id);
                const services = (f.services as string[]) ?? [];
                return (
                  <tr key={id} className="border-b border-border/40 align-top last:border-0">
                    <td className="px-6 py-3 font-medium">{String(f.name)}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {String(f.country ?? "Ethiopia")}
                      <br />
                      <span className="text-foreground">
                        {String(f.region)} / {String(f.district)}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        {services.map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">
                            {s.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4">{String(f.phone ?? "—")}</td>
                    <td className="px-6 py-3 text-right">
                      {hasPermission("health:delete") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-lg text-destructive"
                          onClick={() => {
                            if (confirm("Remove this facility?")) delMut.mutate(id);
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">No facilities match.</p>
        )}
      </CardContent>
    </Card>
  );
}
