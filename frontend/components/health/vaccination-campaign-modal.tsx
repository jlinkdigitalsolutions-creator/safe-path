"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCampaign, updateCampaign } from "@/services/modules/healthService";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function dateInput(v: unknown): string {
  if (v == null) return "";
  const s = typeof v === "string" ? v : String(v);
  return s.slice(0, 10);
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, dialog PATCHes this campaign; otherwise creates a new one. */
  initial?: Record<string, unknown> | null;
};

export function VaccinationCampaignModal({ open, onOpenChange, initial }: Props) {
  const qc = useQueryClient();
  const editing = Boolean(initial?.id);

  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetPct, setTargetPct] = useState(85);
  const [eligible, setEligible] = useState<number | "">("");
  const [vaccinated, setVaccinated] = useState<number | "">("");
  const [manualCurrent, setManualCurrent] = useState(0);
  const [ageMin, setAgeMin] = useState(9);
  const [ageMax, setAgeMax] = useState(45);
  const [language, setLanguage] = useState("am");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(String(initial.name ?? ""));
      setRegion(String(initial.region ?? ""));
      setStartDate(dateInput(initial.startDate));
      setEndDate(dateInput(initial.endDate));
      setTargetPct(Number(initial.targetCoveragePercent ?? 85));
      const e = initial.eligiblePopulation ?? initial.eligible_population;
      setEligible(e != null && e !== "" ? Number(e) : "");
      const v = initial.vaccinatedCount ?? initial.vaccinated_count;
      setVaccinated(v != null && v !== "" ? Number(v) : "");
      setManualCurrent(Number(initial.currentCoveragePercent ?? 0));
      setAgeMin(Number(initial.ageMin ?? 9));
      setAgeMax(Number(initial.ageMax ?? 45));
      setLanguage(String(initial.language ?? "am"));
    } else {
      setName("");
      setRegion("");
      setStartDate("");
      setEndDate("");
      setTargetPct(85);
      setEligible("");
      setVaccinated("");
      setManualCurrent(0);
      setAgeMin(9);
      setAgeMax(45);
      setLanguage("am");
    }
  }, [open, initial]);

  const previewCurrent = useMemo(() => {
    const e = eligible === "" ? 0 : Number(eligible);
    const v = vaccinated === "" ? NaN : Number(vaccinated);
    if (e > 0 && !Number.isNaN(v) && v >= 0) {
      return Math.min(100, Math.round((v / e) * 100));
    }
    return manualCurrent;
  }, [eligible, vaccinated, manualCurrent]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const start = startDate || new Date().toISOString().slice(0, 10);
      const eNum = eligible === "" ? 0 : Number(eligible);
      const vNum = vaccinated === "" ? null : Number(vaccinated);
      const payload: Record<string, unknown> = {
        name,
        region,
        startDate: start,
        endDate: endDate || null,
        targetCoveragePercent: targetPct,
        ageMin,
        ageMax,
        smsReminderEnabled: true,
        language,
        eligiblePopulation: eligible === "" ? null : eNum,
        vaccinatedCount: vNum,
      };
      if (eNum <= 0) {
        payload.currentCoveragePercent = manualCurrent;
      }
      if (editing && initial?.id) {
        return updateCampaign(String(initial.id), payload);
      }
      return createCampaign(payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Campaign updated" : "Campaign created");
      onOpenChange(false);
      void qc.invalidateQueries({ queryKey: ["health-campaigns"] });
      void qc.invalidateQueries({ queryKey: ["health-dashboard"] });
    },
    onError: () => toast.error(editing ? "Update failed" : "Create failed"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit campaign" : "New vaccination campaign"}</DialogTitle>
          <DialogDescription>
            Target = goal (0–100%). Current = (vaccinated ÷ eligible)×100 when both are set; otherwise enter current % manually.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input className="rounded-xl" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Input className="rounded-xl" value={region} onChange={(e) => setRegion(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Start</Label>
              <Input type="date" className="rounded-xl" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End (optional)</Label>
              <Input type="date" className="rounded-xl" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Target coverage %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                className="rounded-xl"
                value={targetPct}
                onChange={(e) => setTargetPct(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="am">Amharic</option>
                <option value="en">English</option>
                <option value="om">Oromo</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Cohort fields: </span>
            eligible = population in scope; vaccinated = doses to date → current % is capped at 100%.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Eligible population (optional)</Label>
              <Input
                type="number"
                min={0}
                className="rounded-xl"
                value={eligible}
                onChange={(e) => {
                  const v = e.target.value;
                  setEligible(v === "" ? "" : Number(v));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Vaccinated count (optional)</Label>
              <Input
                type="number"
                min={0}
                className="rounded-xl"
                value={vaccinated}
                onChange={(e) => {
                  const v = e.target.value;
                  setVaccinated(v === "" ? "" : Number(v));
                }}
              />
            </div>
          </div>

          {(eligible === "" || Number(eligible) <= 0) && (
            <div className="space-y-2">
              <Label>Current coverage % (manual)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                className="rounded-xl"
                value={manualCurrent}
                onChange={(e) => setManualCurrent(Number(e.target.value))}
              />
            </div>
          )}

          <div className="rounded-xl border border-dashed border-border/80 px-3 py-2 text-sm">
            Preview current % after save: <strong>{previewCurrent}%</strong>
          </div>

          <div className="flex gap-4">
            <div className="space-y-2">
              <Label>Age min</Label>
              <Input type="number" className="rounded-xl" value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Age max</Label>
              <Input type="number" className="rounded-xl" value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              disabled={!name || !region || saveMut.isPending}
              onClick={() => saveMut.mutate()}
            >
              {saveMut.isPending ? "Saving…" : editing ? "Save changes" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
