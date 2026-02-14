import type { MeetingBrief } from "@/lib/domain/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MeetingBriefCardProps {
  brief: MeetingBrief;
}

export function MeetingBriefCard({ brief }: MeetingBriefCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-['Sora',sans-serif]">Meeting Prep Brief</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-zinc-700">{brief.primaryGoal}</p>

        <div className="mt-4 grid gap-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Likely objections</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
              {brief.likelyObjections.map((objection) => (
                <li key={objection}>{objection}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Narrative</h3>
            <p className="mt-2 text-sm text-zinc-700">{brief.recommendedNarrative}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
