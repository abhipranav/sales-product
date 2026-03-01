"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface CalendarIngestProps {
  dealId: string;
}

export function CalendarIngest({ dealId }: CalendarIngestProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const startsAtInput = String(formData.get("startsAt") ?? "").trim();
    const endsAtInput = String(formData.get("endsAt") ?? "").trim();
    const startsAt = new Date(startsAtInput);
    const endsAt = new Date(endsAtInput);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      toast.error("Please provide valid start and end times.");
      return;
    }

    setIsSubmitting(true);
    toast.loading("Ingesting calendar event...", { id: "calendar-ingest" });

    try {
      const response = await fetch("/api/calendar/events/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dealId: String(formData.get("dealId") ?? "").trim(),
          title: String(formData.get("title") ?? "").trim(),
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          organizerEmail: String(formData.get("organizerEmail") ?? "").trim() || undefined,
          attendees: String(formData.get("attendees") ?? "")
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          summary: String(formData.get("summary") ?? "").trim() || undefined,
          source: String(formData.get("source") ?? "manual-cockpit").trim()
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(payload?.error ?? "Failed to ingest calendar event.", { id: "calendar-ingest" });
        return;
      }

      toast.success("Calendar event ingested.", { id: "calendar-ingest" });
      form.reset();
      router.refresh();
    } catch {
      toast.error("Failed to ingest calendar event.", { id: "calendar-ingest" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-['Sora',sans-serif]">Calendar Ingest</CardTitle>
        <CardDescription>Use this to pull a call into activity history and audit log.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-2">
          <input type="hidden" name="dealId" value={dealId} />
          <Input name="title" required placeholder="Event title" />
          <div className="grid gap-2 md:grid-cols-2">
            <Input type="datetime-local" name="startsAt" required />
            <Input type="datetime-local" name="endsAt" required />
          </div>
          <Input name="organizerEmail" placeholder="Organizer email" />
          <Input name="attendees" placeholder="Attendees (comma-separated emails)" />
          <Input name="summary" placeholder="Summary" />
          <input type="hidden" name="source" value="manual-cockpit" />
          <Button type="submit" className="w-fit" disabled={isSubmitting}>
            {isSubmitting ? "Ingesting..." : "Ingest Event"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
