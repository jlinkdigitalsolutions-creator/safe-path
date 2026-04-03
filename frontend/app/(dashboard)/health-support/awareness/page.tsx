"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchHealthMessages } from "@/services/modules/healthService";
import { HealthModuleIntro } from "@/components/health/health-module-intro";
import { AwarenessMessageModal } from "@/components/health/awareness-message-modal";
import { AwarenessMessageTable } from "@/components/health/awareness-message-table";
import { Button } from "@/components/ui/button";
import { hasPermission } from "@/store/authStore";
import { Plus } from "lucide-react";

export default function HealthAwarenessPage() {
  const [open, setOpen] = useState(false);
  const messages = useQuery({
    queryKey: ["health-messages"],
    queryFn: fetchHealthMessages,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <HealthModuleIntro
          title="Awareness & education"
          description="Create messages in a dialog; browse, search, and broadcast from the table."
        />
        {hasPermission("health:create") && (
          <Button className="shrink-0 rounded-xl" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New message
          </Button>
        )}
      </div>

      <AwarenessMessageModal open={open} onOpenChange={setOpen} />

      <AwarenessMessageTable
        messages={messages.data ?? []}
        loading={messages.isLoading}
        onRefresh={() => void messages.refetch()}
      />
    </div>
  );
}
