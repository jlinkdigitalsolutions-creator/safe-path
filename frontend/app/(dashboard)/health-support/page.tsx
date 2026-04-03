"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchHealthDashboard } from "@/services/modules/healthService";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthModuleIntro } from "@/components/health/health-module-intro";
import { HealthMetricsCards } from "@/components/health/health-metrics-cards";
import { HealthOverviewCharts } from "@/components/health/health-overview-charts";

export default function HealthSupportOverviewPage() {
  const dash = useQuery({
    queryKey: ["health-dashboard"],
    queryFn: fetchHealthDashboard,
  });

  if (dash.isLoading) {
    return (
      <div className="space-y-6">
        <HealthModuleIntro title="Overview" description="Key metrics and trends." />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (dash.error || !dash.data) {
    return (
      <p className="text-sm text-destructive">Couldn’t load this page.</p>
    );
  }

  const data = dash.data;

  return (
    <div className="space-y-6">
      <HealthModuleIntro title="Overview" description="Key metrics and trends." />
      <HealthMetricsCards
        totalReach={data.stats.totalReach}
        avgVaccinationCoverage={data.stats.avgVaccinationCoverage}
        facilityCount={data.stats.facilityCount}
      />
      <HealthOverviewCharts
        campaigns={data.campaigns}
        facilitiesByRegion={data.stats.facilitiesByRegion}
      />
    </div>
  );
}
