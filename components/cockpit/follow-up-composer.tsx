"use client";

import type { FollowUpDraft } from "@/lib/domain/types";
import { queueApprovalAction } from "@/app/actions/approvals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useState } from "react";

interface FollowUpComposerProps {
  dealId: string;
  draft: FollowUpDraft;
}

export function FollowUpComposer({ dealId, draft }: FollowUpComposerProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [ask, setAsk] = useState(draft.ask);
  const [ctaTimeWindow, setCtaTimeWindow] = useState(draft.ctaTimeWindow);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-['Sora',sans-serif]">Follow-up Draft</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
            <p>
              <span className="font-semibold text-[hsl(var(--foreground))]">Subject:</span> {subject}
            </p>
            <p className="whitespace-pre-wrap">{body}</p>
            <p>
              <span className="font-semibold text-[hsl(var(--foreground))]">Ask:</span> {ask}
            </p>
            <p>
              <span className="font-semibold text-[hsl(var(--foreground))]">Suggested window:</span> {ctaTimeWindow}
            </p>
          </div>

          <form action={queueApprovalAction} className="mt-4 flex gap-2">
            <input type="hidden" name="dealId" value={dealId} />
            <input type="hidden" name="channel" value="email" />
            <input type="hidden" name="subject" value={subject} />
            <input type="hidden" name="body" value={`${body}\n\nAsk: ${ask}\nWindow: ${ctaTimeWindow}`} />
            <Button type="submit" variant="success">
              Queue Approval
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(true)}>
              Edit
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogClose onClose={() => setIsEditOpen(false)} />
          <DialogHeader>
            <DialogTitle>EDIT FOLLOW-UP DRAFT</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="follow-up-subject">Subject</Label>
              <Input
                id="follow-up-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="follow-up-body">Body</Label>
              <Textarea
                id="follow-up-body"
                value={body}
                rows={6}
                onChange={(event) => setBody(event.target.value)}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="follow-up-ask">Ask</Label>
                <Input
                  id="follow-up-ask"
                  value={ask}
                  onChange={(event) => setAsk(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="follow-up-window">Suggested window</Label>
                <Input
                  id="follow-up-window"
                  value={ctaTimeWindow}
                  onChange={(event) => setCtaTimeWindow(event.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
              Close
            </Button>
            <Button type="button" variant="cta" onClick={() => setIsEditOpen(false)}>
              Save Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
