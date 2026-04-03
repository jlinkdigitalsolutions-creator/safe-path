"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  markNotificationRead,
} from "@/services/modules/notificationService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(1, 50),
  });

  const markMut = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Alerts and Notifications</h2>
        <p className="text-sm text-muted-foreground">Case updates, notifications, and alerts.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Inbox
          </CardTitle>
          <CardDescription>
            {data ? `${data.total} total` : "Loading…"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            (data?.data ?? []).map((n) => (
              <div
                key={n.id}
                className={`rounded-2xl border border-border/60 p-4 ${n.read ? "opacity-70" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{n.title}</div>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {!n.read && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-xl"
                        onClick={() => markMut.mutate(n.id)}
                        disabled={markMut.isPending}
                      >
                        Mark read
                      </Button>
                    )}
                    {n.meta &&
                      typeof n.meta === "object" &&
                      "type" in n.meta &&
                      n.meta.type != null && (
                        <Badge variant="outline">{String(n.meta.type)}</Badge>
                      )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
