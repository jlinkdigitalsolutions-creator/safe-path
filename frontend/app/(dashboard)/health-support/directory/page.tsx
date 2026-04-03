"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFacilities } from "@/services/modules/healthService";
import { HealthModuleIntro } from "@/components/health/health-module-intro";
import { FacilityFormModal } from "@/components/health/facility-form-modal";
import { FacilityTable } from "@/components/health/facility-table";
import { Button } from "@/components/ui/button";
import { hasPermission } from "@/store/authStore";
import { Plus } from "lucide-react";

export default function HealthDirectoryPage() {
  const [open, setOpen] = useState(false);
  const facilities = useQuery({
    queryKey: ["health-facilities"],
    queryFn: () => fetchFacilities({}),
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <HealthModuleIntro
          title="Service directory"
          description="Add facilities from a dialog, then search and manage the directory below."
        />
        {hasPermission("health:create") && (
          <Button className="shrink-0 rounded-xl" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Add facility
          </Button>
        )}
      </div>

      <FacilityFormModal open={open} onOpenChange={setOpen} />

      <FacilityTable
        facilities={facilities.data ?? []}
        loading={facilities.isLoading}
        onRefresh={() => void facilities.refetch()}
      />
    </div>
  );
}
