import type { FollowUpDraft } from "@/lib/domain/types";
import { queueApprovalAction } from "@/app/actions/approvals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FollowUpComposerProps {
  dealId: string;
  draft: FollowUpDraft;
}

export function FollowUpComposer({ dealId, draft }: FollowUpComposerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-['Sora',sans-serif]">Follow-up Draft</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm text-zinc-700">
          <p>
            <span className="font-semibold text-zinc-900">Subject:</span> {draft.subject}
          </p>
          <p>{draft.body}</p>
          <p>
            <span className="font-semibold text-zinc-900">Ask:</span> {draft.ask}
          </p>
          <p>
            <span className="font-semibold text-zinc-900">Suggested window:</span> {draft.ctaTimeWindow}
          </p>
        </div>

        <form action={queueApprovalAction} className="mt-4 flex gap-2">
          <input type="hidden" name="dealId" value={dealId} />
          <input type="hidden" name="channel" value="email" />
          <input type="hidden" name="subject" value={draft.subject} />
          <input type="hidden" name="body" value={draft.body} />
          <Button type="submit" variant="success">
            Queue Approval
          </Button>
          <Button type="button" variant="outline">
            Edit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
