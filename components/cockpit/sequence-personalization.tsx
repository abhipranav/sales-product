import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSequenceExecutionAction } from "@/app/actions/sequences";
import type { Contact, Deal, Signal } from "@/lib/domain/types";
import { buildSequencePlans } from "@/lib/services/capabilities";

interface SequencePersonalizationProps {
  contacts: Contact[];
  deal: Deal;
  signals: Signal[];
}

export function SequencePersonalization({ contacts, deal, signals }: SequencePersonalizationProps) {
  const plans = buildSequencePlans(contacts, deal, signals);

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
              <form action={createSequenceExecutionAction} className="mt-3">
                <input type="hidden" name="dealId" value={deal.id} />
                <input type="hidden" name="contactId" value={plan.contactId} />
                <input type="hidden" name="title" value={`${plan.contactName} · ${deal.stage} follow-up`} />
                <input type="hidden" name="channelMix" value={JSON.stringify(plan.channelMix)} />
                <input
                  type="hidden"
                  name="steps"
                  value={JSON.stringify(
                    plan.steps.map((instruction, index) => ({
                      channel: plan.channelMix[index % plan.channelMix.length],
                      instruction
                    }))
                  )}
                />
                <Button type="submit" size="sm" className="w-full">
                  Launch Sequence
                </Button>
              </form>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
