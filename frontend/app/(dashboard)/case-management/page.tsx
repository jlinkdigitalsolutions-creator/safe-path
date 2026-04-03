"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  ClipboardList,
  Download,
  Layers,
  MapPin,
  RefreshCw,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchCaseAnalytics, fetchCases, downloadCasesExport } from "@/services/modules/caseService";
import { toast } from "sonner";

function toRows(rows: Record<string, string | number>[] | undefined, key: string) {
  return (rows ?? []).map((r) => ({
    name: String(r[key] ?? "—").replace(/_/g, " "),
    count: Number(r.count ?? 0),
  }));
}

function countForStatus(statusData: { name: string; count: number }[], status: string) {
  const row = statusData.find(
    (s) => s.name.toLowerCase().replace(/\s/g, "_") === status
  );
  return row?.count ?? 0;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}

export default function CaseManagementDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["case-analytics"],
    queryFn: fetchCaseAnalytics,
    refetchInterval: 60_000,
  });

  const { data: mine } = useQuery({
    queryKey: ["cases", "assigned-to-me-count"],
    queryFn: () => fetchCases({ page: 1, pageSize: 1, assignedToMe: true }),
  });

  async function onExport() {
    try {
      await downloadCasesExport({});
      toast.success("Report downloaded");
    } catch {
      toast.error("Export failed");
    }
  }

  if (isLoading) return <DashboardSkeleton />;

  if (error || !data) {
    return <p className="text-sm text-destructive">Couldn’t load analytics.</p>;
  }

  const d = data;
  const regionRows = toRows(d.byRegion, "region")
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const statusRows = toRows(d.byStatus, "status");
  const urgencyRows = toRows(d.byUrgency, "urgency");
  const referralOutcomes = (d.referralOutcomes ?? []).map((r) => ({
    name: r.status.replace(/_/g, " "),
    count: Number(r.count),
  }));
  const referralTypes = (d.referralsByType ?? []).map((r) => ({
    name: r.type,
    count: Number(r.count),
  }));

  const total = d.total || 1;
  const openN = countForStatus(statusRows, "open");
  const inProgN = countForStatus(statusRows, "in_progress");
  const forwardedN = countForStatus(statusRows, "forwarded");
  const resolvedN = countForStatus(statusRows, "resolved");
  const closedN = countForStatus(statusRows, "closed");
  const referralsActive = referralOutcomes
    .filter((r) => !/completed|cancelled/i.test(r.name))
    .reduce((s, r) => s + r.count, 0);
  const criticalUrgent = urgencyRows.filter((u) =>
    /critical|high/i.test(u.name)
  );
  const criticalCount = criticalUrgent.reduce((s, u) => s + u.count, 0);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-6 shadow-card backdrop-blur-sm">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ClipboardList className="h-4 w-4 text-primary" />
              Case command center
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Operations overview</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Aggregated intake, caseload, and referral activity. One chart for regional load; the rest
              is structured for fast scanning.
            </p>
            <p className="text-xs text-muted-foreground">
              Refreshed {new Date(d.generatedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="secondary" className="rounded-xl" asChild>
              <Link href="/case-management/cases?scope=mine" className="gap-2">
                <UserCheck className="h-4 w-4" />
                My assignments
                {mine != null && (
                  <span className="rounded-md bg-background/80 px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground ring-1 ring-border/60">
                    {mine.total}
                  </span>
                )}
              </Link>
            </Button>
            <Button className="rounded-xl" onClick={() => void onExport()}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total cases</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{d.total}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            All-time intake volume in the system.
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Active casework</CardDescription>
            <CardTitle className="text-3xl tabular-nums text-success">
              {d.survivorsReceivingSupport}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Open, in progress, forwarded, or resolved — excludes closed.
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>My open assignments</CardDescription>
            <CardTitle className="text-3xl tabular-nums text-brand-blue">
              {mine?.total ?? "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Cases where you are the active assignee.
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Priority attention</CardDescription>
            <CardTitle className="text-3xl tabular-nums text-destructive">
              {criticalCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            High and critical urgency cases combined.
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="border-border/80 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-primary" />
              Status pipeline
            </CardTitle>
            <CardDescription>
              Open · in progress · forwarded · resolved · closed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex h-4 overflow-hidden rounded-full bg-muted">
              {[
                { n: openN, className: "bg-brand-blue" },
                { n: inProgN, className: "bg-primary" },
                { n: forwardedN, className: "bg-amber-500/90" },
                { n: resolvedN, className: "bg-success" },
                { n: closedN, className: "bg-muted-foreground/50" },
              ].map((seg, i) => (
                <div
                  key={i}
                  className={`h-full transition-all ${seg.className}`}
                  style={{ width: `${(seg.n / total) * 100}%`, minWidth: seg.n ? 4 : 0 }}
                  title={`${seg.n}`}
                />
              ))}
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between border-b border-border/50 py-1">
                <span className="text-muted-foreground">Open</span>
                <span className="font-medium tabular-nums">{openN}</span>
              </li>
              <li className="flex justify-between border-b border-border/50 py-1">
                <span className="text-muted-foreground">In progress</span>
                <span className="font-medium tabular-nums">{inProgN}</span>
              </li>
              <li className="flex justify-between border-b border-border/50 py-1">
                <span className="text-muted-foreground">Forwarded</span>
                <span className="font-medium tabular-nums">{forwardedN}</span>
              </li>
              <li className="flex justify-between border-b border-border/50 py-1">
                <span className="text-muted-foreground">Resolved</span>
                <span className="font-medium tabular-nums">{resolvedN}</span>
              </li>
              <li className="flex justify-between py-1">
                <span className="text-muted-foreground">Closed</span>
                <span className="font-medium tabular-nums">{closedN}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              Urgency
            </CardTitle>
            <CardDescription>Where to focus first</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border/60">
              {urgencyRows.length === 0 ? (
                <li className="py-4 text-sm text-muted-foreground">No data.</li>
              ) : (
                urgencyRows.map((u) => (
                  <li key={u.name} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="capitalize">{u.name}</span>
                    <Badge
                      variant={
                        /critical|high/i.test(u.name) ? "destructive" : "secondary"
                      }
                      className="tabular-nums"
                    >
                      {u.count}
                    </Badge>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Referrals</CardTitle>
            <CardDescription>In-flight vs done</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl bg-muted/40 px-3 py-3">
              <div className="text-2xl font-semibold tabular-nums">{referralsActive}</div>
              <div className="text-xs text-muted-foreground">Active referrals (not completed)</div>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {referralOutcomes.slice(0, 5).map((r) => (
                <li key={r.name} className="flex justify-between">
                  <span className="capitalize">{r.name}</span>
                  <span className="tabular-nums text-foreground">{r.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-brand-blue" />
              Regional case load
            </CardTitle>
            <CardDescription>Top regions by volume — single chart for geographic balance</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" asChild>
            <Link href="/case-management/cases">
              Open registry
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="h-72">
          {regionRows.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No regional data yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionRows} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} width={36} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  name="Cases"
                  fill="hsl(var(--brand-blue))"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Referral outcomes</CardTitle>
            <CardDescription>Status distribution (counts)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {referralOutcomes.map((r) => (
                <Badge key={r.name} variant="outline" className="gap-1 px-3 py-1 text-sm font-normal">
                  <span className="capitalize">{r.name}</span>
                  <span className="font-semibold tabular-nums text-foreground">{r.count}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Referrals by type</CardTitle>
            <CardDescription>Police · legal · shelter · health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {referralTypes.map((r) => (
                <Badge key={r.name} variant="secondary" className="gap-1 px-3 py-1 text-sm font-normal">
                  <span className="capitalize">{r.name}</span>
                  <span className="tabular-nums font-semibold">{r.count}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
