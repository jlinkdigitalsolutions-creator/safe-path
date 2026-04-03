"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type CampaignRow = Record<string, unknown>;

type Props = {
  campaigns: CampaignRow[];
  facilitiesByRegion: { region: string; count: number }[];
};

function pickNum(c: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const v = c[k];
    if (v != null && v !== "") {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return 0;
}

function normalizeCampaign(c: CampaignRow, index: number) {
  const name = String(c.name ?? "");
  const current = pickNum(c, "currentCoveragePercent", "current_coverage_percent");
  const target = pickNum(c, "targetCoveragePercent", "target_coverage_percent");
  const label =
    name.length > 14 ? `${name.slice(0, 14)}…` : name || `Campaign ${index + 1}`;
  return { label, name, current, target };
}

export function HealthOverviewCharts({ campaigns, facilitiesByRegion }: Props) {
  const coverageRows = useMemo(
    () => campaigns.map((c, i) => normalizeCampaign(c, i)),
    [campaigns]
  );

  const facilityMap = facilitiesByRegion.map((f) => ({
    name: f.region,
    count: f.count,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle>Coverage by campaign</CardTitle>
          <CardDescription>Current vs target (%)</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {coverageRows.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No campaigns yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={coverageRows}
                margin={{ top: 8, right: 12, left: 0, bottom: 48 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={56}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={36} />
                <Tooltip
                  formatter={(value, name) => [`${value ?? 0}%`, String(name)]}
                />
                <Legend />
                <Bar dataKey="current" name="Current %" fill="hsl(var(--brand-blue))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="Target %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle>Facilities by region</CardTitle>
          <CardDescription>Listed facilities per region</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {facilityMap.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No facilities yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facilityMap} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} width={36} />
                <Tooltip />
                <Bar dataKey="count" name="Facilities" fill="hsl(var(--brand-blue))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
