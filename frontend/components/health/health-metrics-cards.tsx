"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  totalReach: number;
  avgVaccinationCoverage: number;
  facilityCount: number;
};

export function HealthMetricsCards({
  totalReach,
  avgVaccinationCoverage,
  facilityCount,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Awareness reach</CardDescription>
          <CardTitle className="text-3xl tabular-nums">{totalReach.toLocaleString()}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Avg. vaccination coverage</CardDescription>
          <CardTitle className="text-3xl tabular-nums">{avgVaccinationCoverage}%</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Facilities listed</CardDescription>
          <CardTitle className="text-3xl tabular-nums">{facilityCount}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
