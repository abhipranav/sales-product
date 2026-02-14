import { processMeetingNotesAction } from "@/app/actions/meeting-notes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface MeetingNotesCaptureProps {
  dealId: string;
}

export function MeetingNotesCapture({ dealId }: MeetingNotesCaptureProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-['Sora',sans-serif]">Meeting Notes to Actions</CardTitle>
        <CardDescription>
          Paste call notes to auto-update activity, meeting brief, follow-up draft, and next tasks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={processMeetingNotesAction} className="grid gap-2">
          <input type="hidden" name="dealId" value={dealId} />
          <Textarea name="notes" required minLength={20} rows={5} placeholder="Paste your meeting notes here..." />
          <Input type="datetime-local" name="happenedAt" />
          <Button type="submit" className="w-fit">
            Process Notes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
