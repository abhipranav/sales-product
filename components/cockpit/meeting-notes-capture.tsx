"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface MeetingNotesCaptureProps {
  dealId: string;
}

export function MeetingNotesCapture({ dealId }: MeetingNotesCaptureProps) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [happenedAt, setHappenedAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const trimmed = notes.trim();
    if (trimmed.length < 20) {
      toast.error("Please add at least 20 characters of notes.");
      return;
    }

    setIsSubmitting(true);
    toast.loading("Processing meeting notes...", { id: `notes-${dealId}` });

    try {
      const body: { dealId: string; notes: string; source: string; happenedAt?: string } = {
        dealId,
        notes: trimmed,
        source: "cockpit-notes"
      };

      if (happenedAt.trim()) {
        const date = new Date(happenedAt);
        if (Number.isNaN(date.getTime())) {
          toast.error("Invalid date/time value.", { id: `notes-${dealId}` });
          setIsSubmitting(false);
          return;
        }
        body.happenedAt = date.toISOString();
      }

      const response = await fetch("/api/meetings/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(payload?.error ?? "Failed to process meeting notes.", { id: `notes-${dealId}` });
        return;
      }

      toast.success("Notes processed. Brief, follow-up draft, and tasks updated.", { id: `notes-${dealId}` });
      setNotes("");
      setHappenedAt("");
      router.refresh();
    } catch {
      toast.error("Failed to process meeting notes.", { id: `notes-${dealId}` });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-['Sora',sans-serif]">Meeting Notes to Actions</CardTitle>
        <CardDescription>Paste call notes to auto-update activity, meeting brief, follow-up draft, and next tasks.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-2">
          <Textarea
            name="notes"
            required
            minLength={20}
            rows={5}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Paste your meeting notes here..."
          />
          <Input
            type="datetime-local"
            name="happenedAt"
            value={happenedAt}
            onChange={(event) => setHappenedAt(event.target.value)}
          />
          <Button type="submit" className="w-fit" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Process Notes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
