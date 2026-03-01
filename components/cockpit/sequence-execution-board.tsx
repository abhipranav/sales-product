"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { Contact } from "@/lib/domain/types";

interface SequenceExecutionStepView {
  id: string;
  order: number;
  channel: string;
  instruction: string;
  status: "todo" | "in-progress" | "done" | "skipped";
  outcome: string | null;
  completedAt: string | null;
}

interface SequenceExecutionView {
  id: string;
  title: string;
  status: "active" | "completed";
  dealId: string;
  dealName: string;
  contactId: string | null;
  contactName: string | null;
  channelMix: string[];
  createdBy: string;
  createdAt: string;
  steps: SequenceExecutionStepView[];
}

interface SequenceExecutionBoardProps {
  dealId: string;
  contacts: Contact[];
  sequences: SequenceExecutionView[];
}

const sequenceTemplate = [
  "Send tailored summary of meeting outcomes and urgency context.",
  "Run voice touchpoint to align blockers and decision criteria.",
  "Share proof asset and book explicit next-step commitment."
].join("\n");

const allowedChannels = new Set(["email", "phone", "linkedin", "meeting"]);

function parseChannels(rawChannels: string) {
  const channels = rawChannels
    .split(",")
    .map((channel) => channel.trim().toLowerCase())
    .filter((channel) => allowedChannels.has(channel));

  if (channels.length > 0) {
    return channels;
  }

  return ["email", "phone", "linkedin"];
}

function parseSteps(rawStepsText: string, channels: string[]) {
  const lines = rawStepsText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((instruction, index) => ({
    channel: channels[index % channels.length] ?? "email",
    instruction
  }));
}

export function SequenceExecutionBoard({ dealId, contacts, sequences }: SequenceExecutionBoardProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [busyStepId, setBusyStepId] = useState<string | null>(null);

  async function handleCreateSequence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreating) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const channels = parseChannels(String(formData.get("channels") ?? ""));
    const steps = parseSteps(String(formData.get("stepsText") ?? ""), channels);

    if (steps.length === 0) {
      toast.error("Add at least one sequence step.");
      return;
    }

    setIsCreating(true);
    toast.loading("Creating sequence...", { id: "sequence-create" });

    try {
      const response = await fetch("/api/sequences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dealId: String(formData.get("dealId") ?? "").trim(),
          contactId: String(formData.get("contactId") ?? "").trim() || undefined,
          title: String(formData.get("title") ?? "").trim(),
          channelMix: channels,
          steps
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(payload?.error ?? "Failed to create sequence.", { id: "sequence-create" });
        return;
      }

      toast.success("Sequence created.", { id: "sequence-create" });
      form.reset();
      router.refresh();
    } catch {
      toast.error("Failed to create sequence.", { id: "sequence-create" });
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdateStep(event: FormEvent<HTMLFormElement>, stepId: string) {
    event.preventDefault();
    if (busyStepId) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    setBusyStepId(stepId);
    toast.loading("Updating sequence step...", { id: `sequence-step-${stepId}` });

    try {
      const response = await fetch(`/api/sequences/steps/${stepId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: String(formData.get("status") ?? "").trim() || undefined,
          outcome: String(formData.get("outcome") ?? "").trim() || undefined
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(payload?.error ?? "Failed to update sequence step.", { id: `sequence-step-${stepId}` });
        return;
      }

      toast.success("Sequence step updated.", { id: `sequence-step-${stepId}` });
      router.refresh();
    } catch {
      toast.error("Failed to update sequence step.", { id: `sequence-step-${stepId}` });
    } finally {
      setBusyStepId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="font-['Sora',sans-serif]">Sequence Execution Board</CardTitle>
        <Badge variant="secondary">{sequences.length} active records</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={handleCreateSequence}
          className="grid gap-2 border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3"
        >
          <input type="hidden" name="dealId" value={dealId} />
          <Input name="title" required minLength={3} maxLength={180} placeholder="Sequence title..." />
          <div className="grid gap-2 md:grid-cols-2">
            <NativeSelect name="contactId" defaultValue="">
              <option value="">No specific contact</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.fullName} · {contact.role}
                </option>
              ))}
            </NativeSelect>
            <Input
              name="channels"
              defaultValue="email,phone,linkedin"
              placeholder="Channels (comma separated)"
              aria-label="Channels"
            />
          </div>
          <Textarea name="stepsText" rows={4} defaultValue={sequenceTemplate} />
          <Button type="submit" disabled={isCreating}>
            {isCreating ? "Creating..." : "Create Sequence"}
          </Button>
        </form>

        {sequences.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No sequence records yet. Create one above to start execution tracking.</p>
        ) : (
          <ul className="space-y-4">
            {sequences.map((sequence) => (
              <li key={sequence.id} className=" border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--foreground))]">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))] dark:text-[hsl(var(--foreground))]">{sequence.title}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] dark:text-[hsl(var(--muted-foreground))]">
                      <Link
                        href={`/pipeline/${sequence.dealId}` as "/pipeline"}
                        className="text-[hsl(var(--primary))] hover:underline"
                      >
                        {sequence.dealName}
                      </Link>
                      {sequence.contactName && sequence.contactId ? (
                        <>
                          {" · "}
                          <Link
                            href={`/contacts/${sequence.contactId}` as "/contacts"}
                            className="text-[hsl(var(--primary))] hover:underline"
                          >
                            {sequence.contactName}
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={sequence.status === "completed" ? "success" : "warning"}>{sequence.status}</Badge>
                    <Badge variant="outline">{sequence.channelMix.join(" · ")}</Badge>
                  </div>
                </div>

                <ol className="space-y-2">
                  {sequence.steps.map((step) => (
                    <li key={step.id} className=" border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-2 dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--foreground))]">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))] dark:text-[hsl(var(--muted-foreground))]">
                        Step {step.order} · {step.channel}
                      </p>
                      <p className="mt-1 text-sm text-[hsl(var(--foreground))] dark:text-[hsl(var(--foreground))]">{step.instruction}</p>
                      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] dark:text-[hsl(var(--muted-foreground))]">
                        {step.completedAt ? `Completed ${new Date(step.completedAt).toLocaleString()}` : "Not completed"}
                      </p>
                      <form
                        onSubmit={(event) => handleUpdateStep(event, step.id)}
                        className="mt-2 grid gap-2 md:grid-cols-[0.8fr_1.2fr_auto]"
                      >
                        <NativeSelect name="status" defaultValue={step.status} disabled={busyStepId !== null}>
                          <option value="todo">todo</option>
                          <option value="in-progress">in-progress</option>
                          <option value="done">done</option>
                          <option value="skipped">skipped</option>
                        </NativeSelect>
                        <Input
                          name="outcome"
                          defaultValue={step.outcome ?? ""}
                          placeholder="Outcome note (optional)"
                          aria-label="Outcome note"
                          disabled={busyStepId !== null}
                        />
                        <Button type="submit" variant="outline" disabled={busyStepId !== null}>
                          Save
                        </Button>
                      </form>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
