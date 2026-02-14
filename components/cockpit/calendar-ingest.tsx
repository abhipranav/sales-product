import { ingestCalendarEventAction } from "@/app/actions/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface CalendarIngestProps {
  dealId: string;
}

export function CalendarIngest({ dealId }: CalendarIngestProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-['Sora',sans-serif]">Calendar Ingest</CardTitle>
        <CardDescription>Use this to pull a call into activity history and audit log.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={ingestCalendarEventAction} className="grid gap-2">
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
          <Button type="submit" className="w-fit">
            Ingest Event
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
