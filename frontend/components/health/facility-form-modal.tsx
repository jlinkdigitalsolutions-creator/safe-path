"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFacility } from "@/services/modules/healthService";
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FacilityFormModal({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [svc, setSvc] = useState("cervical_screening");

  const createMut = useMutation({
    mutationFn: () =>
      createFacility({
        name,
        region,
        district,
        type: "clinic",
        country: "Ethiopia",
        phone: phone || null,
        services: [
          svc,
          svc.includes("cervical") ? "cervical_treatment" : "breast_diagnosis",
        ],
      }),
    onSuccess: () => {
      toast.success("Facility added");
      setName("");
      setRegion("");
      setDistrict("");
      setPhone("");
      onOpenChange(false);
      void qc.invalidateQueries({ queryKey: ["health-facilities"] });
      void qc.invalidateQueries({ queryKey: ["health-dashboard"] });
    },
    onError: () => toast.error("Failed to add facility"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add facility</DialogTitle>
          <DialogDescription>Cervical or breast services and contact details.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-2">
            <Label>Facility name</Label>
            <Input className="rounded-xl" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Region</Label>
              <Input className="rounded-xl" value={region} onChange={(e) => setRegion(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>District</Label>
              <Input className="rounded-xl" value={district} onChange={(e) => setDistrict(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input className="rounded-xl" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Service focus</Label>
            <select
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              value={svc}
              onChange={(e) => setSvc(e.target.value)}
            >
              <option value="cervical_screening">Cervical screening & treatment</option>
              <option value="breast_screening">Breast screening & diagnosis</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              disabled={!name || !region || !district || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              {createMut.isPending ? "Saving…" : "Add facility"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
