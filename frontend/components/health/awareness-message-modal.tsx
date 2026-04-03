"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createHealthMessage } from "@/services/modules/healthService";
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

export function AwarenessMessageModal({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState("cervical_cancer");

  const createMut = useMutation({
    mutationFn: () =>
      createHealthMessage({
        title,
        body,
        channel: "sms",
        audience: "women_18_",
        topic,
        language: "am",
      }),
    onSuccess: () => {
      toast.success("Message saved");
      setTitle("");
      setBody("");
      onOpenChange(false);
      void qc.invalidateQueries({ queryKey: ["health-messages"] });
    },
    onError: () => toast.error("Failed to save message"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>New awareness message</DialogTitle>
          <DialogDescription>SMS / IVR-style content for awareness broadcasts.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Topic</Label>
            <select
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              <option value="cervical_cancer">Cervical cancer prevention & care</option>
              <option value="breast_self_exam">Breast self-examination</option>
              <option value="general">General wellness</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input className="rounded-xl" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <textarea
              className="min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              disabled={!title || !body || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              {createMut.isPending ? "Saving…" : "Save message"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
