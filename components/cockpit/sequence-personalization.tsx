"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Contact, Deal, Signal } from "@/lib/domain/types";
import { buildSequencePlans } from "@/lib/services/capabilities";

interface SequencePersonalizationProps {
  contacts: Contact[];
  deal: Deal;
  signals: Signal[];
}

export function SequencePersonalization({ contacts, deal, signals }: SequencePersonalizationProps) {
  const router = useRouter();
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const plans = buildSequencePlans(contacts, deal, signals);

  async function handleLaunch(plan: (typeof plans)[number]) {
    if (launchingId) {
      return;
    }

    setLaunchingId(plan.id);
    toast.loading("Launching sequence...", { id: `sequence-launch-${plan.id}` });

    try {
      const response = await fetch("/api/sequences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dealId: deal.id,
          contactId: plan.contactId,
          title: `${plan.contactName} · ${deal.stage} follow-up`,
          channelMix: plan.channelMix,
          steps: plan.steps.map((instruction, index) => ({
            channel: plan.channelMix[index % plan.channelMix.length],
            instruction
          }))
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(payload?.error ?? "Failed to launch sequence.", { id: `sequence-launch-${plan.id}` });
        return;
      }

      toast.success("Sequence launched.", { id: `sequence-launch-${plan.id}` });
      router.refresh();
    } catch {
      toast.error("Failed to launch sequence.", { id: `sequence-launch-${plan.id}` });
    } finally {
      setLaunchingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-['Sora',sans-serif]">Sequence Personalization</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {plans.map((plan) => (
            <li key={plan.id} className=" border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-3 dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--foreground))]">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))] dark:text-[hsl(var(--foreground))]">
                  <Link
                    href={`/contacts/${plan.contactId}` as "/contacts"}
                    className="hover:text-[hsl(var(--primary))] hover:underline"
                  >
                    {plan.contactName}
                  </Link>
                  {" · "}{plan.role}
                </p>
                <Badge variant="outline">{plan.channelMix.join(" · ")}</Badge>
              </div>
              <ol className="space-y-1 text-xs text-[hsl(var(--muted-foreground))] dark:text-[hsl(var(--muted-foreground))]">
                {plan.steps.map((step) => (
                  <li key={step}>• {step}</li>
                ))}
              </ol>
              <Button
                type="button"
                size="sm"
                className="mt-3 w-full"
                disabled={launchingId !== null}
                onClick={() => handleLaunch(plan)}
              >
                {launchingId === plan.id ? "Launching..." : "Launch Sequence"}
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
