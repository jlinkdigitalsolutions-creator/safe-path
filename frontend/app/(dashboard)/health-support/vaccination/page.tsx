"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCampaigns } from "@/services/modules/healthService";
import { HealthModuleIntro } from "@/components/health/health-module-intro";
import { VaccinationCampaignModal } from "@/components/health/vaccination-campaign-modal";
import { VaccinationCampaignTable } from "@/components/health/vaccination-campaign-table";
import { Button } from "@/components/ui/button";
import { hasPermission } from "@/store/authStore";
import { Plus } from "lucide-react";

export default function HealthVaccinationPage() {
  const campaigns = useQuery({
    queryKey: ["health-campaigns"],
    queryFn: fetchCampaigns,
  });

  const [modal, setModal] = useState<
    { mode: "create" } | { mode: "edit"; row: Record<string, unknown> } | null
  >(null);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <HealthModuleIntro
          title="Vaccination alerts"
          description="Create campaigns in a dialog, then track coverage and send SMS reminders from the table."
        />
        {hasPermission("health:create") && (
          <Button className="shrink-0 rounded-xl" onClick={() => setModal({ mode: "create" })}>
            <Plus className="h-4 w-4" />
            New campaign
          </Button>
        )}
      </div>

      <VaccinationCampaignModal
        key={modal?.mode === "edit" ? String(modal.row.id) : "create"}
        open={!!modal}
        onOpenChange={(o) => !o && setModal(null)}
        initial={modal?.mode === "edit" ? modal.row : null}
      />

      <VaccinationCampaignTable
        campaigns={campaigns.data ?? []}
        loading={campaigns.isLoading}
        onRefresh={() => void campaigns.refetch()}
        onEdit={(row) => setModal({ mode: "edit", row })}
      />
    </div>
  );
}
