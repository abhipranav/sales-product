"use client";

import type { FollowUpDraft } from "@/lib/domain/types";
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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface FollowUpComposerProps {
  dealId: string;
  draft: FollowUpDraft;
}

export function FollowUpComposer({ dealId, draft }: FollowUpComposerProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [ask, setAsk] = useState(draft.ask);
  const [ctaTimeWindow, setCtaTimeWindow] = useState(draft.ctaTimeWindow);

  async function handleRegenerate() {
    if (isRegenerating) {
      return;
    }

    setIsRegenerating(true);
    toast.loading("Generating follow-up draft...", { id: `followup-${dealId}` });

    try {
      const response = await fetch(`/api/followups/${dealId}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.draft) {
        toast.error(payload?.error ?? "Failed to generate follow-up draft.", { id: `followup-${dealId}` });
        return;
      }

      setSubject(payload.draft.subject);
      setBody(payload.draft.body);
      setAsk(payload.draft.ask);
      setCtaTimeWindow(payload.draft.ctaTimeWindow);
      toast.success(`Follow-up draft regenerated (${payload.source ?? "rule-based"}).`, { id: `followup-${dealId}` });
    } catch {
      toast.error("Failed to generate follow-up draft.", { id: `followup-${dealId}` });
    } finally {
      setIsRegenerating(false);
    }
  }

  async function handleSaveDraft() {
    if (isSavingDraft) {
      return;
    }

    setIsSavingDraft(true);
    toast.loading("Saving follow-up draft...", { id: `followup-save-${dealId}` });

    try {
      const response = await fetch(`/api/followups/${dealId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          subject,
          body,
          ask,
          ctaTimeWindow
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.draft) {
        toast.error(payload?.error ?? "Failed to save follow-up draft.", { id: `followup-save-${dealId}` });
        return;
      }

      setSubject(payload.draft.subject);
      setBody(payload.draft.body);
      setAsk(payload.draft.ask);
      setCtaTimeWindow(payload.draft.ctaTimeWindow);
      setIsEditOpen(false);
      toast.success("Follow-up draft saved.", { id: `followup-save-${dealId}` });
      router.refresh();
    } catch {
      toast.error("Failed to save follow-up draft.", { id: `followup-save-${dealId}` });
    } finally {
      setIsSavingDraft(false);
    }
  }

  async function handleQueueApproval() {
    if (isQueueing) {
      return;
    }

    setIsQueueing(true);
    toast.loading("Queueing approval...", { id: `approval-queue-${dealId}` });

    try {
      const response = await fetch("/api/approvals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dealId,
          channel: "email",
          subject,
          body: `${body}\n\nAsk: ${ask}\nWindow: ${ctaTimeWindow}`
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(payload?.error ?? "Failed to queue approval.", { id: `approval-queue-${dealId}` });
        return;
      }

      toast.success("Draft queued for approval.", { id: `approval-queue-${dealId}` });
      router.refresh();
    } catch {
      toast.error("Failed to queue approval.", { id: `approval-queue-${dealId}` });
    } finally {
      setIsQueueing(false);
    }
  }

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

          <div className="mt-4 flex gap-2">
            <Button type="button" variant="success" onClick={handleQueueApproval} disabled={isQueueing}>
              {isQueueing ? "Queueing..." : "Queue Approval"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(true)}>
              Edit
            </Button>
            <Button type="button" variant="outline" onClick={handleRegenerate} disabled={isRegenerating}>
              {isRegenerating ? "Generating..." : "Regenerate"}
            </Button>
          </div>
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
            <Button type="button" variant="cta" onClick={handleSaveDraft} disabled={isSavingDraft}>
              {isSavingDraft ? "Saving..." : "Save Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
