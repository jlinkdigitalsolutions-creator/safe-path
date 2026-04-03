"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TYPES = ["rape", "physical", "emotional"] as const;
const URGENCY = ["low", "medium", "high", "critical"] as const;

type Props = {
  onSubmit: (v: Record<string, unknown>) => void;
  loading: boolean;
};

export function CaseIntakeForm({ onSubmit, loading }: Props) {
  const [type, setType] = useState("physical");
  const [country, setCountry] = useState("Ethiopia");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [kebele, setKebele] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [anonymous, setAnonymous] = useState(false);
  const [summary, setSummary] = useState("");

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          type,
          country,
          region,
          district,
          kebele,
          urgency,
          anonymous,
          summary: summary || undefined,
        });
      }}
    >
      <div className="grid gap-2">
        <Label>Type</Label>
        <select
          className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label>Country</Label>
        <Input className="rounded-xl" value={country} onChange={(e) => setCountry(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label>Region</Label>
        <Input className="rounded-xl" value={region} onChange={(e) => setRegion(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label>District</Label>
        <Input className="rounded-xl" value={district} onChange={(e) => setDistrict(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label>Kebele</Label>
        <Input className="rounded-xl" value={kebele} onChange={(e) => setKebele(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label>Urgency</Label>
        <select
          className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
          value={urgency}
          onChange={(e) => setUrgency(e.target.value)}
        >
          {URGENCY.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
        />
        Anonymous report
      </label>
      <div className="grid gap-2">
        <Label>Summary</Label>
        <textarea
          className="min-h-[88px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full rounded-xl" disabled={loading}>
        {loading ? "Saving…" : "Create case"}
      </Button>
    </form>
  );
}
