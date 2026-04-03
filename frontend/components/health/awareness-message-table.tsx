"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { broadcastHealthMessage, deleteHealthMessage } from "@/services/modules/healthService";
import { hasPermission } from "@/store/authStore";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchToolbar } from "@/components/health/search-toolbar";

type Props = {
  messages: Record<string, unknown>[];
  loading: boolean;
  onRefresh: () => void;
};

export function AwarenessMessageTable({ messages, loading, onRefresh }: Props) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return messages;
    const s = q.toLowerCase();
    return messages.filter((m) => JSON.stringify(m).toLowerCase().includes(s));
  }, [messages, q]);

  const broadcastMut = useMutation({
    mutationFn: broadcastHealthMessage,
    onSuccess: (r) => {
      toast.success(r.message);
      void qc.invalidateQueries({ queryKey: ["health-messages"] });
    },
    onError: () => toast.error("Broadcast failed"),
  });

  const delMut = useMutation({
    mutationFn: deleteHealthMessage,
    onSuccess: () => {
      toast.success("Message removed");
      void qc.invalidateQueries({ queryKey: ["health-messages"] });
    },
  });

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">Library</CardTitle>
          <CardDescription>
            {loading ? "Loading…" : `${filtered.length} shown`}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchToolbar value={q} onChange={setQ} placeholder="Search title, topic…" />
          <Button variant="outline" size="sm" className="rounded-xl" onClick={onRefresh}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0 sm:px-6">
        {loading ? (
          <Skeleton className="mx-6 h-40 w-[calc(100%-3rem)]" />
        ) : (
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-y border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3 font-medium">Topic</th>
                <th className="py-3 pr-4 font-medium">Title</th>
                <th className="py-3 pr-4 font-medium">Preview</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const id = String(m.id);
                const preview = String(m.body ?? "").slice(0, 80);
                return (
                  <tr key={id} className="border-b border-border/40 align-top last:border-0">
                    <td className="px-6 py-3">
                      <Badge variant="outline" className="text-[10px]">
                        {String(m.topic ?? "—")}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 font-medium">{String(m.title)}</td>
                    <td className="max-w-xs py-3 pr-4 text-muted-foreground">
                      {preview}
                      {String(m.body ?? "").length > 80 ? "…" : ""}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {hasPermission("health:update") && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="rounded-lg"
                            disabled={broadcastMut.isPending}
                            onClick={() => broadcastMut.mutate(id)}
                          >
                            Broadcast
                          </Button>
                        )}
                        {hasPermission("health:delete") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-lg text-destructive"
                            onClick={() => {
                              if (confirm("Delete this message?")) delMut.mutate(id);
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
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">No messages match.</p>
        )}
      </CardContent>
    </Card>
  );
}
